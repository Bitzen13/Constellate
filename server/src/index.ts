import { createServer, type IncomingMessage } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import {
  DEFAULT_PORT,
  HEARTBEAT_TIMEOUT_MS,
  JOINS_PER_MINUTE,
  MAX_DOTS,
  MAX_MESSAGE_BYTES,
  MAX_STUDY_MS,
  PING_INTERVAL_MS,
  SNAPSHOT_RATE,
  TICK_RATE,
  WS_PATH,
  type ClientMessage,
  type ServerMessage,
} from '@constellate/shared';
import { RateLimiter } from './rateLimit';
import { sanitizeColor, sanitizeMode, sanitizeName } from './sanitize';
import { staticHandler } from './static';
import { World, type Player } from './world';

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const TRUST_PROXY = !!process.env.TRUST_PROXY; // set when behind Render/Fly so X-Forwarded-For is the real client
const CLIENT_DIST = process.env.CLIENT_DIST ?? fileURLToPath(new URL('../../client/dist', import.meta.url));
const MAX_MESSAGES_PER_SECOND = 20;
const MAX_BUFFERED_BYTES = 1 << 20; // skip ticks to clients that can't keep up

interface Conn {
  socket: WebSocket;
  ip: string;
  player: Player | null;
  lastSeen: number;
  messageCount: number;
}

const world = new World();
const joins = new RateLimiter(JOINS_PER_MINUTE, 60_000);
const conns = new Set<Conn>();

const server = createServer(staticHandler(path.resolve(CLIENT_DIST)));
const wss = new WebSocketServer({ server, path: WS_PATH, maxPayload: MAX_MESSAGE_BYTES });

function clientIp(req: IncomingMessage): string {
  if (TRUST_PROXY) {
    const fly = req.headers['fly-client-ip'];
    if (typeof fly === 'string') return fly;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0]!.trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function send(conn: Conn, msg: ServerMessage): void {
  if (conn.socket.readyState === WebSocket.OPEN) conn.socket.send(JSON.stringify(msg));
}

function broadcast(msg: ServerMessage, except?: Conn): void {
  const data = JSON.stringify(msg);
  for (const c of conns) {
    if (c === except || !c.player || c.socket.readyState !== WebSocket.OPEN) continue;
    if (c.socket.bufferedAmount > MAX_BUFFERED_BYTES) continue;
    c.socket.send(data);
  }
}

function parse(data: RawData): ClientMessage | null {
  try {
    const msg: unknown = JSON.parse(String(data));
    return typeof msg === 'object' && msg !== null && typeof (msg as { t?: unknown }).t === 'string' ? (msg as ClientMessage) : null;
  } catch {
    return null;
  }
}

function handle(conn: Conn, msg: ClientMessage): void {
  const now = Date.now();
  switch (msg.t) {
    case 'join': {
      if (conn.player) return; // one dot per connection
      if (!joins.allow(conn.ip)) {
        send(conn, { t: 'error', reason: 'rate' });
        conn.socket.close();
        return;
      }
      if (world.size >= MAX_DOTS) {
        send(conn, { t: 'error', reason: 'full' });
        conn.socket.close();
        return;
      }
      const studyMs = typeof msg.studyMs === 'number' && Number.isFinite(msg.studyMs) ? Math.min(Math.max(0, msg.studyMs), MAX_STUDY_MS) : 0;
      const player = world.add(sanitizeName(msg.name), sanitizeColor(msg.color), studyMs, msg.paused === true, now);
      conn.player = player;
      send(conn, { t: 'welcome', id: player.id, roster: world.roster(now) });
      broadcast({ t: 'roster', joined: [world.entry(player, now)] }, conn);
      return;
    }
    case 'leave':
      conn.socket.close();
      return;
    case 'pause':
    case 'resume':
      if (conn.player && world.setPaused(conn.player, msg.t === 'pause', now)) {
        broadcast({ t: 'roster', updated: [world.entry(conn.player, now)] });
      }
      return;
    case 'mode': {
      const mode = sanitizeMode(msg.mode);
      if (conn.player && mode) conn.player.mode = mode;
      return;
    }
    case 'ping':
      return;
  }
}

wss.on('connection', (socket, req) => {
  const conn: Conn = { socket, ip: clientIp(req), player: null, lastSeen: Date.now(), messageCount: 0 };
  conns.add(conn);

  // Browsers answer protocol pings automatically, even in throttled background tabs.
  socket.on('pong', () => (conn.lastSeen = Date.now()));
  socket.on('message', (data) => {
    conn.lastSeen = Date.now();
    if (++conn.messageCount > MAX_MESSAGES_PER_SECOND) {
      socket.terminate();
      return;
    }
    const msg = parse(data);
    if (msg) handle(conn, msg);
  });
  socket.on('close', () => {
    conns.delete(conn);
    if (conn.player && world.remove(conn.player.id)) broadcast({ t: 'roster', left: [conn.player.id] });
  });
  socket.on('error', () => socket.terminate());
});

// Simulation: physics at TICK_RATE, snapshots at SNAPSHOT_RATE.
let tick = 0;
let snapshotN = 0;
setInterval(() => {
  world.step(1 / TICK_RATE);
  if (++tick % (TICK_RATE / SNAPSHOT_RATE) === 0 && world.size > 0) {
    broadcast({ t: 'tick', n: snapshotN++, p: world.snapshot() });
  }
}, 1000 / TICK_RATE);

// Heartbeat: drop connections silent for HEARTBEAT_TIMEOUT_MS; reset message budgets.
setInterval(() => {
  const now = Date.now();
  for (const c of conns) {
    if (now - c.lastSeen > HEARTBEAT_TIMEOUT_MS) c.socket.terminate();
    else c.socket.ping();
  }
}, PING_INTERVAL_MS);
setInterval(() => {
  for (const c of conns) c.messageCount = 0;
}, 1000);

server.listen(PORT, () => console.log(`constellate server listening on :${PORT}`));
