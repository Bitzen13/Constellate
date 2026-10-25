import { memo, useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import type { DotId } from '@constellate/shared';
import { SkyRenderer } from '../sky/renderer';
import type { SkyLink } from '../sky/source';

interface Props {
  link: SkyLink;
  followId?: DotId | null; // dot whose screen position drives followRef (the click menu)
  followRef?: RefObject<HTMLElement | null>;
  onSelect?: (id: DotId | null) => void;
}

export const SkyCanvas = memo(function SkyCanvas({ link, followId = null, followRef, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SkyRenderer | null>(null);
  const latest = useRef({ followId, followRef, onSelect });
  latest.current = { followId, followRef, onSelect };

  useEffect(() => {
    const renderer = new SkyRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    if (import.meta.env.DEV) Object.assign(window, { __sky: { renderer, link } }); // for browser tests

    let raf = 0;
    const loop = (now: number) => {
      renderer.frame(now, link);
      const { followId, followRef, onSelect } = latest.current;
      const el = followRef?.current;
      renderer.selected = followId;
      if (followId !== null && el) {
        const p = renderer.screenPos(followId);
        if (p) el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        else onSelect?.(null);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [link]);

  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const r = rendererRef.current;
    if (!r) return;
    r.hovered = r.hitTest(e.clientX, e.clientY);
    e.currentTarget.style.cursor = r.hovered !== null ? 'pointer' : '';
  };

  const onMouseLeave = () => {
    if (rendererRef.current) rendererRef.current.hovered = null;
  };

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const r = rendererRef.current;
    if (r) latest.current.onSelect?.(r.hitTest(e.clientX, e.clientY));
  };

  return <canvas ref={canvasRef} className="sky" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onClick={onClick} />;
});
