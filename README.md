# Macro Intel Desk

Public brief site for the GenXKrypto macro intelligence desk. Next.js App Router on Vercel, reading published briefs from Supabase (read-only anon key, RLS enforced).

## Pages

- `/` Live: current dashboard + latest full brief
- `/archive` every published run with dashboard dot strips
- `/brief/[id]` a single complete brief, permanent URL
- `/history` per-category status timelines across runs
- `/claims` claim tracker with verdicts and history
- `/watch` standing watch list

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill both values from the Supabase project (Settings -> API).
3. `npm run dev`

On Vercel, set the same two environment variables in the project settings. Pages revalidate every 60 seconds, so new briefs appear without a redeploy.

## Data

All content is written to Supabase by the intelligence desk. This repo contains no brief content; it renders whatever is published. The anon key can only read rows where `published = true` (plus claims and watch items), enforced by row-level security. There are no write policies for the public role, so the key in the browser cannot modify anything.

<!-- deploy trigger: 2026-08-16 -->
