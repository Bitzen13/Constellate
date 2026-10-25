import { spawnBody, step, type Body, type ClientMessage, type DotId } from '@constellate/shared';
import { hslToHex } from '../color';
import type { DotMeta, SkyLink } from './source';

const NAMES = ['Ada', 'Kai', 'Mira', 'Theo', 'Juno', 'Ravi', 'Noor', 'Lena', 'Ezra', 'Iris', 'Omar', 'Yuki', 'Sol', 'Wren', 'Tao', 'Zara'];
const PREWARM_STEPS = 600; // dots join one by one over this many steps, like real people arriving
const MAX_DT = 0.1;

// Fake sky that runs the shared physics locally. Open the client with ?demo=N.
export class DemoSource implements SkyLink {
  readonly meId: DotId = 1;
  readonly dots = new Map<DotId, DotMeta>();
  private bodies = new Map<DotId, Body>();
  private list: Body[] = [];
  private last: number | null = null;

  constructor(count: number, me: { name: string; color: string }) {
    const now = performance.now();
    const arrivals: Body[] = [];
    for (let id = 1; id <= count; id++) {
      const body = spawnBody();
      this.bodies.set(id, body);
      arrivals.push(body);
      const isMe = id === this.meId;
      this.dots.set(id, {
        id,
        name: isMe ? me.name : NAMES[id % NAMES.length]!,
        color: isMe ? me.color : hslToHex(Math.random() * 360, 0.75, 0.65),
        studyMs: isMe ? 0 : Math.random() * 2 * 3_600_000,
        paused: false,
        receivedAt: now,
      });
    }
    for (let i = 0; i < PREWARM_STEPS; i++) {
      while (this.list.length < ((i + 1) / PREWARM_STEPS) * count) this.list.push(arrivals[this.list.length]!);
      step(this.list, 1 / 30);
    }
  }

  sample(now: number, out: (id: DotId, x: number, y: number) => void): void {
    if (this.last !== null) step(this.list, Math.min((now - this.last) / 1000, MAX_DT));
    this.last = now;
    for (const [id, b] of this.bodies) out(id, b.x, b.y);
  }

  send(msg: ClientMessage): void {
    if (msg.t !== 'pause' && msg.t !== 'resume') return;
    const paused = msg.t === 'pause';
    this.bodies.get(this.meId)!.frozen = paused;
    this.dots.get(this.meId)!.paused = paused;
  }

  close(): void {}
}
