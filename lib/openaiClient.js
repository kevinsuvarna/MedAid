// Client-side helper for the OpenAI vision route — keeps pdfExtractor.js's
// call sites shape ({ok, text} or {ok, status, detail}) stable regardless of
// provider.
async function postToOpenAiVisionRaw(payload) {
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
  return postToOpenAiVisionRaw({ systemPrompt, userPrompt, imageDataUrls, jsonSchema });
}

// Plain-text counterpart used by screens that generate patient-facing
// questions from report data (Ask My Doc, doctor questions) — resolves to
// the text or a fallback string, never rejects, so callers don't need a
// try/catch around every call.
async function postToOpenAiTextRaw(payload) {
  try {
    const res = await fetch('/api/openai-text', {
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

export async function callOpenAiText(systemPrompt, userPrompt) {
  const result = await postToOpenAiTextRaw({ systemPrompt, userPrompt });
  return result.ok ? result.text : 'Could not load response. Please try again.';
}
