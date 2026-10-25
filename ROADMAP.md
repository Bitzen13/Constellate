# Constellate Roadmap

Three phases. Each ends with something you can run and look at. Full spec: [docs/DESIGN.md](docs/DESIGN.md).

---

## Phase 1: The Sky (local prototype)

**Goal:** a single browser tab that already looks and feels like Constellate, with fake dots and no server.

- [x] Full-screen Canvas 2D render loop at 60 fps, DPR-aware, resizes cleanly
- [x] Shared physics in `shared/src/physics.ts`: softened pairwise gravity, weak center pull, damping, normalized 0..1 coordinates
- [x] Spawn ~20–50 fake dots at random edges with small velocities; tune constants until they orbit and swoop without colliding or flying off
- [x] Glow per dot (pre-rendered radial sprite per color; cheaper than `shadowBlur` at 500 dots)
- [x] Long, swooping trails (fading redraw or per-dot trail buffer)
- [x] "Your" dot is slightly bigger and brighter
- [x] Nebula background: dark base with a very subtle, slowly shifting rainbow mesh gradient
- [x] Perf check: 500 fake dots hold ~55 fps in headless software rendering (`?demo=500`); confirm on real hardware

**Done when:** you could leave the tab open and enjoy watching it.

---

## Phase 2: Together (server + identity)

**Goal:** real people appear as dots on one shared sky.

- [x] WebSocket server (`ws`) owns the simulation: physics at 30 Hz, `tick` snapshots at 15 Hz
- [x] Protocol from `shared/src/protocol.ts`: `join`, `leave`, `ping` / `welcome`, `roster`, `tick`
- [x] New dots spawn at a random edge with small velocity
- [x] Client renders server snapshots, interpolating between them for smooth 60 fps
- [x] Leave on tab close / exiting focus; drop dots after a missed 10 s heartbeat
- [x] Setup screen (first visit only): name field + color picker, saved to `localStorage`
- [x] Idle screen: dark background + a single start control
- [x] Hover a dot → its name appears beside it
- [x] Click a dot → small menu with name and current study time
- [x] Safety: names capped at 20 chars, markup stripped, basic profanity filter; one connection per tab; join rate limit per IP; 500-dot cap

**Done when:** two browsers on different machines see each other's dots orbiting.

---

## Phase 3: Focus (study mechanics + launch)

**Goal:** it's a real study tool, deployed, and friends are using it.

- [ ] Central clock counting up from entering focus mode (the one approved piece of on-screen text)
- [ ] Study modes: open-ended count-up (default), Pomodoro, timed goal (`mode {type, duration}`)
- [ ] Pause / resume: stops your clock and freezes your dot in place
- [ ] Server tracks each user's study time and paused state; included in roster data for the click menu
- [ ] Production build; deploy server to Render or Fly.io, client to a static host
- [ ] Configurable server URL via env for the client
- [ ] Test session with friends; collect feedback and tune physics/visuals

**Done when:** friends are studying on the live site at the same time.
