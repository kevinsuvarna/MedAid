import { adminClient } from '@/lib/supabaseClient';
import { promises as fs } from 'fs';
import path from 'path';

// Matches the retry budget other API routes give themselves for a slow
// upstream (see /api/groq's rate-limit retry) — long enough to survive a
// transient Supabase Storage hiccup without the platform killing the request
// mid-retry.
export const maxDuration = 30;

// Dev-only debugging aid: every PDF this route fetches from Supabase storage
// also gets mirrored here so it can be opened locally to check for
// corruption/truncation, instead of only ever existing in-memory in the
// browser tab.
const DEBUG_DOWNLOAD_DIR = path.join(process.cwd(), 'reports', 'downloaded');

// Supabase Storage's CDN occasionally returns a transient 504 Gateway Timeout
// on an otherwise-valid object (observed in practice: the very next identical
// request succeeds in under a second) — retrying a couple of times turns that
// into a slower-but-reliable success instead of a hard "report not found"
// shown to the user for a report that actually exists and is fine.
const PDF_FETCH_MAX_RETRIES = 3;
const PDF_FETCH_RETRY_DELAY_MS = 1000;

async function fetchPdfWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < PDF_FETCH_MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url);
      if (res.ok && res.body) return res;
      lastError = new Error(`Failed to fetch PDF from storage (status ${res.status})`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < PDF_FETCH_MAX_RETRIES - 1) {
      console.error(`[api/report] PDF fetch failed (attempt ${attempt + 1}/${PDF_FETCH_MAX_RETRIES}), retrying`, lastError.message);
      await new Promise((resolve) => setTimeout(resolve, PDF_FETCH_RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return Response.json({ error: true, detail: 'Missing required query param: id' }, { status: 400 });
    }

    const { data: row, error: queryError } = await adminClient
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (queryError) throw queryError;
    if (!row) {
      return Response.json({ error: true, detail: 'No report found for this id' }, { status: 404 });
    }

    const pdfRes = await fetchPdfWithRetry(row.pdf_url);
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    // Best-effort — never let a write failure (e.g. the read-only
    // filesystem a production/serverless deploy runs on) break the actual
    // response the app needs.
    if (process.env.NODE_ENV !== 'production') {
      try {
        await fs.mkdir(DEBUG_DOWNLOAD_DIR, { recursive: true });
        await fs.writeFile(path.join(DEBUG_DOWNLOAD_DIR, `${id}.pdf`), pdfBuffer);
      } catch (writeError) {
        console.error('[api/report] Could not save debug copy to disk', writeError);
      }
    }

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  } catch (e) {
    console.error('[api/report] Route threw', e);
    return Response.json({ error: true, detail: String(e && e.message) }, { status: 500 });
  }
}
