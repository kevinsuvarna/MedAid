import { createWorker } from 'tesseract.js';
import { showToast } from '@/lib/toast';
import { callGroqVisionDetailed } from '@/lib/groqClient';

// Bump whenever parseResultColumnFromText's parsing logic changes. The
// report_id cache (reportCache.js, keyed only by report_id with no link to
// this file) stores this alongside each cached result — a mismatch means
// the cached data was parsed by older, since-fixed logic, so it's treated
// as a cache miss and the report is re-fetched and re-parsed. Without this,
// a browser that already cached a report before a parser fix would keep
// showing the old (broken) result indefinitely.
export const PARSER_VERSION = 6;

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

// Vision models don't need OCR-grade resolution — they read text via learned
// features, not per-pixel character shapes, and Groq's qwen/qwen3.6-27b has
// an 8000-token-per-minute cap on the free tier. Two pages at OCR_RENDER_SCALE
// (3x, PNG) measured at ~9295 tokens and got rejected with a 413; scale 1.5
// as JPEG keeps a 2-page report comfortably under the cap while staying
// legible (medical report tables trade some sharpness fine as long as text
// doesn't blur into adjacent characters).
const VISION_RENDER_SCALE = 1.5;
const VISION_IMAGE_QUALITY = 0.85;

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

async function renderPageToImageDataUrl(page, { scale = OCR_RENDER_SCALE, type = 'image/png', quality } = {}) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL(type, quality);
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

// Local Tesseract OCR was tested against real scanned lab reports from two
// different providers and found unreliable on dense/gridlined tables: on one
// report, running the exact same rendered page through OCR repeatedly gave
// different results — sometimes the panel came through cleanly, sometimes
// entire sections (identical input, identical settings) came back as
// unrecognizable noise. No regex can compensate for OCR text that doesn't
// reliably contain the data to begin with. A vision-capable LLM reads the
// table directly off the image regardless of layout, inline flags, extra
// value columns, or watermarks, so it's tried first for any report with no
// real text layer; getOcrText (below) is kept only as a fallback for when
// the API call itself fails (offline, rate-limited, malformed response) —
// degraded-but-available beats a hard failure.
const VISION_SYSTEM_PROMPT = `You are extracting structured data from a Complete Blood Count (CBC) lab report image. Labs format this report differently — column order, inline High/Low flags, multi-line parameter names, extra "previous result" columns, watermarks — so match fields by their clinical meaning, not by exact text layout.

Rules:
- Also read the patient header block (usually top-left of the first page): name, age, sex. These matter as much as the lab values — the app uses sex to pick the correct reference range for several fields, so don't skip it even though it's not in a results table.
- Only read the CURRENT result column (usually labeled "Results" or similar). If a row has two numeric columns, the current result is the FIRST one — ignore any second "previous value" column.
- Strip inline flags (H, L, High, Low, Borderline, asterisks) — return the bare numeric value only.
- If a field is not present on the report, or you cannot read it confidently, use null for it. Never guess a value.
- age must be a plain integer. sex must be exactly "Male", "Female", or null.
- Respond with ONLY the JSON object below, no markdown fences, no commentary.

{
  "patient": {"name": string|null, "age": number|null, "sex": string|null, "date": string|null},
  "rbc": {"haemoglobin": number|null, "rbc_count": number|null, "pcv": number|null, "mcv": number|null, "mch": number|null, "mchc": number|null, "rdw_cv": number|null},
  "wbc": {"total_wbc": number|null, "neutrophils": number|null, "lymphocytes": number|null, "monocytes": number|null, "eosinophils": number|null, "basophils": number|null},
  "platelets": {"platelet_count": number|null, "mpv": number|null}
}`;

function coerceNumOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

// Defensive against the model deviating from the requested shape (missing
// sections, values returned as strings, extra fields) — coerces whatever
// comes back into exactly the shape the rest of the app expects rather than
// trusting the response verbatim.
function normalizeVisionResult(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw.patient || {};
  const rbc = raw.rbc || {};
  const wbc = raw.wbc || {};
  const plt = raw.platelets || {};
  return {
    patient: {
      name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : null,
      age: coerceNumOrNull(p.age),
      sex: p.sex === 'Male' || p.sex === 'Female' ? p.sex : null,
      date: typeof p.date === 'string' && p.date.trim() ? p.date.trim() : null,
    },
    rbc: {
      haemoglobin: leaf(coerceNumOrNull(rbc.haemoglobin)),
      rbc_count: leaf(coerceNumOrNull(rbc.rbc_count)),
      pcv: leaf(coerceNumOrNull(rbc.pcv)),
      mcv: leaf(coerceNumOrNull(rbc.mcv)),
      mch: leaf(coerceNumOrNull(rbc.mch)),
      mchc: leaf(coerceNumOrNull(rbc.mchc)),
      rdw_cv: leaf(coerceNumOrNull(rbc.rdw_cv)),
    },
    wbc: {
      total_wbc: leaf(coerceNumOrNull(wbc.total_wbc)),
      neutrophils: leaf(coerceNumOrNull(wbc.neutrophils)),
      lymphocytes: leaf(coerceNumOrNull(wbc.lymphocytes)),
      monocytes: leaf(coerceNumOrNull(wbc.monocytes)),
      eosinophils: leaf(coerceNumOrNull(wbc.eosinophils)),
      basophils: leaf(coerceNumOrNull(wbc.basophils)),
    },
    platelets: {
      platelet_count: leaf(coerceNumOrNull(plt.platelet_count)),
      mpv: leaf(coerceNumOrNull(plt.mpv)),
    },
  };
}

function pickFirstNonNull(values) {
  for (const v of values) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

// Merges the raw (pre-normalization) JSON each per-page vision call returns.
// Different pages of the same report carry different sections (e.g. the
// core panel on page 1, the WBC differential on page 2), each page's call
// returns null for whatever isn't on it, so per-field "first non-null wins"
// naturally reassembles the full report without the caller needing to know
// which page holds which field.
function mergeRawVisionResults(rawResults) {
  const valid = rawResults.filter(Boolean);
  if (valid.length === 0) return null;
  const mergeSection = (section, keys) =>
    Object.fromEntries(keys.map((k) => [k, pickFirstNonNull(valid.map((r) => r?.[section]?.[k]))]));
  return {
    patient: mergeSection('patient', ['name', 'age', 'sex', 'date']),
    rbc: mergeSection('rbc', ['haemoglobin', 'rbc_count', 'pcv', 'mcv', 'mch', 'mchc', 'rdw_cv']),
    wbc: mergeSection('wbc', ['total_wbc', 'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils']),
    platelets: mergeSection('platelets', ['platelet_count', 'mpv']),
  };
}

async function extractViaGroqVision(pages) {
  const pageCount = Math.min(pages.length, MAX_OCR_PAGES);
  const rawResults = [];
  for (let i = 0; i < pageCount; i += 1) {
    const imageDataUrl = await renderPageToImageDataUrl(pages[i], {
      scale: VISION_RENDER_SCALE,
      type: 'image/jpeg',
      quality: VISION_IMAGE_QUALITY,
    });
    // One image per call, not all pages in one request: Groq's
    // qwen/qwen3.6-27b free-tier cap (8000 tokens/minute) rejected a single
    // 2-image request at ~9295 tokens — and cutting resolution/format didn't
    // change that number at all, meaning the model tiles/resizes images to a
    // fixed internal budget per image regardless of what's sent. The only
    // lever that actually reduces token cost is fewer images per call.
    const result = await callGroqVisionDetailed(
      VISION_SYSTEM_PROMPT,
      'Extract the CBC values from this report page as JSON. Use null for any field not present on this specific page.',
      [imageDataUrl]
    );
    if (!result.ok) {
      rawResults.push(null);
      continue;
    }
    try {
      // Models occasionally wrap JSON in a markdown code fence despite being
      // told not to — strip it rather than fail the whole extraction over it.
      const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      rawResults.push(JSON.parse(cleaned));
    } catch (e) {
      rawResults.push(null);
    }
  }

  const merged = mergeRawVisionResults(rawResults);
  if (!merged) return null;
  return normalizeVisionResult(merged);
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

// Some reports print a diagonal watermark (e.g. a lab-software logo/URL)
// straight across the differential WBC block. Depending on where that
// watermark's text run lands in the extracted text stream, it can end up
// sitting between a row's label and its Result value, breaking every
// pattern above and below that assumes the number comes right after the
// label (separated only by whitespace) — the label still matches fine, but
// no number is found immediately next to it, so the field comes back null.
// Skipping up to a few whole junk words closes that gap. This deliberately
// skips whole \S+ tokens rather than individual non-digit characters: a
// watermark word like "Drlogy.co" contains 'l', 'o', 'g' — all OCR
// lookalikes for 1/0/9 above — so a char-by-char skip could misread a
// fragment of the junk word itself as a number and silently return the
// wrong value instead of no value. The negative lookahead guarantees a
// token that actually looks like the number we want is never skipped.
const SKIP_JUNK_WORDS = `(?:(?!${OCR_NUMBER_TOKEN}\\b)\\S+\\s+){0,3}`;

function numOrNullOcrTolerant(match) {
  if (!match) return null;
  const normalized = match[1].replace(/[OoIilZzSsBTGg]/g, (ch) => OCR_DIGIT_LOOKALIKES[ch]).replace(/,/g, '');
  const n = parseFloat(normalized);
  return Number.isNaN(n) ? null : n;
}

// Tries each pattern in order and returns the first one that matches —
// ordered from most specific/precise to most permissive, so a precise match
// is always preferred but a badly-garbled label still has a chance to be
// recovered by a looser fallback further down the list.
function firstMatch(rawText, patterns) {
  for (const re of patterns) {
    const m = rawText.match(re);
    if (m) return m;
  }
  return null;
}

// Neutrophils and eosinophils get an extra couple of fallback patterns
// beyond the other differential-count params: their result is real-world
// reports' single most failure-prone value (see PARSER_VERSION history), so
// on top of the "word-root + phil" pattern this also tries: the same root
// tolerating an OCR-inserted gap mid-word ("Neu trophils"), the common
// analyzer-printout abbreviation (NEUT/EOS, with an optional "%" or "."),
// and finally the root alone with no "phil" requirement at all, in case the
// tail is OCR'd into complete gibberish — so as long as the first 2-3
// letters of the label survive, the value is still recovered.
// \b after the abbreviation is required, not optional: without it "EOS"
// also prefix-matches inside the full word "Eosinophils" itself, and the
// OCR-tolerant token class then grabs whatever letter comes next in the
// word (e.g. the "i" in "Eosinoph1ls") as a false digit instead of ever
// reaching the real value.
const NEUTROPHILS_PATTERNS = [
  new RegExp(`[Nn]eu\\w*phil\\w*\\s+${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`),
  new RegExp(`[Nn]eu\\s*\\w*phil\\w*\\s+${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`),
  new RegExp(`\\bNEUT\\b[.\\s%]*${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`, 'i'),
  new RegExp(`\\bNeu\\w{0,15}\\s+${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`),
];
const EOSINOPHILS_PATTERNS = [
  new RegExp(`[Ee]o\\w*phil\\w*\\s+${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`),
  new RegExp(`[Ee]o\\s*\\w*phil\\w*\\s+${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`),
  new RegExp(`\\bEOS\\b[.\\s%]*${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`, 'i'),
  new RegExp(`\\bEo\\w{0,15}\\s+${SKIP_JUNK_WORDS}(${OCR_NUMBER_TOKEN})`),
];

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
      neutrophils: leaf(numOrNullOcrTolerant(firstMatch(rawText, NEUTROPHILS_PATTERNS))),
      lymphocytes: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Ll]ymph\\w*\\s+(${OCR_NUMBER_TOKEN})`)))),
      monocytes: leaf(numOrNullOcrTolerant(rawText.match(new RegExp(`[Mm]ono\\w*\\s+(${OCR_NUMBER_TOKEN})`)))),
      eosinophils: leaf(numOrNullOcrTolerant(firstMatch(rawText, EOSINOPHILS_PATTERNS))),
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
    if (hasUsableText) return parseResultColumnFromText(textLayerRawText);

    let visionResult = null;
    try {
      visionResult = await extractViaGroqVision(pages);
    } catch (e) {
      visionResult = null;
    }
    if (visionResult) return visionResult;

    let rawText = null;
    try {
      rawText = await getOcrText(pages);
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
    // A parser-version mismatch means this cache entry was produced by
    // older, since-fixed parsing logic — treat it as a miss even though the
    // file's fingerprint hasn't changed, exactly like the report_id cache in
    // reportCache.js/CbcApp.jsx already does. Without this check, a browser
    // that cached a result (right or wrong) before a regex fix would keep
    // serving that stale result forever, since the underlying file never
    // changes and only a fingerprint mismatch used to trigger a re-parse.
    if (cached && cached.__parserVersion === PARSER_VERSION) {
      const cachedFingerprint = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_FINGERPRINT_KEY) : null;
      // No fingerprint to compare against (headers missing) or it matches the
      // cached one -> trust the cache and skip re-parsing entirely. Only a
      // positive mismatch forces a fresh extraction.
      if (!fingerprint || cachedFingerprint === fingerprint) return cached.data;
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

  let parsed = null;
  if (hasUsableText) {
    parsed = parseResultColumnFromText(textLayerRawText);
  } else {
    let visionResult = null;
    try {
      visionResult = await extractViaGroqVision(pages);
    } catch (e) {
      visionResult = null;
    }
    if (visionResult) {
      parsed = visionResult;
    } else {
      let rawText = null;
      try {
        rawText = await getOcrText(pages);
      } catch (e) {
        rawText = null;
      }
      if (!rawText) {
        showToast('Could not read your report data. Please try again.');
        return null;
      }
      parsed = parseResultColumnFromText(rawText);
    }
  }
  writeCache({ __parserVersion: PARSER_VERSION, data: parsed }, fingerprint);
  return parsed;
}
