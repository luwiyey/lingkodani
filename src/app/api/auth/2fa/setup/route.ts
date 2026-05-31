import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest } from '@/lib/auth-utils';
import { generate2FASecret } from '@/lib/two-factor-auth';
import { db } from '@/lib/firebase-admin';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth || auth.role !== 'developer') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    // Generate 2FA secret
    const { secret, qrCode, backupCodes } = generate2FASecret(email);

    // Save to user document (temporarily, until confirmed)
    await db.collection('users').doc(auth.uid).update({
      twoFactorPending: {
        secret,
        backupCodes,
        createdAt: new Date(),
      },
    });

    logSecurityEvent(
      '2FA_SECRET_GENERATED',
      { email },
      auth.uid,
      email
    );

    return NextResponse.json({
      secret,
      qrCode,
      backupCodes,
      message: '2FA setup initiated. Scan QR code with authenticator app.',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: '2FA setup failed' },
      { status: 500 }
    );
  }
}
