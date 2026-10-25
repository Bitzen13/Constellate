// Shared physics so the local demo and the server run identical code.
// Coordinates are normalized: (0, 0) is top-left, (1, 1) is bottom-right.

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  frozen: boolean;
}

export interface PhysicsParams {
  gravity: number; // pull between each pair of dots
  softening: number; // keeps close passes finite, so dots swing past each other instead of colliding
  crowd: number; // past this many dots, gravity is shared out so big crowds don't collapse into one ball
  centerPull: number; // pull toward the center that keeps everyone on screen, as acceleration per unit distance at centerRadius
  centerRadius: number;
  centerExponent: number; // below 1, outer orbits take longer than inner ones, so dots drift apart instead of moving in lockstep
  edgeMargin: number;
  edgePush: number; // extra spring that only acts inside the margin
  maxSpeed: number;
  overspeedDamping: number; // fraction of speed above maxSpeed kept per second
}

export const DEFAULT_PHYSICS: PhysicsParams = {
  gravity: 0.00004,
  softening: 0.02,
  crowd: 12,
  centerPull: 0.02,
  centerRadius: 0.3,
  centerExponent: 0.5,
  edgeMargin: 0.05,
  edgePush: 8,
  maxSpeed: 0.12,
  overspeedDamping: 0.2,
};

// O(n^2) pairwise. Fine up to a few hundred dots; switch to a grid or Barnes-Hut past that.
export function step(bodies: Body[], dt: number, p: PhysicsParams = DEFAULT_PHYSICS): void {
  const n = bodies.length;
  const g = p.gravity * Math.min(1, p.crowd / Math.max(1, n - 1));
  const soft2 = p.softening * p.softening;
  const lo = p.edgeMargin;
  const hi = 1 - p.edgeMargin;
  const overspeedKeep = Math.pow(p.overspeedDamping, dt);

  for (let i = 0; i < n; i++) {
    const a = bodies[i]!;
    if (a.frozen) continue;

    let ax = 0;
    let ay = 0;
    const cx = 0.5 - a.x;
    const cy = 0.5 - a.y;
    const r = Math.hypot(cx, cy);
    if (r > 1e-6) {
      const pull = centerAccel(r, p) / r;
      ax = cx * pull;
      ay = cy * pull;
    }

    if (a.x < lo) ax += (lo - a.x) * p.edgePush;
    else if (a.x > hi) ax -= (a.x - hi) * p.edgePush;
    if (a.y < lo) ay += (lo - a.y) * p.edgePush;
    else if (a.y > hi) ay -= (a.y - hi) * p.edgePush;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = bodies[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + soft2;
      const f = g / (d2 * Math.sqrt(d2));
      ax += dx * f;
      ay += dy * f;
    }

    a.vx += ax * dt;
    a.vy += ay * dt;

    const speed = Math.hypot(a.vx, a.vy);
    if (speed > p.maxSpeed) {
      const scale = (p.maxSpeed + (speed - p.maxSpeed) * overspeedKeep) / speed;
      a.vx *= scale;
      a.vy *= scale;
    }
  }

  for (const b of bodies) {
    if (b.frozen) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
}

function centerAccel(r: number, p: PhysicsParams): number {
  return p.centerPull * p.centerRadius * Math.pow(r / p.centerRadius, p.centerExponent);
}

// A new dot enters at a random edge, moving sideways so it swings into an orbit rather than falling straight in.
export function spawnBody(p: PhysicsParams = DEFAULT_PHYSICS, rand: () => number = Math.random): Body {
  const t = 0.1 + rand() * 0.8;
  const side = Math.floor(rand() * 4);
  const x = side === 0 ? p.edgeMargin : side === 1 ? 1 - p.edgeMargin : t;
  const y = side === 2 ? p.edgeMargin : side === 3 ? 1 - p.edgeMargin : t;

  const rx = x - 0.5;
  const ry = y - 0.5;
  const r = Math.hypot(rx, ry);
  const dir = rand() < 0.5 ? 1 : -1;
  const speed = Math.sqrt(centerAccel(r, p) * r) * (0.5 + rand() * 0.4); // fraction of circular-orbit speed

  return { x, y, vx: (-ry / r) * speed * dir, vy: (rx / r) * speed * dir, frozen: false };
}
