import { useState } from 'react';
import { DEFAULT_COLOR } from '@constellate/shared';
import { Focus } from './components/Focus';
import { Idle } from './components/Idle';
import { NebulaCanvas } from './components/NebulaCanvas';
import { Setup } from './components/Setup';
import { loadIdentity, saveIdentity, type Identity } from './identity';

type Screen = 'setup' | 'idle' | 'focus';

// ?demo=N swaps the server for N local fake dots.
function demoCount(): number | null {
  const n = Number(new URLSearchParams(location.search).get('demo'));
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 1000) : null;
}

const demo = demoCount();

export function App() {
  const [identity, setIdentity] = useState<Identity | null>(() => loadIdentity() ?? (demo ? { name: 'You', color: DEFAULT_COLOR } : null));
  const [screen, setScreen] = useState<Screen>(() => (demo ? 'focus' : identity ? 'idle' : 'setup'));

  const finishSetup = (next: Identity) => {
    saveIdentity(next);
    setIdentity(next);
    setScreen('idle');
  };

  return (
    <>
      <NebulaCanvas />
      {screen === 'setup' && <Setup initial={identity} onDone={finishSetup} />}
      {screen === 'idle' && identity && <Idle identity={identity} onStart={() => setScreen('focus')} onEdit={() => setScreen('setup')} />}
      {screen === 'focus' && identity && <Focus identity={identity} demo={demo} onExit={() => setScreen('idle')} />}
    </>
  );
}
