/**
 * Application monitoring utilities
 */

export function logMetric(
  name: string,
  value: number,
  unit: string,
  metadata?: Record<string, unknown>
): void {
  console.log(`[METRIC] ${name}=${value}${unit}`, metadata || '');

  // In production, send to monitoring system (Google Cloud Logging, Datadog, etc.)
  // sendToMonitoringService(log);
}

export function logError(error: Error, context?: string): void {
  console.error(`[ERROR] ${context || 'Unknown context'}:`, error);

  // In production, send to error tracking (Sentry, Rollbar, etc.)
  // sendToErrorTracking({ error, context, timestamp: new Date() });
}

export function logInfo(message: string, data?: Record<string, unknown>): void {
  console.info(`[INFO] ${message}`, data || '');
}

export function logWarning(message: string, data?: Record<string, unknown>): void {
  console.warn(`[WARN] ${message}`, data || '');
}
