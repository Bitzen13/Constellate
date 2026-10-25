import { formatClock } from '../format';
import type { ClockView } from '../session';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface Props {
  view: ClockView;
  paused: boolean;
  onBreak: boolean;
  goalMinutes: number | null; // non-null while choosing a goal length
  onAdjustGoal: (deltaMinutes: number) => void;
  onConfirmGoal: () => void;
}

// The large central clock: the one piece of always-on text the design approves.
export function Clock({ view, paused, onBreak, goalMinutes, onAdjustGoal, onConfirmGoal }: Props) {
  const setting = goalMinutes !== null;
  const text = setting ? formatClock(goalMinutes * 60_000) : formatClock(view.ms, view.kind === 'down');
  const state = setting ? 'setting' : onBreak ? 'break' : paused ? 'paused' : view.kind === 'over' ? 'over' : '';

  return (
    <div className={`clock ${state}`}>
      {setting && (
        <button className="icon-btn ghost" onClick={() => onAdjustGoal(5)} aria-label="Longer goal">
          <ChevronUpIcon />
        </button>
      )}
      <div className="clock-time" role="timer" aria-live="off">
        {text}
      </div>
      {setting && (
        <div className="clock-setting-actions">
          <button className="icon-btn ghost" onClick={() => onAdjustGoal(-5)} aria-label="Shorter goal">
            <ChevronDownIcon />
          </button>
          <button className="icon-btn" onClick={onConfirmGoal} aria-label="Start goal">
            <CheckIcon />
          </button>
        </div>
      )}
    </div>
  );
}
