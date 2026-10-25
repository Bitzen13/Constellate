import type { ClientMessage, DotId, RosterEntry } from '@constellate/shared';

export interface DotMeta extends RosterEntry {
  receivedAt: number; // performance.now() when studyMs was last reported
}

// Anything the sky can draw: the live server connection or the local demo.
export interface SkyLink {
  readonly meId: DotId | null;
  readonly dots: ReadonlyMap<DotId, DotMeta>;
  sample(now: number, out: (id: DotId, x: number, y: number) => void): void;
  send(msg: ClientMessage): void;
  close(): void;
}
