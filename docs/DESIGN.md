# Constellate: Design Document

## Concept

A shared focus/study mode app. When a user clicks the button to enter focus mode, they connect to a server and appear as a dot on a shared screen alongside everyone else currently studying.

## Purpose

Ambient and calming: watching the dots is pleasant, and it feels good to know other people are working too. The dots are mainly visual, with no direct link to focus mechanics so far.

## Core Features

- Focus mode activated with a button (desktop)
- Each active user is represented as a dot
- Users choose their own dot color
- Dots float around the screen and orbit each other
- Dots influence each other's paths (gravity-like interaction)

## Identity and Interaction

- No sign-in required; users set a name and color themselves
- Hovering over a dot shows that person's name
- Clicking a dot opens a small menu; it shows their name and current study time, with more options to come later

## UI and Styling

The look is simple and minimalist.

- No text anywhere on screen unless Simon explicitly specifies it
- No stray labels, captions, or decorative text

**Background:** plain dark, with a very subtle nebula-like, rainbow mesh gradient that blends and shifts gently. Ambient and barely noticeable.

**Dots:** each dot glows in its user's color and leaves a long, swooping trail as it moves. Your own dot is slightly bigger and brighter.

**Central clock:** a large clock in the center of the screen counts up from when you enter focus mode, showing how long you've been studying. This is explicitly approved text. Study modes: open-ended count-up (default), Pomodoro, and timed goal.

**Pause:** pausing stops your clock and freezes your dot in place until you resume.

## Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + TypeScript, built with Vite | Fast setup, typed state |
| Rendering | HTML Canvas 2D, full-screen | Cheap glow (shadowBlur) and trails (fading redraw) for hundreds of dots |
| Realtime | WebSockets via the `ws` library | Low-latency, two-way, lightweight |
| Backend | Node.js + TypeScript | Shares types and physics code with the frontend |
| State | In memory on the server | Sessions are live-only; nothing needs to persist |
| Local identity | Browser localStorage | Remembers name and color with no sign-in |
| Hosting | Render or Fly.io (server), static host for the client | Simple WebSocket support, free tiers |

## Architecture

The server owns the simulation; clients only draw it.

1. User picks a name and color (first visit only), then clicks to enter focus mode.
2. Client opens a WebSocket and sends `join {name, color}`.
3. Server adds a dot at a random edge position with a small velocity.
4. Server runs the physics at 30 ticks per second and broadcasts compact snapshots (id, x, y) at 15 per second.
5. Clients interpolate between snapshots for smooth 60 fps motion and draw glow and trails locally.
6. Closing the tab or leaving focus mode sends `leave`; a missed heartbeat (10 s) removes the dot.

## Physics

- Softened gravity between every pair of dots, so they orbit and bend each other's paths without colliding
- Weak pull toward screen center keeps dots on screen; gentle damping stops runaway speeds
- Coordinates are normalized (0 to 1) so every screen size shows the same scene
- Pairwise cost is fine up to a few hundred users; past that, switch to a grid or Barnes-Hut approximation

## Messages

| Direction | Message | Contents |
| --- | --- | --- |
| Client → server | join | name, color |
| Client → server | leave | none |
| Client → server | ping | none, every 5 s |
| Server → client | welcome | your id, full roster (id, name, color) |
| Server → client | roster | dot joined or left |
| Server → client | tick | positions for all dots |

Names and colors go out only on join and roster changes, keeping ticks small.

Additional messages: client sends `pause`, `resume` and `mode {type, duration}`; the server tracks each user's study time and paused state and includes study time in roster data for the click menu.

## Client Screens

- **Setup:** name field and color picker, shown once, minimal
- **Idle:** dark background and one start control
- **Focus:** full-screen canvas, the dots, and the central count-up clock
- **Hover:** name appears beside the dot; **click:** small menu with the name

## Safety and Limits

- Names capped at 20 characters and stripped of markup; basic profanity filter
- One connection per browser tab; rate-limit joins per IP
- Server cap on total dots (start at 500)

## Open Questions

None right now.
