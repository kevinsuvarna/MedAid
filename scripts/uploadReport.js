// Usage: node scripts/uploadReport.js path/to/report.pdf
//
// Standalone CommonJS script (not run through Next.js), so it loads
// .env.local itself and talks to Supabase directly rather than importing
// lib/supabaseClient.js, which is an ES module meant for the Next.js app.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('Usage: node scripts/uploadReport.js path/to/report.pdf');
  }

  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const resolvedPath = path.resolve(filePath);
  const fileBuffer = fs.readFileSync(resolvedPath);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const uuid = crypto.randomUUID();
  const storagePath = `reports/${uuid}.pdf`;

  const { error: uploadError } = await adminClient.storage
    .from('reports')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf' });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = adminClient.storage.from('reports').getPublicUrl(storagePath);
  const pdfUrl = publicUrlData.publicUrl;

  const { error: insertError } = await adminClient.from('reports').insert({ id: uuid, pdf_url: pdfUrl });
  if (insertError) throw insertError;

  console.log('Uploaded successfully.');
  console.log(`Report UUID: ${uuid}`);
  console.log('Use this UUID for your NFC sticker URL:');
  console.log(`https://med-aid-1cpm.vercel.app/?report_id=${uuid}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
