import { POMODORO_BREAK_MS, type StudyMode } from '@constellate/shared';

export interface ClockView {
  ms: number;
  kind: 'up' | 'down' | 'over'; // over: a goal reached, now counting the extra time
}

// Your own study clock. Everything is derived from elapsed time in update(), so it stays
// correct even when a background tab only gets a timer tick once a minute.
export class Session {
  mode: StudyMode = { type: 'countup' };
  userPaused = false;
  onBreak = false; // pomodoro break: counts as paused for study time and freezes your dot
  private studyMs = 0;
  private modeMs = 0; // goal: study time since the goal was set; pomodoro: time in the current interval
  private last: number;

  constructor(now: number) {
    this.last = now;
  }

  get paused(): boolean {
    return this.userPaused || this.onBreak;
  }

  get totalMs(): number {
    return this.studyMs;
  }

  update(now: number): void {
    const dt = Math.max(0, now - this.last);
    this.last = now;
    if (!this.paused) this.studyMs += dt;

    if (this.mode.type === 'goal' && !this.paused) this.modeMs += dt;
    if (this.mode.type === 'pomodoro' && !this.userPaused) {
      this.modeMs += dt;
      const limit = this.onBreak ? POMODORO_BREAK_MS : this.mode.duration;
      if (this.modeMs >= limit) {
        this.modeMs = 0;
        this.onBreak = !this.onBreak;
      }
    }
  }

  setUserPaused(paused: boolean, now: number): void {
    this.update(now);
    this.userPaused = paused;
  }

  setMode(mode: StudyMode, now: number): void {
    this.update(now);
    this.mode = mode;
    this.modeMs = 0;
    this.onBreak = false;
  }

  view(): ClockView {
    switch (this.mode.type) {
      case 'countup':
        return { ms: this.studyMs, kind: 'up' };
      case 'pomodoro':
        return { ms: (this.onBreak ? POMODORO_BREAK_MS : this.mode.duration) - this.modeMs, kind: 'down' };
      case 'goal': {
        const left = this.mode.duration - this.modeMs;
        return left > 0 ? { ms: left, kind: 'down' } : { ms: -left, kind: 'over' };
      }
    }
  }
}
