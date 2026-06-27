/**
 * Simple structured logging utility.
 * Logs JSON to stdout for easy parsing by log aggregators.
 */

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let minLevel = LEVELS.debug;

export function setLogLevel(level) {
  minLevel = LEVELS[level] ?? LEVELS.debug;
}

function log(level, message, meta = {}) {
  if (LEVELS[level] < minLevel) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
