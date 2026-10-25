// Wire protocol between client and server. Coordinates are normalized (0..1); durations are ms.

export type DotId = number;

export type StudyMode =
  | { type: 'countup' }
  | { type: 'pomodoro'; duration: number } // work interval; breaks are POMODORO_BREAK_MS
  | { type: 'goal'; duration: number };

export interface RosterEntry {
  id: DotId;
  name: string;
  color: string;
  studyMs: number; // as of when this entry was sent
  paused: boolean;
}

export type ClientMessage =
  | { t: 'join'; name: string; color: string; studyMs?: number; paused?: boolean } // studyMs/paused carry over a reconnect
  | { t: 'leave' }
  | { t: 'ping' }
  | { t: 'pause' }
  | { t: 'resume' }
  | { t: 'mode'; mode: StudyMode };

export type ServerMessage =
  | { t: 'welcome'; id: DotId; roster: RosterEntry[] }
  | { t: 'roster'; joined?: RosterEntry[]; left?: DotId[]; updated?: RosterEntry[] }
  // n counts snapshots, so clients can time them without trusting arrival jitter.
  // p is flat [id, x, y, id, x, y, ...] to keep snapshots small.
  | { t: 'tick'; n: number; p: number[] }
  | { t: 'error'; reason: 'full' | 'rate' };
