async function postToGroqRaw(payload) {
  try {
    const res = await fetch('/api/groq', {
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

export async function callGroq(systemPrompt, userPrompt) {
  const result = await postToGroqRaw({ systemPrompt, userPrompt });
  return result.ok ? result.text : 'Could not load response. Please try again.';
}

// For scanned/image-only PDFs where there's no text layer to extract — sends
// rendered page image(s) to a vision-capable Groq model instead of plain text.
export async function callGroqVision(systemPrompt, userPrompt, imageDataUrls) {
  const result = await postToGroqRaw({ systemPrompt, userPrompt, imageDataUrls });
  return result.ok ? result.text : 'Could not load response. Please try again.';
}

// Same as callGroqVision but surfaces the raw ok/status/detail instead of
// collapsing every failure into one fallback string — used by pdfExtractor so
// it can tell a rate limit (429, retrying is pointless) apart from a one-off
// parse failure (worth a retry).
export async function callGroqVisionDetailed(systemPrompt, userPrompt, imageDataUrls) {
  return postToGroqRaw({ systemPrompt, userPrompt, imageDataUrls });
}
