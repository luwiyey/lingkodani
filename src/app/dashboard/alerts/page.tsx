
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng Alerto</h1>
        <p className="text-muted-foreground">
          Dito maaaring tingnan ang kasaysayan ng mga alerto at bumuo ng mga bago gamit ang AI.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Paparating na</CardTitle>
          <CardDescription>
            Ang feature na ito para sa pamamahala ng mga alerto ay kasalukuyang ginagawa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Malapit nang maging available ang pahinang ito.</p>
        </CardContent>
      </Card>
    </div>
  );
}
