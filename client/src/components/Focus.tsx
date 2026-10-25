import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { MAX_GOAL_MS, POMODORO_WORK_MS, type DotId, type StudyMode } from '@constellate/shared';
import type { Identity } from '../identity';
import { Connection, serverUrl } from '../net/connection';
import { Session } from '../session';
import { DemoSource } from '../sky/demo';
import type { SkyLink } from '../sky/source';
import { Clock } from './Clock';
import { DotMenu } from './DotMenu';
import { SkyCanvas } from './SkyCanvas';
import { Toolbar } from './Toolbar';

const CLOCK_REFRESH_MS = 250;
const TOOLBAR_IDLE_MS = 3000;
const DEFAULT_GOAL_MINUTES = 60;
const MAX_GOAL_MINUTES = MAX_GOAL_MS / 60_000;

interface Props {
  identity: Identity;
  demo: number | null;
  onExit: () => void;
}

export function Focus({ identity, demo, onExit }: Props) {
  const [link, setLink] = useState<SkyLink | null>(null);
  const [selected, setSelected] = useState<DotId | null>(null);
  const [goalMinutes, setGoalMinutes] = useState<number | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  const [session] = useState(() => new Session(Date.now()));
  const linkRef = useRef<SkyLink | null>(null);
  const sentPaused = useRef(false); // what the server last heard
  const lastGoal = useRef(DEFAULT_GOAL_MINUTES);
  const menuRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  const syncPause = useCallback(() => {
    if (session.paused === sentPaused.current) return;
    sentPaused.current = session.paused;
    linkRef.current?.send({ t: session.paused ? 'pause' : 'resume' });
  }, [session]);

  useEffect(() => {
    const l: SkyLink = demo
      ? new DemoSource(demo, identity)
      : new Connection(
          serverUrl(),
          () => {
            // On a reconnect, carry study time and paused state over to the new dot.
            session.update(Date.now());
            sentPaused.current = session.paused;
            return { name: identity.name, color: identity.color, studyMs: session.totalMs, paused: session.paused };
          },
          {
            onWelcome: () => linkRef.current?.send({ t: 'mode', mode: session.mode }),
            onError: () => exitRef.current(),
          },
        );
    linkRef.current = l;
    setLink(l);
    return () => l.close();
  }, [identity, demo, session]);

  useEffect(() => {
    const t = setInterval(() => {
      session.update(Date.now());
      syncPause();
      rerender();
    }, CLOCK_REFRESH_MS);
    return () => clearInterval(t);
  }, [session, syncPause]);

  const togglePause = useCallback(() => {
    session.setUserPaused(!session.userPaused, Date.now());
    syncPause();
    rerender();
  }, [session, syncPause]);

  const chooseMode = useCallback(
    (mode: StudyMode) => {
      setGoalMinutes(null);
      session.setMode(mode, Date.now());
      linkRef.current?.send({ t: 'mode', mode });
      syncPause();
      rerender();
    },
    [session, syncPause],
  );

  const adjustGoal = useCallback((delta: number) => {
    setGoalMinutes((m) => (m === null ? m : Math.min(MAX_GOAL_MINUTES, Math.max(5, m + delta))));
  }, []);

  const confirmGoal = useCallback(() => {
    if (goalMinutes === null) return;
    lastGoal.current = goalMinutes;
    chooseMode({ type: 'goal', duration: goalMinutes * 60_000 });
  }, [goalMinutes, chooseMode]);

  // Keyboard: space pauses, Esc backs out of whatever is open (and finally leaves), arrows set a goal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inControl = (e.target as HTMLElement).closest('button, input');
      if (e.key === ' ' && !inControl) {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'Escape') {
        if (goalMinutes !== null) setGoalMinutes(null);
        else if (selected !== null) setSelected(null);
        else exitRef.current();
      } else if (goalMinutes !== null && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        adjustGoal(e.key === 'ArrowUp' ? 5 : -5);
      } else if (goalMinutes !== null && e.key === 'Enter' && !inControl) {
        confirmGoal();
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (goalMinutes !== null && e.deltaY !== 0) adjustGoal(e.deltaY < 0 ? 5 : -5);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [goalMinutes, selected, togglePause, adjustGoal, confirmGoal]);

  // The toolbar fades out when the mouse rests, so the sky and clock are all that's left.
  useEffect(() => {
    let t = 0;
    const wake = () => {
      setToolbarVisible(true);
      clearTimeout(t);
      t = window.setTimeout(() => setToolbarVisible(false), TOOLBAR_IDLE_MS);
    };
    wake();
    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  const meta = selected !== null ? link?.dots.get(selected) : undefined;
  const isMe = meta !== undefined && meta.id === link?.meId;
  const studyMs = !meta ? 0 : isMe ? session.totalMs : meta.studyMs + (meta.paused ? 0 : performance.now() - meta.receivedAt);

  return (
    <div className="focus" style={{ '--c': identity.color } as CSSProperties}>
      {link && <SkyCanvas link={link} followId={meta ? selected : null} followRef={menuRef} onSelect={setSelected} />}
      <Clock
        view={session.view()}
        paused={session.userPaused}
        onBreak={session.onBreak}
        goalMinutes={goalMinutes}
        onAdjustGoal={adjustGoal}
        onConfirmGoal={confirmGoal}
      />
      {meta && <DotMenu ref={menuRef} meta={meta} studyMs={studyMs} />}
      <Toolbar
        visible={toolbarVisible || session.userPaused || goalMinutes !== null}
        paused={session.userPaused}
        mode={session.mode.type}
        settingGoal={goalMinutes !== null}
        onTogglePause={togglePause}
        onCountUp={() => chooseMode({ type: 'countup' })}
        onPomodoro={() => chooseMode({ type: 'pomodoro', duration: POMODORO_WORK_MS })}
        onGoal={() => setGoalMinutes(goalMinutes === null ? lastGoal.current : null)}
        onLeave={onExit}
      />
    </div>
  );
}
