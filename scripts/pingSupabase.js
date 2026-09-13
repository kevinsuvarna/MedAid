// Usage: node scripts/pingSupabase.js
//
// Queries the Supabase project (a cheap read against the `reports` table)
// purely to generate activity, so a free-tier Supabase project doesn't get
// auto-paused for inactivity. Standalone CommonJS script (not run through
// Next.js), so it loads .env.local itself, same pattern as uploadReport.js.

const fs = require('fs');
const path = require('path');
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
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const client = createClient(supabaseUrl, serviceRoleKey);

  const { count, error } = await client
    .from('reports')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;

  console.log(`Pinged Supabase project successfully. "reports" table row count: ${count}`);
}

main().catch((err) => {
  console.error('Ping failed:', err.message || err);
  process.exit(1);
});
