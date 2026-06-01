// ============================================================
// SovereignMind Orchestrator — Structured Logger
// ============================================================

import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const dateStr = new Date().toISOString().split('T')[0];

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'orchestrator' },
  transports: [
    // File: JSON structured logs
    new winston.transports.File({
      filename: path.join(logsDir, `orchestrator-${dateStr}.log`),
      maxsize: 10 * 1024 * 1024, // 10MB
    }),
    // File: Errors only
    new winston.transports.File({
      filename: path.join(logsDir, `errors-${dateStr}.log`),
      level: 'error',
    }),
    // Console: Human-readable colored output
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
  ],
});
