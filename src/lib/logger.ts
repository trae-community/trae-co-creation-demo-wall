type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';

function shouldLog(level: LogLevel): boolean {
  if (level === 'error') return true;
  if (level === 'warn') return true;
  if (isProd) return false;
  return true;
}

function format(scope: string, message: string) {
  return scope ? `[${scope}] ${message}` : message;
}

export const logger = {
  debug(scope: string, message: string, detail?: unknown) {
    if (!shouldLog('debug')) return;
    if (detail !== undefined) {
      console.debug(format(scope, message), detail);
    } else {
      console.debug(format(scope, message));
    }
  },
  warn(scope: string, message: string, detail?: unknown) {
    if (!shouldLog('warn')) return;
    if (detail !== undefined) {
      console.warn(format(scope, message), detail);
    } else {
      console.warn(format(scope, message));
    }
  },
  error(scope: string, message: string, detail?: unknown) {
    if (detail !== undefined) {
      console.error(format(scope, message), detail);
    } else {
      console.error(format(scope, message));
    }
  },
};
