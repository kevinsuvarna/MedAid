// Client-side helper for the OpenAI vision route — mirrors groqClient.js's
// postToGroqRaw/callGroqVisionDetailed pattern so pdfExtractor.js can swap
// providers without touching its own call sites' shape ({ok, text} or
// {ok, status, detail}).
async function postToOpenAiRaw(payload) {
  try {
    const res = await fetch('/api/openai-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.text) {
      return { ok: false, status: data.upstreamStatus || res.status, detail: data.detail || '' };
    }
    return { ok: true, text: data.text };
  } catch (e) {
    return { ok: false, status: 0, detail: String(e && e.message) };
  }
}

// Surfaces the raw ok/status/detail (rather than collapsing failures into a
// fallback string) so callers like pdfExtractor.js can fall back to a
// different extraction path instead of showing a broken response.
export async function callOpenAiVisionDetailed(systemPrompt, userPrompt, imageDataUrls, jsonSchema) {
  return postToOpenAiRaw({ systemPrompt, userPrompt, imageDataUrls, jsonSchema });
}
