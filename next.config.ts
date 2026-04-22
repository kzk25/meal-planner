import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_PUBLIC_* 変数はビルド時に埋め込まれる。
  // Cloudflare Pages CI では .env.local が存在しないため
  // next.config.ts で直接設定して確実に埋め込む。
  // これらは公開用（anon）キーなのでソースに含めて問題ない。
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://sdinvjsfcyxvrlwrpxic.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkaW52anNmY3l4dnJsd3JweGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2NDEsImV4cCI6MjA5MTMzNjY0MX0.LW979yLCJWB75OzJSQNFUXeNPGnS_nwivmPGassI30Y",
  },
};

export default nextConfig;
