import { DEFAULT_CONFIG } from './config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  location?: string;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = DEFAULT_CONFIG.IS_DEV;
  }

  private log(level: LogLevel, message: string, data?: any, location?: string): void {
    if (!this.isDev) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp,
      location
    };

    const prefix = `[${timestamp}] [${level.toUpperCase()}]${location ? ` [${location}]` : ''}`;
    
    // Stringify data if it's an object, array, or other complex type
    let formattedData = '';
    if (data !== undefined && data !== null) {
      if (typeof data === 'object') {
        try {
          formattedData = JSON.stringify(data, null, 2);
        } catch (error) {
          formattedData = String(data);
        }
      } else {
        formattedData = String(data);
      }
    }
    
    switch (level) {
      case 'error':
        console.error(prefix, message, formattedData);
        break;
      case 'warn':
        console.warn(prefix, message, formattedData);
        break;
      case 'debug':
        console.debug(prefix, message, formattedData);
        break;
      default:
        console.log(prefix, message, formattedData);
    }
  }

  info(message: string, data?: any, location?: string): void {
    this.log('info', message, data, location);
  }

  warn(message: string, data?: any, location?: string): void {
    this.log('warn', message, data, location);
  }

  error(message: string, data?: any, location?: string): void {
    this.log('error', message, data, location);
  }

  debug(message: string, data?: any, location?: string): void {
    this.log('debug', message, data, location);
  }

  // Helper method to log API calls
  apiCall(method: string, url: string, data?: any, location?: string): void {
    this.info(`API ${method.toUpperCase()} ${url}`, data, location || 'API');
  }

  // Helper method to log API responses
  apiResponse(method: string, url: string, status: number, data?: any, location?: string): void {
    const message = `API ${method.toUpperCase()} ${url} - ${status}`;
    if (status >= 400) {
      this.error(message, data, location || 'API');
    } else {
      this.info(message, data, location || 'API');
    }
  }

  // Helper method to log component lifecycle events
  component(event: string, componentName: string, data?: any): void {
    this.debug(`Component ${event}`, data, componentName);
  }

  // Helper method to log authentication events
  auth(event: string, data?: any): void {
    this.info(`Auth ${event}`, data, 'AUTH');
  }
}

export const logger = new Logger();
export default logger; 