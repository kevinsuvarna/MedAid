const GROQ_ENABLED = false;

export async function callGroq(systemPrompt, userPrompt) {
  if (!GROQ_ENABLED) return 'Could not load response. Please try again.';
  try {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });
    if (!res.ok) throw new Error('Groq request failed');
    const data = await res.json();
    if (!data.text) throw new Error('Empty response');
    return data.text;
  } catch (e) {
    return 'Could not load response. Please try again.';
  }
}
