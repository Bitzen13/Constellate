# Constellate

A shared focus space. Enter focus mode and you become a glowing dot, orbiting alongside everyone else who's studying right now.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/ws` to the game server on :8080.

- `?demo=N` runs the sky with N fake local dots and no server, e.g. http://localhost:5173/?demo=500 for a perf check.
- `npm run typecheck` checks all workspaces.

## Controls

All controls are icon-only. The toolbar fades out when the mouse rests.

| Key | Action |
| --- | --- |
| Space | Pause / resume (stops your clock, freezes your dot) |
| Esc | Close menu / cancel goal / leave focus |
| ↑ ↓ or scroll | Adjust goal length while setting a goal |
| Enter | Start the goal |

Modes: open-ended count-up (∞), Pomodoro (25 min work / 5 min break; breaks freeze your dot), timed goal (◎, counts down, then counts overtime in your color).

## Deploy

One Node process serves the built client and the WebSocket server on the same port (`/ws`), with a health check at `/healthz`.

**Render:** push to GitHub, then New → Blueprint and pick this repo. `render.yaml` builds the `Dockerfile`. Note: the free plan sleeps after 15 min without HTTP traffic, which drops everyone's session. Use a paid instance for real use.

**Fly.io:** `fly launch` (keep the existing `fly.toml`, pick your own app name), then `fly deploy`. Machines are kept running because sessions live in memory.

**Split hosting:** to put the client on a static host instead, build it with `VITE_SERVER_URL=wss://your-server/ws npm run build -w client` and deploy `client/dist`.

Server env vars: `PORT` (default 8080), `TRUST_PROXY=1` behind a proxy so per-IP limits see real client IPs (set in the Dockerfile), `CLIENT_DIST` to serve the client from elsewhere.

## Docs

- [Roadmap](ROADMAP.md)
- [Design document](docs/DESIGN.md)
