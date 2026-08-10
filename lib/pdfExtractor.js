import { callGroq, callGroqVisionDetailed } from '@/lib/groqClient';
import { showToast } from '@/lib/toast';

const PDFJS_VERSION = '3.11.174';
const PDFJS_SCRIPT_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// Below this many non-whitespace characters, treat the PDF as having no real
// text layer (e.g. a scanned report or an image pasted into a PDF) and fall
// back to rendering pages as images for a vision model instead.
const MIN_USABLE_TEXT_LENGTH = 50;
const MAX_OCR_PAGES = 5;

// The only vision-capable model on Groq right now (qwen/qwen3.6-27b) is a
// reasoning model with a tight 8000 tokens/minute free-tier cap, and a single
// full-resolution page already used ~7000 of that. Rendering at a lower scale
// cuts a single request to ~2300 prompt tokens, leaving real headroom.
const OCR_RENDER_SCALE = 1.5;

// 'smartreport_data' holds the raw extracted result exactly as returned by
// Groq (JSON.stringify(result), no wrapper) — a cache hit here is returned
// immediately with no Groq call at all. The companion fingerprint key is the
// safety net on top: it lets a swapped-in report.pdf still be detected and
// re-extracted automatically, instead of the cache serving stale data forever.
const CACHE_KEY = 'smartreport_data';
const CACHE_FINGERPRINT_KEY = 'smartreport_data_fingerprint';

function readCache() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(data, fingerprint) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    if (fingerprint) localStorage.setItem(CACHE_FINGERPRINT_KEY, fingerprint);
  } catch (e) {
    // Storage full/unavailable — caching is an optimization, not required.
  }
}

export function clearReportCache() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_FINGERPRINT_KEY);
}

let pdfjsReadyPromise = null;

function loadPdfJs() {
  if (typeof window === 'undefined') return Promise.reject(new Error('pdf.js requires a browser environment'));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsReadyPromise) return pdfjsReadyPromise;

  pdfjsReadyPromise = new Promise((resolve, reject) => {
    function onReady() {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      resolve(window.pdfjsLib);
    }
    const existing = document.querySelector(`script[src="${PDFJS_SCRIPT_URL}"]`);
    if (existing) {
      if (window.pdfjsLib) {
        onReady();
      } else {
        existing.addEventListener('load', onReady, { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load pdf.js from CDN')), { once: true });
      }
      return;
    }
    const script = document.createElement('script');
    script.src = PDFJS_SCRIPT_URL;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error('Failed to load pdf.js from CDN'));
    document.head.appendChild(script);
  });

  return pdfjsReadyPromise;
}

async function renderPageToImageDataUrl(page, scale = OCR_RENDER_SCALE) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

async function loadPdfDocument(arrayBuffer) {
  const pdfjsLib = await loadPdfJs();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  const pageTexts = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str).join(' '));
    pages.push(page);
  }
  return { pages, rawText: pageTexts.join('\n\n') };
}

const EXTRACT_SYSTEM_PROMPT =
  'You are a medical data parser. Extract CBC values from an Indian lab report, ' +
  'provided either as raw text or as an image of the report. ' +
  'Return ONLY a valid JSON object, no explanation, no markdown. ' +
  "If a parameter is missing from the report, set its value to null.";

const JSON_SHAPE = `{
  patient: { name, age, sex, date },
  rbc: {
    rbc_count:   { value, unit, ref_low, ref_high, flag },
    haemoglobin: { value, unit, ref_low, ref_high, flag },
    pcv:         { value, unit, ref_low, ref_high, flag },
    mcv:         { value, unit, ref_low, ref_high, flag },
    mch:         { value, unit, ref_low, ref_high, flag },
    mchc:        { value, unit, ref_low, ref_high, flag },
    rdw_cv:      { value, unit, ref_low, ref_high, flag }
  },
  wbc: {
    total_wbc:    { value, unit, ref_low, ref_high, flag },
    neutrophils:  { value, unit, ref_low, ref_high, flag },
    lymphocytes:  { value, unit, ref_low, ref_high, flag },
    monocytes:    { value, unit, ref_low, ref_high, flag },
    eosinophils:  { value, unit, ref_low, ref_high, flag },
    basophils:    { value, unit, ref_low, ref_high, flag }
  },
  platelets: {
    platelet_count: { value, unit, ref_low, ref_high, flag },
    mpv:            { value, unit, ref_low, ref_high, flag }
  }
}`;

const FLAG_RULE =
  "flag must be one of: 'normal', 'high', 'low', 'borderline'. Derive from report flags/labels " +
  '(e.g. High/Low/Borderline, or colored/bold text) or by comparing value to ref_low and ref_high if no flag is shown.';

function buildTextUserPrompt(rawText) {
  return `Extract these parameters from the following CBC report text. Return this exact JSON shape:
${JSON_SHAPE}
${FLAG_RULE}
Raw text: ${rawText}`;
}

function buildImageUserPrompt() {
  return `Extract these parameters from the attached CBC lab report image(s). Return this exact JSON shape:
${JSON_SHAPE}
${FLAG_RULE}
Read every row of the report table carefully, including small print and differential WBC counts.`;
}

function stripCodeFences(text) {
  return text
    .trim()
    // Reasoning models can emit a <think>...</think> block before the answer
    // even with reasoning_format:'hidden' requested — strip it defensively.
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// Models occasionally append stray trailing content after a perfectly valid
// JSON object (a known LLM quirk, not truncation). Parsing the whole string
// fails on that trailing garbage even though the object itself is intact, so
// find the first balanced {...} — respecting quoted strings — and parse only
// that, ignoring anything before or after it.
function extractFirstJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function tryParse(text) {
  const candidate = extractFirstJsonObject(stripCodeFences(text));
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

async function extractViaText(rawText) {
  const userPrompt = buildTextUserPrompt(rawText);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await callGroq(EXTRACT_SYSTEM_PROMPT, userPrompt);
    const parsed = tryParse(response);
    if (parsed) return parsed;
  }
  return null;
}

// Only retries on a genuine parse/format failure. Retrying after a 429 is
// pointless — the request already used most of the per-minute token budget,
// so an immediate second attempt is essentially guaranteed to 429 again.
async function extractViaVision(pages) {
  const imageDataUrls = [];
  for (let i = 0; i < Math.min(pages.length, MAX_OCR_PAGES); i += 1) {
    imageDataUrls.push(await renderPageToImageDataUrl(pages[i]));
  }
  const userPrompt = buildImageUserPrompt();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await callGroqVisionDetailed(EXTRACT_SYSTEM_PROMPT, userPrompt, imageDataUrls);
    if (!result.ok) {
      if (result.status === 429) {
        showToast('Groq rate limit reached for this report. Please wait about a minute and try again.');
        return null;
      }
      continue;
    }
    const parsed = tryParse(result.text);
    if (parsed) return parsed;
  }
  return null;
}

export async function extractReportData({ forceRefresh = false } = {}) {
  let headRes;
  try {
    headRes = await fetch('/reports/report.pdf', { method: 'HEAD', cache: 'no-store' });
  } catch (e) {
    showToast('Could not reach the report file. Please check your connection.');
    return null;
  }
  if (!headRes.ok) {
    showToast('No report found. Please add your CBC report and try again.');
    return null;
  }

  // Fingerprint the file so repeated app loads reuse a prior successful
  // extraction instead of re-spending the tight Groq vision token budget on
  // every reload — the report only needs re-reading once it actually changes.
  const fingerprint =
    headRes.headers.get('etag') || headRes.headers.get('last-modified') || headRes.headers.get('content-length') || '';

  if (!forceRefresh) {
    const cached = readCache();
    if (cached) {
      const cachedFingerprint = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_FINGERPRINT_KEY) : null;
      // No fingerprint to compare against (headers missing) or it matches the
      // cached one -> trust the cache and skip Groq entirely. Only a positive
      // mismatch forces a fresh extraction.
      if (!fingerprint || cachedFingerprint === fingerprint) return cached;
    }
  }

  let getRes;
  try {
    getRes = await fetch('/reports/report.pdf');
  } catch (e) {
    showToast('Could not reach the report file. Please check your connection.');
    return null;
  }
  if (!getRes.ok) {
    showToast('No report found. Please add your CBC report and try again.');
    return null;
  }

  let pages;
  let rawText;
  try {
    const buffer = await getRes.arrayBuffer();
    ({ pages, rawText } = await loadPdfDocument(buffer));
  } catch (e) {
    showToast('Could not read the PDF. It may be corrupted or unsupported.');
    return null;
  }

  const hasUsableText = rawText.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_LENGTH;

  let parsed = null;
  try {
    parsed = hasUsableText ? await extractViaText(rawText) : await extractViaVision(pages);
  } catch (e) {
    parsed = null;
  }

  if (!parsed) {
    showToast('Could not read your report data. Please try again.');
    return null;
  }
  writeCache(parsed, fingerprint);
  return parsed;
}
