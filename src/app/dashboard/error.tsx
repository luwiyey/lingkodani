'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('Dashboard route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-2xl border-destructive/20">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-xl sm:text-2xl">May problemang naganap sa page na ito</CardTitle>
          </div>
          <CardDescription className="text-sm leading-relaxed sm:text-base">
            Pansamantala itong hindi nag-load nang maayos. Maaari mong i-refresh ang view o bumalik muna sa dashboard habang nire-recover ng app ang route.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} className="w-full sm:w-auto">
            <RefreshCcw />
            Subukang muli
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard">
              <ArrowLeft />
              Bumalik sa dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
