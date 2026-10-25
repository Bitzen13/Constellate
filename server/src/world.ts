import { spawnBody, step, type Body, type DotId, type RosterEntry, type StudyMode } from '@constellate/shared';

export interface Player {
  id: DotId;
  name: string;
  color: string;
  body: Body;
  mode: StudyMode;
  studyMs: number; // accumulated up to activeSince
  activeSince: number | null; // null while paused
}

// The authoritative sky: every joined player and their dot.
export class World {
  readonly players = new Map<DotId, Player>();
  private bodies: Body[] = [];
  private nextId = 1;

  get size(): number {
    return this.players.size;
  }

  add(name: string, color: string, studyMs: number, paused: boolean, now: number): Player {
    const body = spawnBody();
    body.frozen = paused;
    const player: Player = {
      id: this.nextId++,
      name,
      color,
      body,
      mode: { type: 'countup' },
      studyMs,
      activeSince: paused ? null : now,
    };
    this.players.set(player.id, player);
    this.bodies.push(body);
    return player;
  }

  remove(id: DotId): boolean {
    const player = this.players.get(id);
    if (!player) return false;
    this.players.delete(id);
    this.bodies = this.bodies.filter((b) => b !== player.body);
    return true;
  }

  // Pausing stops the player's study time and freezes their dot in place.
  setPaused(player: Player, paused: boolean, now: number): boolean {
    if (paused === (player.activeSince === null)) return false;
    if (paused) {
      player.studyMs += now - player.activeSince!;
      player.activeSince = null;
    } else {
      player.activeSince = now;
    }
    player.body.frozen = paused;
    return true;
  }

  entry(player: Player, now: number): RosterEntry {
    const live = player.activeSince === null ? 0 : now - player.activeSince;
    return {
      id: player.id,
      name: player.name,
      color: player.color,
      studyMs: player.studyMs + live,
      paused: player.activeSince === null,
    };
  }

  roster(now: number): RosterEntry[] {
    return [...this.players.values()].map((p) => this.entry(p, now));
  }

  step(dt: number): void {
    step(this.bodies, dt);
  }

  // Flat [id, x, y, ...], rounded to keep the JSON small.
  snapshot(): number[] {
    const out: number[] = [];
    for (const p of this.players.values()) {
      out.push(p.id, Math.round(p.body.x * 1e4) / 1e4, Math.round(p.body.y * 1e4) / 1e4);
    }
    return out;
  }
}
