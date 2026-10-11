import { config } from '../config';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const currentLevel = config.isDev ? LogLevel.DEBUG : LogLevel.INFO;

function formatMessage(level: string, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

export const logger = {
  error(message: string, meta?: unknown): void {
    if (currentLevel >= LogLevel.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },

  warn(message: string, meta?: unknown): void {
    if (currentLevel >= LogLevel.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  info(message: string, meta?: unknown): void {
    if (currentLevel >= LogLevel.INFO) {
      console.info(formatMessage('INFO', message, meta));
    }
  },

  debug(message: string, meta?: unknown): void {
    if (currentLevel >= LogLevel.DEBUG) {
      console.info(formatMessage('DEBUG', message, meta));
    }
  },
};
