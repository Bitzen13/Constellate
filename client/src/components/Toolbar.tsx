import type { StudyMode } from '@constellate/shared';
import { CloseIcon, InfinityIcon, PauseIcon, PlayIcon, TargetIcon, TimerIcon } from './Icons';

interface Props {
  visible: boolean;
  paused: boolean;
  mode: StudyMode['type'];
  settingGoal: boolean;
  onTogglePause: () => void;
  onCountUp: () => void;
  onPomodoro: () => void;
  onGoal: () => void;
  onLeave: () => void;
}

export function Toolbar(p: Props) {
  const modeClass = (m: StudyMode['type']) => `icon-btn${(p.settingGoal ? m === 'goal' : p.mode === m) ? ' active' : ''}`;
  return (
    <div className={`toolbar${p.visible ? '' : ' hidden'}`}>
      <button className={`icon-btn${p.paused ? ' active' : ''}`} onClick={p.onTogglePause} aria-label={p.paused ? 'Resume' : 'Pause'}>
        {p.paused ? <PlayIcon /> : <PauseIcon />}
      </button>
      <span className="toolbar-gap" />
      <button className={modeClass('countup')} onClick={p.onCountUp} aria-label="Open-ended" aria-pressed={p.mode === 'countup'}>
        <InfinityIcon />
      </button>
      <button className={modeClass('pomodoro')} onClick={p.onPomodoro} aria-label="Pomodoro" aria-pressed={p.mode === 'pomodoro'}>
        <TimerIcon />
      </button>
      <button className={modeClass('goal')} onClick={p.onGoal} aria-label="Timed goal" aria-pressed={p.mode === 'goal'}>
        <TargetIcon />
      </button>
      <span className="toolbar-gap" />
      <button className="icon-btn" onClick={p.onLeave} aria-label="Leave focus mode">
        <CloseIcon />
      </button>
    </div>
  );
}
