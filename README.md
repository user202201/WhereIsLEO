# WhereIsLEO

A "Where's Waldo"-style hidden-object game. Pick a crowded scene (space station, theater,
stadium, shopping mall) and a target character — a preset, or your own uploaded photo,
cartoonized to match — then pan and zoom around an AI-generated illustration to find them.

## Structure

- `apps/mobile` — Expo (React Native) app, file-based routing via Expo Router (`src/app`).
- `apps/api` — Vercel serverless functions (Node/TypeScript) that call OpenAI's `gpt-image-1`
  for scene generation and photo cartoonization, and composite the target into the scene
  server-side with `sharp`.
- `packages/shared` — TypeScript types shared between the two.

## One-time setup

1. **Supabase project**: create one, then run `apps/api/sql/schema.sql` in its SQL editor,
   and create three **public** Storage buckets: `scenes`, `sprites`, `composites`.
2. **Environment variables** for `apps/api` (copy `apps/api/.env.example` to `.env`):
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Install dependencies** from the repo root: `npm install` (npm workspaces link
   `packages/shared` into both apps automatically).

## Running it

```bash
# Terminal 1 — backend
cd apps/api && npm run dev   # vercel dev

# Terminal 2 — mobile app
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npx expo start
```

Open the app in Expo Go (or a dev build — the app uses native gesture/reanimated code, so a
full native build is needed for a release build, Expo Go works for iterating).

## Notes

- Scene generation is cached per location (a rotating pool of 6) to cut cost/latency; the
  target's cartoon sprite is always freshly generated for uploads, and cached once per
  preset character.
- `apps/api/vercel.json` raises `maxDuration` on the image-generation routes (image
  generation reliably takes longer than the default serverless timeout) — this needs a
  Vercel plan that supports functions running that long.
- AI-generated scenes realistically contain dozens of distinct characters, not literally
  hundreds — see the plan notes for why, and for the compositing approach used to keep the
  target hard to find regardless.
