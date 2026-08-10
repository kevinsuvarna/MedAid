const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'qwen/qwen3.6-27b';

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
      // JSON answer before it's ever reached.
      body.reasoning_format = 'hidden';
      body.max_completion_tokens = 4096;
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
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
