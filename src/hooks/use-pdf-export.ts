'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logMetric } from '@/lib/monitoring';

export function usePDFExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const exportToPDF = async (
    caseId: string,
    type: 'case-report' | 'analytics' = 'case-report'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-${caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logMetric('pdf_exported', 1, 'count', { caseId, type });

      toast({
        title: 'Success',
        description: 'PDF exported successfully',
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

  return { exportToPDF, isLoading, error };
}
