# 週間献立・買い物リスト管理アプリ

個人向けの週間献立作成・買い物リスト管理Webアプリ。Claude Code連携でAI献立生成が可能。

## 技術スタック・選定理由

| 技術 | 選定理由 |
|------|----------|
| **Next.js (App Router)** | フルスタック対応・型安全・Cloudflare Pagesと互換性あり |
| **TypeScript** | 型安全性によるバグ防止 |
| **Tailwind CSS** | 高速開発・レスポンシブ対応が容易 |
| **Supabase (PostgreSQL)** | 無料クラウドDB・外出先からのアクセス対応・RLSによるセキュリティ |
| **Cloudflare Pages** | 無料・転送量無制限・クレカ不要・商用OK |
| **Recharts** | React親和性が高い・ResponsiveContainer対応 |
| **shadcn/ui スタイル** | カスタムUIコンポーネント（Radix UIベース） |
| **Sonner** | シンプルで美しいトースト通知 |

## ローカル環境構築

### 前提条件
- Node.js 18以上（推奨: 20 LTS）
- pnpm

### セットアップ

```bash
# 1. リポジトリをクローン
git clone <repo-url>
cd meal-planner

# 2. 依存関係をインストール
pnpm install

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local を編集してSupabaseのURLとキーを設定

# 4. 開発サーバーを起動
pnpm dev
```

`http://localhost:3000` にアクセスすると自動的にダッシュボードにリダイレクトされます。

## 環境変数の設定

### .env.local（ローカル開発用）

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=           # 任意
NOTION_API_KEY=              # 任意
NOTION_DATABASE_ID=          # 任意
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:your@email.com
ENCRYPTION_KEY=              # openssl rand -base64 32 で生成
```

## Supabase 初期セットアップ

1. [supabase.com](https://supabase.com) でアカウント作成
2. 「New Project」でプロジェクト作成
   - Region: **Northeast Asia (Tokyo)** を選択
3. Settings → API からキーをコピーして `.env.local` に設定
4. SQL Editor で `supabase/migrations/` の SQLファイルを **001〜012** の順に実行

```sql
-- 実行順序（SQL Editorに貼り付けて実行）
-- supabase/migrations/001_create_user_profile.sql
-- supabase/migrations/002_create_dishes.sql
-- ...
-- supabase/migrations/012_create_weekly_scores.sql
```

## Cloudflare Pages デプロイ

### 準備

```bash
# VAPIDキーを生成
npx web-push generate-vapid-keys

# Cloudflare用ビルド
pnpm pages:build

# ローカルプレビュー
pnpm preview
```

### デプロイ手順

1. [dash.cloudflare.com](https://dash.cloudflare.com) でアカウント作成（クレカ不要）
2. Workers & Pages → Create application → Pages → Connect to Git
3. ビルド設定:
   - Framework preset: `Next.js`
   - Build command: `pnpm pages:build`
   - Output directory: `.vercel/output/static`
4. Environment Variables に `.env.local` の内容を登録
5. Save and Deploy

### 全APIルートに必要な設定
各 `app/api/*/route.ts` ファイルの先頭に以下が必要（Cloudflare Workers対応）:
```typescript
export const runtime = 'edge';
```
※ 現在の実装では開発・動作確認を優先してこの設定を省略しています。本番デプロイ時に追加してください。

## スマホからのアクセス

1. Cloudflare PagesのURL（`xxx.pages.dev`）をスマホのブラウザで開く
2. PWAとしてホーム画面に追加:
   - **iOS**: Safariの共有ボタン → 「ホーム画面に追加」
   - **Android**: Chromeのメニュー → 「アプリをインストール」

## Claude Code 経由での操作

### 週間献立を生成する

```bash
npm run generate-meal-plan
```

または Claude Code に話しかける:
```
今週（2026年4月13日〜19日）の献立を提案してください。
条件: 1人分・和食メイン・副菜あり・汁物は夕食のみ・1食500円以下
提案後、scripts/generate-meal-plan.ts の writeToDB 関数を使ってDBに書き込んでください。
```

### 冷蔵庫の残り物で献立を提案する

```bash
npm run generate-meal-plan-fridge
```

または:
```
冷蔵庫に[食材リスト]が残っています。これを使い切る献立を提案して、
scripts/generate-meal-plan-from-fridge.ts を実行してDBに書き込んでください。
```

### 買い物リストを生成する

```bash
npm run generate-shopping-list
```

### レシートを読み取る

```bash
npm run ocr-receipt -- --image ./receipts/receipt.jpg
```

または Claude Code に画像を渡して:
```
このレシート画像を読み取って買い物リストの金額を更新してください。
```

### 食品成分DBをインポートする（初回のみ）

```bash
npm run seed-nutrition
```

## Notion 連携

1. [Notion API](https://www.notion.so/my-integrations) でインテグレーションを作成
2. 買い物リスト用のデータベースを作成し、インテグレーションと共有
3. 設定画面（`/settings`）でAPIキーとデータベースIDを入力

## ディレクトリ構成

```
meal-planner/
├── app/
│   ├── (pages)/dashboard, meal-plan, shopping-list, ...
│   └── api/          # API Routes
├── components/
│   ├── ui/           # 汎用UIコンポーネント
│   ├── layout/       # Sidebar, BottomNav
│   └── meal-plan/    # 献立専用コンポーネント
├── lib/
│   ├── supabase.ts   # ブラウザ用Supabaseクライアント
│   ├── supabase-server.ts  # サーバー用（service_role key）
│   ├── utils.ts      # ユーティリティ関数
│   └── types.ts      # TypeScript型定義
├── scripts/          # Claude Code連携スクリプト
├── supabase/
│   ├── migrations/   # テーブル作成SQL（001〜012）
│   └── seed/         # シードデータ
└── public/
    └── manifest.json # PWA設定
```

## 実装フェーズ

- **Phase 1（現在）**: プロジェクト基盤・DB設計・週間献立グリッド・買い物リスト・設定画面
- **Phase 2**: カレンダー・ストリーク・お気に入り・冷蔵庫管理・栄養分析・Notion連携
- **Phase 3**: レポート・ローテーション・作り置き・レシピURL取り込み
- **Phase 4**: OCR・プッシュ通知・スコアレポート仕上げ
