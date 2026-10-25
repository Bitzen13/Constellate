import { useMemo } from 'react';
import { NebulaCanvas } from './components/NebulaCanvas';
import { SkyCanvas } from './components/SkyCanvas';
import { DemoSource } from './sky/demo';

function demoCount(): number {
  const n = Number(new URLSearchParams(location.search).get('demo'));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : 40;
}

// Phase 1: local prototype with fake dots.
export function App() {
  const link = useMemo(() => new DemoSource(demoCount(), { name: 'You', color: '#9775fa' }), []);
  return (
    <>
      <NebulaCanvas />
      <SkyCanvas link={link} />
    </>
  );
}
