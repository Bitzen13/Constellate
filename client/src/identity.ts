import { MAX_NAME_LENGTH } from '@constellate/shared';

export interface Identity {
  name: string;
  color: string;
}

const KEY = 'constellate.identity';

export const PALETTE = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'];

export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { name, color } = JSON.parse(raw) as Partial<Identity>;
    if (typeof name !== 'string' || !name.trim() || typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return null;
    return { name: name.slice(0, MAX_NAME_LENGTH), color };
  } catch {
    return null;
  }
}

export function saveIdentity(identity: Identity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    // Private mode or blocked storage: the setup screen just shows again next visit.
  }
}
