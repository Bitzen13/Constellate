import type { DotId } from '@constellate/shared';
import { hexToRgb } from '../color';
import type { SkyLink } from './source';

// Visual tuning lives here.
const TRAIL_POINTS = 120; // about 4 s of history
const TRAIL_SAMPLE_MS = 33;
const TRAIL_CHUNKS = 10; // trail is stroked in this many fading segments
const CROWD = 150; // past this many dots, trails are drawn with half the segments and points
const TRAIL_ALPHA = 0.55;
const FADE_MS = 1200; // dots fade in on join and out on leave
const RESUME_GAP_MS = 500; // a longer frame gap (hidden tab) restarts trails instead of drawing a long jump
const HIT_RADIUS = 18;
const LABEL_FONT = '400 13px Inter, system-ui, sans-serif';
const SPRITE_SIZE = 128;
const MAX_SPRITES = 600;
const TAU = Math.PI * 2;

const OTHER = { core: 2.4, glow: 16, alpha: 0.85, trail: 0.8, highlight: 0.6 };
const ME = { core: 3.4, glow: 26, alpha: 1, trail: 1, highlight: 0.9 };

interface DotState {
  color: string;
  trail: Float32Array; // ring buffer of normalized x, y
  head: number;
  count: number;
  lastSample: number;
  x: number;
  y: number;
  born: number;
  diedAt: number | null;
  seen: boolean;
}

export class SkyRenderer {
  hovered: DotId | null = null;
  selected: DotId | null = null; // its click menu already shows the name, so no hover label

  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private states = new Map<DotId, DotState>();
  private sprites = new Map<string, HTMLCanvasElement>();
  private lastFrame = -Infinity;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  frame(now: number, link: SkyLink): void {
    const resumed = now - this.lastFrame > RESUME_GAP_MS;
    this.lastFrame = now;

    for (const s of this.states.values()) s.seen = false;
    link.sample(now, (id, x, y) => {
      const meta = link.dots.get(id);
      if (!meta) return;
      let s = this.states.get(id);
      if (!s) {
        s = {
          color: meta.color,
          trail: new Float32Array(TRAIL_POINTS * 2),
          head: 0,
          count: 0,
          lastSample: -Infinity,
          x,
          y,
          born: now,
          diedAt: null,
          seen: true,
        };
        this.states.set(id, s);
      }
      s.seen = true;
      s.diedAt = null;
      s.color = meta.color;
      s.x = x;
      s.y = y;
      if (resumed) s.count = 0;
    });

    for (const [id, s] of this.states) {
      if (!s.seen && s.diedAt === null) s.diedAt = now;
      if (s.diedAt !== null && now - s.diedAt > FADE_MS) {
        this.states.delete(id);
        continue;
      }
      if (now - s.lastSample >= TRAIL_SAMPLE_MS) {
        s.trail[s.head * 2] = s.x;
        s.trail[s.head * 2 + 1] = s.y;
        s.head = (s.head + 1) % TRAIL_POINTS;
        s.count = Math.min(s.count + 1, TRAIL_POINTS);
        s.lastSample = now;
      }
    }
    if (this.hovered !== null && !this.isAlive(this.hovered)) this.hovered = null;

    const { ctx } = this;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';

    const crowded = this.states.size > CROWD;
    for (const [id, s] of this.states) this.drawTrail(s, this.life(s, now), id === link.meId, crowded && id !== link.meId);
    for (const [id, s] of this.states) this.drawDot(s, this.life(s, now), id === link.meId);

    if (this.hovered !== null && this.hovered !== this.selected) {
      const s = this.states.get(this.hovered);
      const meta = link.dots.get(this.hovered);
      if (s && meta) this.drawLabel(s, meta.name, this.hovered === link.meId);
    }
  }

  hitTest(px: number, py: number): DotId | null {
    let best: DotId | null = null;
    let bestD2 = HIT_RADIUS * HIT_RADIUS;
    for (const [id, s] of this.states) {
      if (s.diedAt !== null) continue;
      const dx = s.x * this.w - px;
      const dy = s.y * this.h - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = id;
      }
    }
    return best;
  }

  screenPos(id: DotId): { x: number; y: number } | null {
    const s = this.states.get(id);
    if (!s || s.diedAt !== null) return null;
    return { x: s.x * this.w, y: s.y * this.h };
  }

  private isAlive(id: DotId): boolean {
    const s = this.states.get(id);
    return !!s && s.diedAt === null;
  }

  private life(s: DotState, now: number): number {
    const fadeIn = Math.min(1, (now - s.born) / FADE_MS);
    const fadeOut = s.diedAt === null ? 1 : Math.max(0, 1 - (now - s.diedAt) / FADE_MS);
    return fadeIn * fadeOut;
  }

  // Point 0 is the live position; point j >= 1 is the j-th newest trail sample.
  private drawTrail(s: DotState, life: number, isMe: boolean, coarse: boolean): void {
    const n = s.count;
    if (n < 2 || life <= 0) return;
    const { ctx, w, h } = this;
    const spec = isMe ? ME : OTHER;
    const chunks = coarse ? TRAIL_CHUNKS / 2 : TRAIL_CHUNKS;
    const stride = coarse ? 2 : 1;
    const per = Math.ceil(n / chunks);
    ctx.strokeStyle = s.color;

    let k = 0;
    for (let c = 0; c < chunks && k < n; c++) {
      const f = c / chunks;
      ctx.globalAlpha = TRAIL_ALPHA * (1 - f) * (1 - f) * life * spec.trail;
      ctx.lineWidth = spec.core * 1.1 * (1 - f * 0.8);
      ctx.beginPath();
      if (k === 0) {
        ctx.moveTo(s.x * w, s.y * h);
      } else {
        const i = ((s.head - k + TRAIL_POINTS) % TRAIL_POINTS) * 2;
        ctx.moveTo(s.trail[i]! * w, s.trail[i + 1]! * h);
      }
      const end = Math.min(k + per, n);
      for (let j = Math.min(k + stride, end); ; j = Math.min(j + stride, end)) {
        const i = ((s.head - j + TRAIL_POINTS) % TRAIL_POINTS) * 2;
        ctx.lineTo(s.trail[i]! * w, s.trail[i + 1]! * h);
        if (j === end) break;
      }
      ctx.stroke();
      k = end;
    }
  }

  private drawDot(s: DotState, life: number, isMe: boolean): void {
    if (life <= 0) return;
    const { ctx } = this;
    const spec = isMe ? ME : OTHER;
    const px = s.x * this.w;
    const py = s.y * this.h;

    ctx.globalAlpha = spec.alpha * life;
    ctx.drawImage(this.sprite(s.color), px - spec.glow, py - spec.glow, spec.glow * 2, spec.glow * 2);

    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(px, py, spec.core, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = spec.highlight * life;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, spec.core * 0.5, 0, TAU);
    ctx.fill();
  }

  private drawLabel(s: DotState, name: string, isMe: boolean): void {
    const { ctx } = this;
    const px = s.x * this.w;
    const py = s.y * this.h;
    const offset = (isMe ? ME : OTHER).glow * 0.6 + 6;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.85;
    ctx.font = LABEL_FONT;
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(name).width;
    const lx = px + offset + tw > this.w - 8 ? px - offset - tw : px + offset;
    ctx.fillText(name, lx, py);
  }

  // Pre-rendered radial glow per color: much cheaper than shadowBlur for hundreds of dots.
  private sprite(color: string): HTMLCanvasElement {
    let c = this.sprites.get(color);
    if (c) return c;
    if (this.sprites.size >= MAX_SPRITES) this.sprites.clear();

    c = document.createElement('canvas');
    c.width = c.height = SPRITE_SIZE;
    const g = c.getContext('2d')!;
    const r = SPRITE_SIZE / 2;
    const [R, G, B] = hexToRgb(color);
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, `rgba(${R},${G},${B},0.8)`);
    grad.addColorStop(0.12, `rgba(${R},${G},${B},0.45)`);
    grad.addColorStop(0.35, `rgba(${R},${G},${B},0.12)`);
    grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    this.sprites.set(color, c);
    return c;
  }
}
