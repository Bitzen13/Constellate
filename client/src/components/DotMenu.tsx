import { forwardRef, type CSSProperties } from 'react';
import { formatClock } from '../format';
import type { DotMeta } from '../sky/source';

interface Props {
  meta: DotMeta;
  studyMs: number;
}

// Small card that follows a clicked dot: its name and current study time.
// SkyCanvas moves it every frame via the forwarded ref.
export const DotMenu = forwardRef<HTMLDivElement, Props>(function DotMenu({ meta, studyMs }, ref) {
  return (
    <div ref={ref} className="dot-menu-anchor">
      <div className="dot-menu" style={{ '--c': meta.color } as CSSProperties} role="dialog" aria-label={meta.name}>
        <div className="dot-menu-name">{meta.name}</div>
        <div className="dot-menu-time">{formatClock(studyMs)}</div>
      </div>
    </div>
  );
});
