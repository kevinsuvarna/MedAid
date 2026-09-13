// Dedicated route for CBC report image extraction via OpenAI's vision model.
// Kept separate from /api/openai-text (plain-text generation, no images, no
// strict JSON schema) rather than folding both use cases into one route.
export const maxDuration = 30;

const MODEL = 'gpt-4o-mini';

export async function POST(request) {
  try {
    const { systemPrompt, userPrompt, imageDataUrls, jsonSchema } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: true, detail: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }
    if (!Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
      return Response.json({ error: true, detail: 'imageDataUrls is required' }, { status: 400 });
    }

    const userContent = [
      { type: 'text', text: userPrompt },
      ...imageDataUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
    ];

    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      // Zero temperature for extraction, not generation — this is reading
      // values off a document, not composing text, so there's no benefit to
      // sampling variance and it measurably increased the risk of a
      // confident-but-wrong guess (e.g. patient sex flipped to the wrong
      // value on a rerun of the exact same image) versus correctly
      // returning null for an unreadable/absent field.
      temperature: 0,
      // Strict JSON-schema mode guarantees a response that validates against
      // the schema — no markdown fences, no free-text preamble, no risk of
      // the model returning malformed JSON the way a plain "respond with
      // JSON" instruction can. Removes an entire class of parsing failures
      // that the Groq path had to defensively guard against.
      response_format: jsonSchema
        ? { type: 'json_schema', json_schema: { name: 'cbc_report', schema: jsonSchema, strict: true } }
        : { type: 'json_object' },
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
      console.error('[api/openai-vision] OpenAI API error', res.status, errBody);
      return Response.json({ error: true, upstreamStatus: res.status, detail: errBody.slice(0, 1000) }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error('[api/openai-vision] Empty content in OpenAI response', JSON.stringify(data).slice(0, 1000));
      return Response.json({ error: true, detail: 'empty content' }, { status: 502 });
    }

    return Response.json({ text });
  } catch (e) {
    console.error('[api/openai-vision] Route threw', e);
    return Response.json({ error: true, detail: String(e && e.message) }, { status: 500 });
  }
}
