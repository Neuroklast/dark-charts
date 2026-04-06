type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogPayload {
  level: LogLevel;
  timestamp: string;
  message: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private static isProduction(): boolean {
    // Check Node environment
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
      return true;
    }
    // Check Vite environment
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
      return true;
    }
    return false;
  }

  private static formatError(error: any): any {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }
    return error;
  }

  private static log(level: LogLevel, message: string | Error, meta: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();

    let msgStr = typeof message === 'string' ? message : '';

    if (message instanceof Error) {
      meta.error = this.formatError(message);
      msgStr = message.message;
    }

    if (meta.error) {
      meta.error = this.formatError(meta.error);
    }

    const payload: LogPayload = {
      level,
      timestamp,
      message: msgStr,
      ...meta,
    };

    if (this.isProduction()) {
      console.log(JSON.stringify(payload));
    } else {
      const metaKeys = Object.keys(meta);
      const metaString = metaKeys.length ? `\n${JSON.stringify(meta, null, 2)}` : '';
      const formattedMessage = `[${timestamp}] [${level}] ${msgStr}${metaString}`;

      switch (level) {
        case 'ERROR':
          console.error(formattedMessage);
          break;
        case 'WARN':
          console.warn(formattedMessage);
          break;
        case 'INFO':
          console.info(formattedMessage);
          break;
        case 'DEBUG':
          console.debug(formattedMessage);
          break;
      }
    }
  }

  static error(message: string | Error, meta?: Record<string, any>) {
    this.log('ERROR', message, meta);
  }

  static warn(message: string, meta?: Record<string, any>) {
    this.log('WARN', message, meta);
  }

  static info(message: string, meta?: Record<string, any>) {
    this.log('INFO', message, meta);
  }

  static debug(message: string, meta?: Record<string, any>) {
    this.log('DEBUG', message, meta);
  }
}

export const logger = Logger;
