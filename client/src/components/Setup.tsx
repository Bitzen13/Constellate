import { useState, type CSSProperties, type FormEvent } from 'react';
import { MAX_NAME_LENGTH } from '@constellate/shared';
import { PALETTE, type Identity } from '../identity';
import { ArrowIcon } from './Icons';

interface Props {
  initial: Identity | null;
  onDone: (identity: Identity) => void;
}

// First-visit screen: a name field and a color picker. The preview dot shows the chosen color.
export function Setup({ initial, onDone }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]!);
  const trimmed = name.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed) onDone({ name: trimmed, color });
  };

  return (
    <form className="screen setup" style={{ '--c': color } as CSSProperties} onSubmit={submit}>
      <div className="preview-dot" />
      <input
        className="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        aria-label="Your name"
      />
      <div className="swatches" role="radiogroup" aria-label="Dot color">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === color}
            aria-label={c}
            className="swatch"
            style={{ '--c': c } as CSSProperties}
            onClick={() => setColor(c)}
          />
        ))}
        <label className="swatch custom" aria-checked={!PALETTE.includes(color)} role="radio">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Custom color" />
        </label>
      </div>
      <button type="submit" className="icon-btn" disabled={!trimmed} aria-label="Continue">
        <ArrowIcon />
      </button>
    </form>
  );
}
