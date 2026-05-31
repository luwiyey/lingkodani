'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logMetric } from '@/lib/monitoring';

export function useSMSDeduplication() {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkDuplicate = async (
    farmerPhone: string,
    messageContent: string
  ) => {
    setIsChecking(true);

    try {
      const response = await fetch('/api/sms/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerPhone, messageContent }),
      });

      if (!response.ok) {
        throw new Error('Duplicate check failed');
      }

      const result = await response.json();

      logMetric('sms_duplicate_check', result.isDuplicate ? 1 : 0, 'count', {
        confidence: result.confidence,
      });

      if (result.isDuplicate) {
        toast({
          title: 'Duplicate Detected',
          description: `This message is similar to case ${result.existingCaseId} (${result.confidence}% match)`,
          variant: 'default',
        });
      }

      return result;
    } catch (error) {
      console.error('Duplicate check error:', error);
      toast({
        title: 'Error',
        description: 'Failed to check for duplicates',
        variant: 'destructive',
      });
      return { isDuplicate: false };
    } finally {
      setIsChecking(false);
    }
  };

  return { checkDuplicate, isChecking };
}
