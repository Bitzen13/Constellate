import {
  PING_INTERVAL_MS,
  SNAPSHOT_RATE,
  WS_PATH,
  type ClientMessage,
  type DotId,
  type RosterEntry,
  type ServerMessage,
} from '@constellate/shared';
import type { DotMeta, SkyLink } from '../sky/source';

const SNAPSHOT_MS = 1000 / SNAPSHOT_RATE;
const INTERP_DELAY_MS = SNAPSHOT_MS * 2; // render this far behind the newest snapshot so there's always one ahead
const MAX_SNAPSHOTS = 30;
const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 15_000;

interface Snapshot {
  n: number;
  p: number[];
  index: Map<DotId, number>; // id -> offset of x in p
}

export interface JoinInfo {
  name: string;
  color: string;
  studyMs?: number;
  paused?: boolean;
}

export interface ConnectionEvents {
  onWelcome?: () => void;
  onError?: (reason: 'full' | 'rate') => void;
}

export function serverUrl(): string {
  const configured = import.meta.env.VITE_SERVER_URL as string | undefined;
  if (configured) return configured;
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${WS_PATH}`;
}

// Live link to the server. Reconnects with backoff until close() is called.
export class Connection implements SkyLink {
  meId: DotId | null = null;
  readonly dots = new Map<DotId, DotMeta>();

  private ws: WebSocket | null = null;
  private snaps: Snapshot[] = [];
  private offset: number | null = null; // local time minus nominal snapshot time
  private pingTimer = 0;
  private retryTimer = 0;
  private retryMs = RETRY_MIN_MS;
  private closed = false;

  constructor(
    private url: string,
    private joinInfo: () => JoinInfo,
    private events: ConnectionEvents = {},
  ) {
    window.addEventListener('pagehide', this.onPageHide);
    this.connect();
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.send({ t: 'leave' });
    this.ws?.close();
    clearInterval(this.pingTimer);
    clearTimeout(this.retryTimer);
    window.removeEventListener('pagehide', this.onPageHide);
  }

  sample(now: number, out: (id: DotId, x: number, y: number) => void): void {
    if (this.snaps.length === 0 || this.offset === null) return;
    const renderN = (now - INTERP_DELAY_MS - this.offset) / SNAPSHOT_MS;
    while (this.snaps.length >= 3 && this.snaps[1]!.n <= renderN) this.snaps.shift();

    const a = this.snaps[0]!;
    const b = this.snaps[1] ?? a;
    const alpha = b === a ? 0 : Math.min(1, Math.max(0, (renderN - a.n) / (b.n - a.n)));

    for (const [id, bi] of b.index) {
      const bx = b.p[bi]!;
      const by = b.p[bi + 1]!;
      const ai = a.index.get(id);
      if (ai === undefined) out(id, bx, by);
      else out(id, a.p[ai]! + (bx - a.p[ai]!) * alpha, a.p[ai + 1]! + (by - a.p[ai + 1]!) * alpha);
    }
  }

  private onPageHide = () => this.close();

  private connect(): void {
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.retryMs = RETRY_MIN_MS;
      this.send({ t: 'join', ...this.joinInfo() });
    };
    ws.onmessage = (e) => this.handle(JSON.parse(String(e.data)) as ServerMessage);
    ws.onclose = () => {
      clearInterval(this.pingTimer);
      if (this.closed) return;
      this.retryTimer = window.setTimeout(() => this.connect(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, RETRY_MAX_MS);
    };
  }

  private handle(msg: ServerMessage): void {
    const now = performance.now();
    switch (msg.t) {
      case 'welcome':
        this.meId = msg.id;
        this.dots.clear();
        this.snaps = [];
        this.offset = null;
        for (const e of msg.roster) this.setMeta(e, now);
        clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => this.send({ t: 'ping' }), PING_INTERVAL_MS);
        this.events.onWelcome?.();
        return;
      case 'roster':
        for (const e of msg.joined ?? []) this.setMeta(e, now);
        for (const e of msg.updated ?? []) this.setMeta(e, now);
        for (const id of msg.left ?? []) this.dots.delete(id);
        return;
      case 'tick': {
        // Track the lowest observed latency, drifting up slowly, so arrival jitter doesn't shake the motion.
        const candidate = now - msg.n * SNAPSHOT_MS;
        if (this.offset === null || candidate < this.offset) this.offset = candidate;
        else this.offset += (candidate - this.offset) * 0.01;

        const index = new Map<DotId, number>();
        for (let i = 0; i < msg.p.length; i += 3) index.set(msg.p[i]!, i + 1);
        this.snaps.push({ n: msg.n, p: msg.p, index });
        if (this.snaps.length > MAX_SNAPSHOTS) this.snaps.shift();
        return;
      }
      case 'error':
        this.closed = true;
        this.ws?.close();
        clearInterval(this.pingTimer);
        this.events.onError?.(msg.reason);
        return;
    }
  }

  private setMeta(e: RosterEntry, now: number): void {
    this.dots.set(e.id, { ...e, receivedAt: now });
  }
}
