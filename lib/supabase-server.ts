import { createClient } from "@supabase/supabase-js";

// Server-side client (uses service_role key - bypasses RLS)
// NEXT_PUBLIC_SUPABASE_URL は next.config.ts で埋め込み済み。
// SUPABASE_SERVICE_ROLE_KEY は Cloudflare Pages の環境変数（secret）で設定。
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase env vars missing: URL=${!!url}, KEY=${!!key}. ` +
        "Set SUPABASE_SERVICE_ROLE_KEY in Cloudflare Pages environment variables."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
