// Dedicated route for plain-text OpenAI chat completions (Ask My Doc
// suggested questions, doctor questions) — kept separate from
// /api/openai-vision (image extraction, strict JSON schema, zero
// temperature) since this path has no images and wants normal sampling.
export const maxDuration = 30;

const MODEL = 'gpt-4o-mini';

export async function POST(request) {
  try {
    const { systemPrompt, userPrompt } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: true, detail: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[api/openai-text] OpenAI API error', res.status, errBody);
      return Response.json({ error: true, upstreamStatus: res.status, detail: errBody.slice(0, 1000) }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error('[api/openai-text] Empty content in OpenAI response', JSON.stringify(data).slice(0, 1000));
      return Response.json({ error: true, detail: 'empty content' }, { status: 502 });
    }

    return Response.json({ text });
  } catch (e) {
    console.error('[api/openai-text] Route threw', e);
    return Response.json({ error: true, detail: String(e && e.message) }, { status: 500 });
  }
}
