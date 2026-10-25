import { DEFAULT_COLOR, MAX_GOAL_MS, MAX_NAME_LENGTH, type StudyMode } from '@constellate/shared';

const FALLBACK_NAME = 'Anon';

// Matched anywhere in the name.
const BLOCKED_ANYWHERE = ['fuck', 'shit', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'slut', 'retard', 'bitch', 'pussy', 'wank'];
// Matched as whole words only, so "Dickens", "Hancock" and "spice" are fine.
const BLOCKED_WORDS = ['ass', 'dick', 'cock', 'fag', 'spic', 'kike', 'chink', 'nazi', 'rape', 'twat', 'tits', 'cum', 'porn'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

function isProfane(name: string): boolean {
  const lowered = name.toLowerCase().replace(/[013457@$!]/g, (c) => LEET[c]!);
  const squashed = lowered.replace(/[^a-z]/g, '');
  if (BLOCKED_ANYWHERE.some((w) => squashed.includes(w))) return true;
  const words = lowered.split(/[^a-z]+/);
  return words.some((w) => BLOCKED_WORDS.includes(w));
}

export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return FALLBACK_NAME;
  const cleaned = raw
    .replace(/<[^>]*>/g, '') // markup
    .replace(/[<>&"'`\\]/g, '')
    .replace(/[\p{C}]/gu, '') // control and invisible characters
    .replace(/\s+/g, ' ')
    .trim();
  const capped = Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim();
  if (!capped || isProfane(capped)) return FALLBACK_NAME;
  return capped;
}

export function sanitizeColor(raw: unknown): string {
  return typeof raw === 'string' && /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : DEFAULT_COLOR;
}

export function sanitizeMode(raw: unknown): StudyMode | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { type, duration } = raw as { type?: unknown; duration?: unknown };
  if (type === 'countup') return { type };
  if ((type === 'pomodoro' || type === 'goal') && typeof duration === 'number' && duration > 0 && duration <= MAX_GOAL_MS) {
    return { type, duration };
  }
  return null;
}
