'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function use2FASetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const setupTwoFA = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);

      toast({
        title: 'Success',
        description: 'Scan QR code with authenticator app',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      toast({
        title: 'Success',
        description: '2FA enabled successfully',
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    setupTwoFA,
    verifyToken,
    qrCode,
    backupCodes,
    isLoading,
    error,
  };
}
