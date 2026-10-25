import type { CSSProperties } from 'react';
import type { Identity } from '../identity';

interface Props {
  identity: Identity;
  onStart: () => void;
  onEdit: () => void;
}

// Dark background and one start control. The faint corner dot reopens setup.
export function Idle({ identity, onStart, onEdit }: Props) {
  return (
    <div className="screen idle" style={{ '--c': identity.color } as CSSProperties}>
      <button className="start" onClick={onStart} autoFocus aria-label="Enter focus mode" />
      <button className="edit-identity" onClick={onEdit} aria-label="Change name and color" />
    </div>
  );
}
