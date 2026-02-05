
'use client';

import React, { useState } from 'react';
import { farmers as initialFarmers } from '@/lib/data';
import type { Farmer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Check, X, Upload } from 'lucide-react';

export default function ApprovalsPage() {
  const [pendingFarmers, setPendingFarmers] = useState<Farmer[]>(initialFarmers.filter(f => f.status === 'pending_approval'));
  const { toast } = useToast();

  const handleApproval = (farmerId: string, isApproved: boolean) => {
    const farmer = pendingFarmers.find(f => f.id === farmerId);
    if (!farmer) return;

    // In a real app, you would update the farmer's status in the database.
    // For now, we just remove them from the pending list.
    setPendingFarmers(current => current.filter(f => f.id !== farmerId));

    toast({
      title: isApproved ? "Magsasaka Inaprubahan" : "Magsasaka Tinanggihan",
      description: `Si ${farmer.name} ay matagumpay na ${isApproved ? 'naaprubahan at naidagdag sa database' : 'tinanggihan'}.`,
    });
  };

  const handleApproveAll = () => {
    if (pendingFarmers.length === 0) {
      toast({
        title: "Walang Nakabinbing Pag-apruba",
        description: "Wala nang magsasaka na kailangang aprubahan.",
        variant: "destructive",
      });
      return;
    }
    const count = pendingFarmers.length;
    setPendingFarmers([]);
    toast({
      title: "Lahat ay Inaprubahan",
      description: `${count} na magsasaka ang matagumpay na naaprubahan at naidagdag sa database.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pag-apruba ng Magsasaka</h1>
          <p className="text-muted-foreground">Suriin at aprubahan ang mga bagong magsasaka na nagparehistro sa pamamagitan ng SMS o manu-manong pag-input.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Mag-import</Button>
            <Button onClick={handleApproveAll}>Aprubahan Lahat</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mga Nakabinbing Pagpaparehistro</CardTitle>
          <CardDescription>
            Mayroong {pendingFarmers.length} magsasaka na naghihintay ng pag-apruba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pangalan</TableHead>
                <TableHead>Numero ng Telepono</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead>Petsa ng Pagpaparehistro</TableHead>
                <TableHead className="text-right">Mga Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingFarmers.length > 0 ? (
                pendingFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>{farmer.phone}</TableCell>
                    <TableCell>{farmer.sitio}, {farmer.barangay}</TableCell>
                    <TableCell>{new Date(farmer.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col space-y-2 items-end">
                        <Button size="sm" onClick={() => handleApproval(farmer.id, true)} className="w-[120px]">
                          <Check className="mr-2 h-4 w-4" /> Aprubahan
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleApproval(farmer.id, false)} className="w-[120px]">
                          <X className="mr-2 h-4 w-4" /> Tanggihan
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Walang nakabinbing pag-apruba sa kasalukuyan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
