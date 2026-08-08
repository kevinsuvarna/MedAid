export async function POST(request) {
  try {
    const { systemPrompt, userPrompt } = await request.json();
    const apiKey = process.env.VITE_GROQ_API_KEY;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      return Response.json({ error: true }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return Response.json({ error: true }, { status: 502 });
    }

    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: true }, { status: 500 });
  }
}
