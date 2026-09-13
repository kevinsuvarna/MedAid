import { adminClient } from '@/lib/supabaseClient';
import { promises as fs } from 'fs';
import path from 'path';

// Dev-only debugging aid: every PDF this route fetches from Supabase storage
// also gets mirrored here so it can be opened locally to check for
// corruption/truncation, instead of only ever existing in-memory in the
// browser tab.
const DEBUG_DOWNLOAD_DIR = path.join(process.cwd(), 'reports', 'downloaded');

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

    const pdfRes = await fetch(row.pdf_url);
    if (!pdfRes.ok || !pdfRes.body) {
      throw new Error(`Failed to fetch PDF from storage (status ${pdfRes.status})`);
    }

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
