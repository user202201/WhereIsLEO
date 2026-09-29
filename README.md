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

1. **Install dependencies** from the repo root: `npm install` (npm workspaces link
   `packages/shared` into both apps automatically).
2. **Environment variables** — pick one:
   - **Free/no signup — mock mode**: skip this step entirely, or copy
     `apps/api/.env.example` to `.env` and leave it empty. Scene/sprite images become
     instant procedural placeholders instead of real OpenAI art, and data is kept in
     memory instead of Supabase (resets when you restart the dev server). Good enough to
     click through the whole app and check the UI/gameplay loop works.
   - **Real AI art**: create a [Supabase](https://supabase.com) project (free tier), run
     `apps/api/sql/schema.sql` in its SQL editor, create three **public** Storage buckets
     (`scenes`, `sprites`, `composites`), and get an OpenAI API key (pay-per-image, no
     free tier). Put all three in `apps/api/.env`:
     - `OPENAI_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - You can also mix the two (e.g. real Supabase + no OpenAI key) — each is checked
     independently.

## Running it

```bash
# Terminal 1 — backend
cd apps/api && npm run dev

# Terminal 2 — mobile app
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npx expo start
```

`apps/api`'s `npm run dev` starts a plain local Node server on port 3000 (`dev-server.ts`)
that calls the exact same handler code Vercel would run in production — no Vercel CLI,
account, or network access needed. If you specifically want to test against the real
Vercel CLI runtime before deploying, `npm run dev:vercel` runs `vercel dev` instead (needs
`npm install -g vercel` and a one-time login).

Open the app in Expo Go (or a dev build — the app uses native gesture/reanimated code, so a
full native build is needed for a release build, Expo Go works for iterating).

### Fastest way to see it: run it in a browser

No phone, simulator, or Expo Go needed — the app also runs on `react-native-web`:

```bash
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npx expo start --web
```

This opens `http://localhost:8081` in your default browser with hot reload, same as the
native app. The backend (`apps/api`, terminal 1 above) needs to be running too, or the
Welcome screen's preset-character list will fail to load. On desktop, pinch-to-zoom in the
Game screen isn't available with a mouse, so mouse-wheel / trackpad scroll zooms instead.

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
