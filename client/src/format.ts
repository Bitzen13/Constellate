const pad = (n: number) => String(n).padStart(2, '0');

// H:MM:SS from an hour up, MM:SS below. Countdowns round up so 25:00 shows at the start.
export function formatClock(ms: number, roundUp = false): string {
  const total = Math.max(0, roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
