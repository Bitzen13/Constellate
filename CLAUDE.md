# Constellate

Shared ambient focus app: everyone in focus mode is a glowing dot orbiting on one shared sky.
Spec: `docs/DESIGN.md`. Phases and progress: `ROADMAP.md` (tick boxes as work lands).

## Layout

npm workspaces monorepo:
- `shared/` – protocol types, constants, physics. Imported as `@constellate/shared` from TS source (no build step).
- `server/` – Node + `ws`, authoritative simulation. Run with `tsx`.
- `client/` – React + Vite, full-screen Canvas 2D renderer.

## Commands

- `npm run dev` – server + client together
- `npm run typecheck` – all workspaces

## Rules

- **No on-screen text** unless Simon explicitly approves it. Approved so far: the central study clock, hover names, the click menu, and the setup screen's name field.
- Server owns the simulation; clients only render and interpolate.
- Positions are normalized 0..1. Never send pixels over the wire.
- Physics lives in `shared/` so the local prototype and server run the same code.
