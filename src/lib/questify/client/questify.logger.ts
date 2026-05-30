import { QuestifyErrorCode } from './questify.errors';

export interface ApiLog {
  timestamp: string;       // ISO 8601
  requestId: string;
  method: string;
  endpoint: string;
  statusCode: number | null;
  durationMs: number;
  success: boolean;
  errorCode?: QuestifyErrorCode;
  cached: boolean;
  retryCount: number;
}

class QuestifyLogger {
  /**
   * Logs an API interaction.
   * Never log token values, passwords, OTPs, or any PII.
   */
  log(entry: ApiLog): void {
    if (process.env.NODE_ENV === 'development') {
      this.devLog(entry);
    } else {
      this.prodLog(entry);
    }
  }

  private devLog(entry: ApiLog): void {
    const color = entry.success ? 'color: green' : (entry.cached ? 'color: blue' : 'color: red');
    const status = entry.statusCode || 'ERR';
    const cachedStr = entry.cached ? '[CACHED] ' : '';
    const retryStr = entry.retryCount > 0 ? ` [Retries: ${entry.retryCount}]` : '';
    
    console.groupCollapsed(
      `%c[Questify API] ${cachedStr}${entry.method} ${entry.endpoint} ${status} (${entry.durationMs}ms)${retryStr}`,
      color
    );
    console.log('Request ID:', entry.requestId);
    console.log('Timestamp:', entry.timestamp);
    if (!entry.success && entry.errorCode) {
      console.log('Error Code:', entry.errorCode);
    }
    console.groupEnd();
  }

  private prodLog(entry: ApiLog): void {
    // In production, emit as JSON lines.
    // In a real integration, this might be sent to Datadog, Sentry, etc.
    const logString = JSON.stringify(entry);
    
    // For now, write to console which gets picked up by logging pipelines in many environments.
    if (entry.success) {
      console.info(logString);
    } else {
      console.error(logString);
    }
    
    // We can also dispatch an event if external listeners are set up
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questify:log', { detail: entry }));
    }
  }
}

export const logger = new QuestifyLogger();
