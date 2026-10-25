# Constellate

Shared ambient focus app: everyone in focus mode is a glowing dot orbiting on one shared sky.
Spec: `docs/DESIGN.md`. Phases and progress: `ROADMAP.md` (tick boxes as work lands).

## Layout

npm workspaces monorepo:
- `shared/` – protocol types, constants, physics. Imported as `@constellate/shared` from TS source (no build step).
- `server/` – Node + `ws`, authoritative simulation; also serves `client/dist` in production. Run with `tsx`.
- `client/` – React + Vite. `sky/renderer.ts` draws dots/trails on Canvas 2D; `net/connection.ts` interpolates server snapshots; `session.ts` is your own study clock.

## Commands

- `npm run dev` – server + client together (client on :5173, proxies `/ws` to :8080)
- `npm run typecheck` – all workspaces
- `?demo=N` on the client URL – N local fake dots, no server

## Rules

- **No on-screen text** unless Simon explicitly approves it. Approved so far: the central study clock, hover names, the click menu (name + study time), and the setup screen's name field. Controls are icon-only (`aria-label`s are fine).
- Server owns the simulation; clients only render and interpolate.
- Positions are normalized 0..1. Never send pixels over the wire.
- Physics lives in `shared/` so the demo and server run the same code. Visual tuning constants sit at the top of `renderer.ts` and `NebulaCanvas.tsx`; physics constants in `DEFAULT_PHYSICS`.
- Liveness uses protocol-level WebSocket pings from the server (browsers auto-pong even in throttled background tabs), not just the client's app-level `ping`.
