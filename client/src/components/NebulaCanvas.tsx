import { useEffect, useRef } from 'react';

// Drawn at low resolution and blurred by CSS: cheap, and the softness is the point.
const SCALE = 1 / 8;
const FPS = 20;
const BLOBS = 6;
const STRENGTH = 0.07; // peak alpha per blob; keep it barely noticeable
const BASE = '#05060a';

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = BASE;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';

  const size = Math.max(w, h);
  for (let i = 0; i < BLOBS; i++) {
    const phase = i * 1.7;
    const x = (0.5 + 0.38 * Math.sin(t * 0.013 * (1 + i * 0.17) + phase)) * w;
    const y = (0.5 + 0.38 * Math.cos(t * 0.011 * (1 + i * 0.23) + phase * 1.3)) * h;
    const r = (0.45 + 0.1 * Math.sin(t * 0.02 + i)) * size;
    const hue = (i * (360 / BLOBS) + t * 3) % 360;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `hsla(${hue}, 80%, 55%, ${STRENGTH})`);
    grad.addColorStop(1, `hsla(${hue}, 80%, 55%, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

export function NebulaCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth * SCALE);
      canvas.height = Math.ceil(window.innerHeight * SCALE);
    };
    resize();

    let raf = 0;
    let last = -Infinity;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      draw(ctx, canvas.width, canvas.height, now / 1000);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="nebula" aria-hidden />;
}
