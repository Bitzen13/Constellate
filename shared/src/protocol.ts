// Wire protocol between client and server. Coordinates are normalized (0..1).

export type DotId = number;

export type StudyMode =
  | { type: 'countup' }
  | { type: 'pomodoro'; duration: number }
  | { type: 'goal'; duration: number };

export interface RosterEntry {
  id: DotId;
  name: string;
  color: string;
  studyMs: number;
  paused: boolean;
}

export type ClientMessage =
  | { t: 'join'; name: string; color: string }
  | { t: 'leave' }
  | { t: 'ping' }
  | { t: 'pause' }
  | { t: 'resume' }
  | { t: 'mode'; mode: StudyMode };

export type ServerMessage =
  | { t: 'welcome'; id: DotId; roster: RosterEntry[] }
  | { t: 'roster'; joined?: RosterEntry[]; left?: DotId[] }
  // Flat [id, x, y, id, x, y, ...] to keep snapshots small.
  | { t: 'tick'; p: number[] };
