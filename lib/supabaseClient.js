import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Safe to use in client components — respects row-level security.
export const publicClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Bypasses row-level security — server-side only, never import in client components.
// Built lazily behind a Proxy so importing this module doesn't eagerly construct
// it: SUPABASE_SERVICE_ROLE_KEY is stripped from the browser bundle, so an eager
// createClient() call here would throw as soon as anything imports this file
// client-side, even code that only ever touches publicClient.
let _adminClient;
function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _adminClient;
}

export const adminClient = new Proxy(
  {},
  {
    get(_target, prop) {
      return getAdminClient()[prop];
    },
  }
);
