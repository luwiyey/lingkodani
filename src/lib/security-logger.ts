/**
 * Security event logging for audit trails
 */
export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_EXPORT'
  | 'USER_DISABLED'
  | 'PASSWORD_CHANGED'
  | '2FA_SECRET_GENERATED'
  | '2FA_VERIFICATION_FAILED'
  | '2FA_VERIFICATION_ERROR'
  | '2FA_BACKUP_CODE_USED'
  | 'CASE_DELETED'
  | 'DATA_RETENTION_CLEANUP'
  | 'INCIDENT_RESPONSE_INITIATED';

export interface SecurityEvent {
  eventType: SecurityEventType;
  timestamp: Date;
  userId?: string;
  email?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

const securityLog: SecurityEvent[] = [];

export function logSecurityEvent(
  eventType: SecurityEventType,
  metadata?: Record<string, unknown>,
  userId?: string,
  email?: string
): void {
  const event: SecurityEvent = {
    eventType,
    timestamp: new Date(),
    userId,
    email,
    metadata,
  };

  securityLog.push(event);

  // In production, send to centralized logging (Sentry, Cloud Logging, etc.)
  console.log(`[SECURITY] ${eventType}:`, metadata || '');

  // Keep only last 10,000 events in memory
  if (securityLog.length > 10000) {
    securityLog.shift();
  }
}

export function getSecurityLog(
  limit: number = 100,
  eventType?: SecurityEventType
): SecurityEvent[] {
  let log = [...securityLog];

  if (eventType) {
    log = log.filter((e) => e.eventType === eventType);
  }

  return log.slice(-limit);
}

export function clearSecurityLog(): void {
  securityLog.length = 0;
}
