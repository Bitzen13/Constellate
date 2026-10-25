// Simulation
export const TICK_RATE = 30; // physics steps per second (server)
export const SNAPSHOT_RATE = 15; // tick broadcasts per second

// Connection
export const WS_PATH = '/ws';
export const PING_INTERVAL_MS = 5_000;
export const HEARTBEAT_TIMEOUT_MS = 10_000;
export const MAX_MESSAGE_BYTES = 1024;

// Limits
export const MAX_NAME_LENGTH = 20;
export const MAX_DOTS = 500;
export const JOINS_PER_MINUTE = 10; // per IP
export const MAX_STUDY_MS = 24 * 3_600_000; // cap on study time carried over a reconnect

// Study modes
export const POMODORO_WORK_MS = 25 * 60_000;
export const POMODORO_BREAK_MS = 5 * 60_000;
export const MAX_GOAL_MS = 8 * 3_600_000;

export const DEFAULT_PORT = 8080;
export const DEFAULT_COLOR = '#9775fa';
