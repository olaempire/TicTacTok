# Tic-Tac-Tok

Full-stack rebuild of the original vanilla HTML/CSS/JS X/O game:
- **apps/web** — React + Vite + TypeScript frontend (same neobrutalist-style look as the original)
- **apps/api** — Express + Socket.io backend for real-time online matches, plus REST routes for stats/leaderboard
- **Supabase** — stores persistent per-player stats and powers the leaderboard

## How online play works
1. Two clients hit **Play Online**, enter a name, and get matched into a `room` server-side (in-memory, no DB needed for the live match itself).
2. Moves are validated on the server (turn order + cell already taken) and broadcast to both players over the same Socket.io room.
3. When a match ends, both players' results are upserted into Supabase (`games_played`, `wins`, `losses`, `draws`), keyed by an anonymous `device_id` stored in `localStorage` — no login required to start.
4. **My Stats** and **Leaderboards** pull from Supabase via the API's REST routes.

Local and vs-AI modes work exactly like the original — no server needed for those, they run entirely in the browser.

## Project structure
```
tictactok/
  apps/
    web/     React frontend
    api/     Express + Socket.io backend
  supabase/
    schema.sql   run this in your Supabase SQL editor
```

## Setup

### 1. Supabase
1. Create a project at supabase.com (or use an existing one).
2. Open the SQL editor and run `supabase/schema.sql`.
3. From Project Settings → API, grab your **Project URL** and **service_role key** (not the anon key — the API server needs the service role to bypass RLS for writes).

### 2. Install dependencies
From the repo root (uses npm workspaces):
```powershell
npm install
```

### 3. Configure environment variables
```powershell
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```
Then edit `apps/api/.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

`apps/web/.env` defaults to `VITE_API_URL=http://localhost:4000`, which is fine for local dev.

### 4. Run both apps (two terminals)
```powershell
npm run dev:api
```
```powershell
npm run dev:web
```
- API: http://localhost:4000
- Web: http://localhost:5173

To test online mode, open the web URL in two separate browser tabs/windows (or two browsers) and click **Play Online** in both.

## Deploying later
- **web**: deploys cleanly to Vercel (it's a static Vite build) — set `VITE_API_URL` to your deployed API URL.
- **api**: needs a host that supports long-lived WebSocket connections (Render, Railway, Fly.io, a droplet, etc.) — not a serverless platform, since Socket.io needs a persistent process.
- Update `CLIENT_ORIGIN` in the API's env to your deployed web URL for CORS.

## Notes / next steps
- Player identity is anonymous (device ID in localStorage). If you want real accounts later, swap this for Supabase Auth and key stats off `auth.uid()` instead of `device_id`.
- The matchmaking queue is a simple FIFO pair-up — fine for two friends testing, but you'd want proper queue/timeout/rank-matching logic before a public launch.
- No reconnect-to-in-progress-match handling yet — if a player refreshes mid-game, they'll be treated as having left the room.
