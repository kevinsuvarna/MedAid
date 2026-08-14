// Default Vercel serverless function duration (10s on Hobby) would kill this
// route mid-retry — the rate-limit backoff below can wait 30-50s for Groq's
// per-minute window to clear. Without this, every retry attempt gets cut off
// by the platform before it ever completes, regardless of the code being
// correct, which is indistinguishable from the client's perspective from any
// other failure — it just silently never works in production.
export const maxDuration = 60;

const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'qwen/qwen3.6-27b';

// A single full-page vision request already costs ~6900 of Groq's 8000
// tokens-per-minute free-tier budget for this model (measured against real
// report images), so a second image-bearing call inside the same rolling
// 60s window always comes back 429 no matter how small the image is — this
// is a quota limit, not something request size can fix further. Groq's own
// 429 body reports exactly how long until the window has room again
// ("Please try again in Xs"); waiting that long and retrying turns a hard
// failure into a slower-but-reliable success instead of silently falling
// back to unreliable local OCR every time a report has more than one page.
const RATE_LIMIT_MAX_RETRIES = 2;

function parseRetryAfterSeconds(errBody) {
  const match = errBody.match(/try again in ([\d.]+)s/i);
  return match ? parseFloat(match[1]) : null;
}

async function callGroq(body, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  return res;
}

export async function POST(request) {
  try {
    const { systemPrompt, userPrompt, imageDataUrls } = await request.json();
    const apiKey = process.env.VITE_GROQ_API_KEY;

    const hasImages = Array.isArray(imageDataUrls) && imageDataUrls.length > 0;
    const userContent = hasImages
      ? [{ type: 'text', text: userPrompt }, ...imageDataUrls.map((url) => ({ type: 'image_url', image_url: { url } }))]
      : userPrompt;

    const body = {
      model: hasImages ? VISION_MODEL : TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    };
    if (hasImages) {
      // qwen/qwen3.6-27b is a reasoning model — without these it emits a long
      // <think> block first and Groq's default 1024-token cap truncates the
      // JSON answer before it's ever reached. Left at its default reasoning
      // effort, internal reasoning alone consumed the entire 4096-token
      // completion budget on a complex table image and returned empty
      // content (finish_reason: "length", 4096 reasoning tokens, 0 answer
      // tokens — observed against a real report). reasoning_effort: 'none'
      // (the only other value Groq accepts for this model besides 'default')
      // skips reasoning entirely so the full budget goes to the answer.
      // Raising max_completion_tokens instead would risk exceeding Groq's
      // 8000 tokens/minute cap outright on a single request.
      body.reasoning_format = 'hidden';
      body.reasoning_effort = 'none';
      body.max_completion_tokens = 4096;
    }

    let res = await callGroq(body, apiKey);
    let errBody = '';
    for (let attempt = 0; !res.ok && attempt < RATE_LIMIT_MAX_RETRIES; attempt += 1) {
      errBody = await res.text().catch(() => '');
      const isRateLimit = res.status === 429 && /rate_limit_exceeded/.test(errBody);
      const waitSeconds = isRateLimit ? parseRetryAfterSeconds(errBody) : null;
      if (waitSeconds === null) break;
      console.error(`[api/groq] Rate limited, retrying in ${waitSeconds}s (attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, (waitSeconds + 1) * 1000));
      res = await callGroq(body, apiKey);
    }

    if (!res.ok) {
      if (!errBody) errBody = await res.text().catch(() => '');
      console.error('[api/groq] Groq API error', res.status, errBody);
      return Response.json({ error: true, upstreamStatus: res.status, detail: errBody.slice(0, 1000) }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error('[api/groq] Empty content in Groq response', JSON.stringify(data).slice(0, 1000));
      return Response.json({ error: true, detail: 'empty content' }, { status: 502 });
    }

    return Response.json({ text });
  } catch (e) {
    console.error('[api/groq] Route threw', e);
    return Response.json({ error: true, detail: String(e && e.message) }, { status: 500 });
  }
}
