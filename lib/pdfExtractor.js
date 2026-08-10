import { createWorker } from 'tesseract.js';
import { showToast } from '@/lib/toast';

// Bump whenever parseResultColumnFromText's parsing logic changes. The
// report_id cache (reportCache.js, keyed only by report_id with no link to
// this file) stores this alongside each cached result — a mismatch means
// the cached data was parsed by older, since-fixed logic, so it's treated
// as a cache miss and the report is re-fetched and re-parsed. Without this,
// a browser that already cached a report before a parser fix would keep
// showing the old (broken) result indefinitely.
export const PARSER_VERSION = 3;

const PDFJS_VERSION = '3.11.174';
const PDFJS_SCRIPT_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// Below this many non-whitespace characters, treat the PDF as having no real
// text layer (e.g. a scanned report or an image pasted into a PDF) and fall
// back to rendering pages as images and running them through local OCR instead.
const MIN_USABLE_TEXT_LENGTH = 50;
const MAX_OCR_PAGES = 5;

// Tesseract runs locally (WASM, in-browser) rather than calling a hosted
// vision model, so there's no per-request token budget to economize for.
// Benchmarked at 2/3/4 on a real scanned report: 3 reads small print (e.g.
// "Male"/"Female", which the reference-range lookup depends on) reliably
// where 2 sometimes doesn't, for about the same OCR time; 4 gave no further
// improvement, just slower.
const OCR_RENDER_SCALE = 3;

// 'smartreport_data' holds the parsed result exactly as returned by
// parseResultColumnFromText (JSON.stringify(result), no wrapper) — a cache
// hit here is returned immediately with no re-parsing at all. The companion
// fingerprint key is the safety net on top: it lets a swapped-in report.pdf
// still be detected and re-extracted automatically, instead of the cache
// serving stale data forever.
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

// Cached across calls so the WASM core + English trained data (downloaded on
// first use) only has to load once per browser session, not once per page.
let tesseractWorkerPromise = null;

function loadTesseractWorker() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Tesseract requires a browser environment'));
  if (!tesseractWorkerPromise) tesseractWorkerPromise = createWorker('eng');
  return tesseractWorkerPromise;
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

// Renders each page to an image and runs it through local Tesseract OCR
// (no external API, no AI model) to build up a text layer the PDF doesn't
// have natively.
async function getOcrText(pages) {
  let worker;
  try {
    worker = await loadTesseractWorker();
  } catch (e) {
    showToast('Could not start OCR. Please try again.');
    return null;
  }

  const pageTexts = [];
  for (let i = 0; i < Math.min(pages.length, MAX_OCR_PAGES); i += 1) {
    const dataUrl = await renderPageToImageDataUrl(pages[i]);
    const { data } = await worker.recognize(dataUrl);
    pageTexts.push(data.text);
  }

  const rawText = pageTexts.join('\n\n');
  if (rawText.replace(/\s+/g, '').length < MIN_USABLE_TEXT_LENGTH) {
    showToast('Could not read any text from this report. Please try a clearer scan.');
    return null;
  }
  return rawText;
}

function numOrNull(match) {
  if (!match) return null;
  const n = parseFloat(match[1].replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

// The differential WBC row (Neutrophils/Lymphocytes/Monocytes/Eosinophils/
// Basophils) is printed in noticeably smaller type than the rest of the
// report, and OCR frequently misreads a single result digit as a
// visually-similar letter there — most often "7" -> "T", also "0" -> "O",
// "1" -> "I"/"l", "2" -> "Z", "5" -> "S", "8" -> "B", "9" -> "G"/"g". A plain
// \d-only capture then finds no number at all right after the label and the
// whole parameter comes back missing, even though every other row on the
// same page reads fine. Substituting those lookalikes back to digits (only
// inside the short token captured immediately after the label, so it can't
// touch unrelated words) recovers the value instead of dropping it.
const OCR_DIGIT_LOOKALIKES = { O: '0', o: '0', I: '1', i: '1', l: '1', Z: '2', z: '2', S: '5', s: '5', B: '8', T: '7', G: '9', g: '9' };
const OCR_NUMBER_TOKEN = '[0-9OoIilZzSsBTGg.]{1,6}';

function numOrNullOcrTolerant(match) {
  if (!match) return null;
  const normalized = match[1].replace(/[OoIilZzSsBTGg]/g, (ch) => OCR_DIGIT_LOOKALIKES[ch]).replace(/,/g, '');
  const n = parseFloat(normalized);
  return Number.isNaN(n) ? null : n;
}

function leaf(value) {
  // unit/ref_low/ref_high/flag intentionally omitted — CBC_REFERENCE_RANGES
  // (via getReferenceRanges in lib/data.js) is the only source of ranges/units
  // now; only the Result-column value is read from the report itself.
  return { value, unit: null, ref_low: null, ref_high: null, flag: null };
}

// Deterministic regex parse of the Result column only — no AI/LLM call.
// Tuned against real OCR/text-layer output from Indian CBC lab reports:
// each row is "Label <result> [Low/High/Borderline] <ref_low>-<ref_high> <unit>",
// so grabbing the first number after the label is always the Result value.
function parseResultColumnFromText(rawText) {
  const ageLine = rawText.match(/Age\s*:?\s*(\d{1,3})/i);
  const sexMatch = rawText.match(/\b(Male|Female)\b/i);
  const dateMatch = rawText.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?(?:\s*,?\s*\d{4})?)/i);

  // Best-effort: the patient's name is typically the non-empty line right
  // above the "Age :" line in these reports' text layout.
  let name = null;
  const ageLineIdx = rawText.split('\n').findIndex((l) => /Age\s*:/i.test(l));
  if (ageLineIdx > 0) {
    const candidate = rawText.split('\n')[ageLineIdx - 1].replace(/[.,]+\s*$/, '').trim();
    if (candidate) name = candidate;
  }

  return {
    patient: {
      name,
      age: ageLine ? parseInt(ageLine[1], 10) : null,
      sex: sexMatch ? sexMatch[1] : null,
      date: dateMatch ? dateMatch[1].trim() : null,
    },
    rbc: {
      haemoglobin: leaf(numOrNull(rawText.match(/Hemoglobin\s*\(?Hb\)?\s*([\d.]+)/i))),
      rbc_count: leaf(numOrNull(rawText.match(/Total\s*RBC\s*count\s*([\d.]+)/i))),
      pcv: leaf(numOrNull(rawText.match(/Packed\s*Cell\s*Volume\s*\(?PCV\)?\s*([\d.]+)/i))),
      mcv: leaf(numOrNull(rawText.match(/Mean\s*Corpuscular\s*Volume\s*\(?MCV\)?\s*([\d.]+)/i))),
      mch: leaf(numOrNull(rawText.match(/\bMCH(?!C)\b\s+([\d.]+)/i))),
      mchc: leaf(numOrNull(rawText.match(/\bMCHC\b\s+([\d.]+)/i))),
      rdw_cv: leaf(numOrNull(rawText.match(/\bRDW\b[\s-]*(?:CV)?\s*([\d.]+)/i))),
    },
    wbc: {
      total_wbc: leaf(numOrNull(rawText.match(/Total\s*WBC\s*count\s*'?([\d.]+)/i))),
      // Matched on a stable word-root + wildcard suffix rather than the full
      // label: OCR often garbles the tail of these longer words (plurals,
      // "-phils" endings) while the start of the word stays legible, so
      // e.g. "Neu\w*phil\w*" still matches "Neutraphils" or "Neutrophi1s".
      // The value itself is captured with OCR_NUMBER_TOKEN (not a plain
      // \d+) and run through numOrNullOcrTolerant — see the comment above
      // OCR_DIGIT_LOOKALIKES for why. Deliberately case-sensitive (no /i):
      // the digit-lookalike letters (O/I/S/B/T/...) would otherwise also
      // match stray lowercase OCR noise, which is far more likely to be
      // garbage than an actual digit.
      neutrophils: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Nn]eu\\w*phil\\w*\\s+(${OCR_NUMBER_TOKEN})`)))),
      lymphocytes: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Ll]ymph\\w*\\s+(${OCR_NUMBER_TOKEN})`)))),
      monocytes: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Mm]ono\\w*\\s+(${OCR_NUMBER_TOKEN})`)))),
      eosinophils: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Ee]o\\w*phil\\w*\\s+(${OCR_NUMBER_TOKEN})`)))),
      basophils: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Bb]aso\\w*phil\\w*\\s+\\D*?(${OCR_NUMBER_TOKEN})`)))),
    },
    platelets: {
      platelet_count: leaf(numOrNull(rawText.match(/Platelet\s*Count\s*([\d,]+)/i))),
      mpv: leaf(null), // not printed on this report layout
    },
  };
}

// When arrayBuffer is provided (e.g. a PDF already fetched from /api/report),
// skip the static-file fetch/cache lookup below entirely and go straight to
// getting raw text + parsing — the caller owns fetching and caching in that case.
export async function extractReportData({ forceRefresh = false, arrayBuffer = null } = {}) {
  if (arrayBuffer) {
    let pages;
    let textLayerRawText;
    try {
      ({ pages, rawText: textLayerRawText } = await loadPdfDocument(arrayBuffer));
    } catch (e) {
      showToast('Could not read the PDF. It may be corrupted or unsupported.');
      return null;
    }

    const hasUsableText = textLayerRawText.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_LENGTH;
    let rawText = null;
    try {
      rawText = hasUsableText ? textLayerRawText : await getOcrText(pages);
    } catch (e) {
      rawText = null;
    }

    if (!rawText) {
      showToast('Could not read your report data. Please try again.');
      return null;
    }
    return parseResultColumnFromText(rawText);
  }

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
  // extraction instead of re-running OCR + parsing on every reload — the
  // report only needs re-reading once it actually changes.
  const fingerprint =
    headRes.headers.get('etag') || headRes.headers.get('last-modified') || headRes.headers.get('content-length') || '';

  if (!forceRefresh) {
    const cached = readCache();
    if (cached) {
      const cachedFingerprint = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_FINGERPRINT_KEY) : null;
      // No fingerprint to compare against (headers missing) or it matches the
      // cached one -> trust the cache and skip re-parsing entirely. Only a
      // positive mismatch forces a fresh extraction.
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
  let textLayerRawText;
  try {
    const buffer = await getRes.arrayBuffer();
    ({ pages, rawText: textLayerRawText } = await loadPdfDocument(buffer));
  } catch (e) {
    showToast('Could not read the PDF. It may be corrupted or unsupported.');
    return null;
  }

  const hasUsableText = textLayerRawText.replace(/\s+/g, '').length >= MIN_USABLE_TEXT_LENGTH;

  let rawText = null;
  try {
    rawText = hasUsableText ? textLayerRawText : await getOcrText(pages);
  } catch (e) {
    rawText = null;
  }

  if (!rawText) {
    showToast('Could not read your report data. Please try again.');
    return null;
  }
  const parsed = parseResultColumnFromText(rawText);
  writeCache(parsed, fingerprint);
  return parsed;
}
