// ============================================================
// SovereignMind Orchestrator — Structured Logger
// ============================================================

import winston from 'winston';
import path from 'path';
import fs from 'fs';

const dateStr = new Date().toISOString().split('T')[0];

// Build transports: always include console, optionally add file transports
const transports: winston.transport[] = [
  // Console: Human-readable colored output (always available; Railway captures stdout)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 1
          ? ` ${JSON.stringify(meta, null, 0)}`
          : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    ),
  }),
];

// File transports — may fail on Railway's ephemeral filesystem
try {
  const logsDir = path.resolve(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, `orchestrator-${dateStr}.log`),
      maxsize: 10 * 1024 * 1024, // 10MB
    }),
    new winston.transports.File({
      filename: path.join(logsDir, `errors-${dateStr}.log`),
      level: 'error',
    }),
  );
} catch {
  // File logging unavailable (e.g. Railway ephemeral FS) — console-only is fine
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'orchestrator' },
  transports,
});
