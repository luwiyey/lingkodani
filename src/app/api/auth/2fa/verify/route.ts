import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest } from '@/lib/auth-utils';
import { verify2FAToken } from '@/lib/two-factor-auth';
import { db } from '@/lib/firebase-admin';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Get pending 2FA setup
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();

    if (!userData?.twoFactorPending?.secret) {
      return NextResponse.json(
        { error: '2FA setup not initiated' },
        { status: 400 }
      );
    }

    // Verify token
    const verification = verify2FAToken(userData.twoFactorPending.secret, token);

    if (!verification.valid) {
      logSecurityEvent(
        '2FA_VERIFICATION_FAILED',
        { reason: 'invalid_token' },
        auth.uid
      );
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Confirm 2FA
    await db.collection('users').doc(auth.uid).update({
      twoFactor: {
        enabled: true,
        secret: userData.twoFactorPending.secret,
        backupCodes: userData.twoFactorPending.backupCodes,
        confirmedAt: new Date(),
      },
      twoFactorPending: null,
    });

    logSecurityEvent(
      '2FA_VERIFICATION_FAILED',
      { success: true },
      auth.uid
    );

    return NextResponse.json({
      message: '2FA successfully enabled',
      backupCodes: userData.twoFactorPending.backupCodes,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: '2FA verification failed' },
      { status: 500 }
    );
  }
}
