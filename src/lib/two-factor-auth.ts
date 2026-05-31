import * as OTPAuth from 'otpauth';
import { logSecurityEvent } from './security-logger';

export interface TwoFASecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFAVerification {
  valid: boolean;
  timeRemaining?: number;
}

export function generate2FASecret(email: string): TwoFASecret {
  const totp = new OTPAuth.TOTP({
    issuer: 'Lingkod-Ani',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  logSecurityEvent('2FA_SECRET_GENERATED', { email });

  return {
    secret: totp.secret.base32,
    qrCode: totp.toString(),
    backupCodes,
  };
}

export function verify2FAToken(secret: string, token: string): TwoFAVerification {
  try {
    const totp = new OTPAuth.TOTP({ secret });
    const isValid = totp.validate({ token, window: 1 }) !== null;

    if (!isValid) {
      logSecurityEvent('2FA_VERIFICATION_FAILED', { reason: 'invalid_token' });
    }

    return { valid: isValid };
  } catch (error) {
    logSecurityEvent('2FA_VERIFICATION_ERROR', { error: String(error) });
    return { valid: false };
  }
}

export function verify2FABackupCode(
  backupCodes: string[],
  code: string
): { valid: boolean; remaining: number } {
  const index = backupCodes.indexOf(code.toUpperCase());

  if (index === -1) {
    return { valid: false, remaining: backupCodes.length };
  }

  // Mark as used (in practice, remove from list and save)
  const remaining = backupCodes.filter((_, i) => i !== index).length;

  logSecurityEvent('2FA_BACKUP_CODE_USED', { remaining });

  return { valid: true, remaining };
}
