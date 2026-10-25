import { useEffect, useReducer, useRef, useState } from 'react';
import type { DotId } from '@constellate/shared';
import type { Identity } from '../identity';
import { Connection, serverUrl } from '../net/connection';
import { DemoSource } from '../sky/demo';
import type { SkyLink } from '../sky/source';
import { DotMenu } from './DotMenu';
import { CloseIcon } from './Icons';
import { SkyCanvas } from './SkyCanvas';

interface Props {
  identity: Identity;
  demo: number | null;
  onExit: () => void;
}

export function Focus({ identity, demo, onExit }: Props) {
  const [link, setLink] = useState<SkyLink | null>(null);
  const [selected, setSelected] = useState<DotId | null>(null);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const menuRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    const l: SkyLink = demo
      ? new DemoSource(demo, identity)
      : new Connection(serverUrl(), () => ({ name: identity.name, color: identity.color }), { onError: () => exitRef.current() });
    setLink(l);
    return () => l.close();
  }, [identity, demo]);

  // Study times in the click menu tick once a second.
  useEffect(() => {
    const t = setInterval(rerender, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected !== null) setSelected(null);
      else exitRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const meta = selected !== null ? link?.dots.get(selected) : undefined;
  const studyMs = meta ? meta.studyMs + (meta.paused ? 0 : performance.now() - meta.receivedAt) : 0;

  return (
    <>
      {link && <SkyCanvas link={link} followId={meta ? selected : null} followRef={menuRef} onSelect={setSelected} />}
      {meta && <DotMenu ref={menuRef} meta={meta} studyMs={studyMs} />}
      <div className="toolbar">
        <button className="icon-btn" onClick={onExit} aria-label="Leave focus mode">
          <CloseIcon />
        </button>
      </div>
    </>
  );
}
