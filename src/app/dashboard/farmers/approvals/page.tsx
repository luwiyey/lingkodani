
'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/data-context';
import type { Farmer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Check, X, Upload, Search } from 'lucide-react';
import { HoverTooltip } from '@/components/ui/hover-tooltip';

export default function ApprovalsPage() {
  const { farmers, setFarmers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const pendingFarmers = farmers.filter(f => f.status === 'pending_approval');

  const handleApproval = (farmerId: string, isApproved: boolean) => {
    const farmerToUpdate = farmers.find(f => f.id === farmerId);
    if (!farmerToUpdate) return;

    const newStatus = isApproved ? 'active' : 'rejected';

    setFarmers(current =>
      current.map(f =>
        f.id === farmerId
          ? { ...f, status: newStatus }
          : f
      )
    );

    toast({
      title: isApproved ? "Magsasaka Inaprubahan" : "Magsasaka Tinanggihan",
      description: `Si ${farmerToUpdate.name} ay matagumpay na ${isApproved ? 'naaprubahan at naidagdag sa database' : 'tinanggihan'}.`,
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
    
    setFarmers(current => 
        current.map(f => 
            f.status === 'pending_approval' ? { ...f, status: 'active' } : f
        )
    );
    
    toast({
      title: "Lahat ay Inaprubahan",
      description: `${count} na magsasaka ang matagumpay na naaprubahan at naidagdag sa database.`,
    });
  };

  const handleImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        toast({
            title: "Nagsisimula ang Pag-import...",
            description: `Ang file na "${e.target.files[0].name}" ay pinoproseso na.`,
        });
    }
  };

  const filteredFarmers = pendingFarmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${farmer.sitio}, ${farmer.barangay}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Input type="file" ref={importRef} className="hidden" onChange={handleImportSelect} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pag-apruba ng Magsasaka</h1>
          <p className="text-muted-foreground">Suriin at aprubahan ang mga bagong magsasaka na nagparehistro sa pamamagitan ng SMS o manu-manong pag-input.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Mag-import</Button>
            <Button onClick={handleApproveAll}>Aprubahan Lahat</Button>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Maghanap ng magsasaka ayon sa pangalan, telepono, o lokasyon..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mga Nakabinbing Pagpaparehistro</CardTitle>
          <CardDescription>
            Mayroong {filteredFarmers.length} magsasaka na naghihintay ng pag-apruba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 md:px-4">Pangalan</TableHead>
                  <TableHead className="px-2 md:px-4">Numero ng Telepono</TableHead>
                  <TableHead className="px-2 md:px-4">Lokasyon</TableHead>
                  <TableHead className="px-2 md:px-4">Oras at Petsa ng Pagpaparehistro</TableHead>
                  <TableHead className="text-right px-2 md:px-4">Mga Aksyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium px-2 py-4 md:px-4">{farmer.name}</TableCell>
                      <TableCell className="break-all px-2 py-4 md:px-4">{farmer.phone}</TableCell>
                      <TableCell className="break-words px-2 py-4 md:px-4">{farmer.sitio}, {farmer.barangay}</TableCell>
                      <TableCell className="break-words px-2 py-4 md:px-4">{isClient ? new Date(farmer.registrationDate).toLocaleString() : ''}</TableCell>
                      <TableCell className="text-right px-2 py-4 md:px-4">
                        <div className="flex justify-end gap-2">
                            <HoverTooltip text="Aprubahan">
                                <Button size="icon" className="h-8 w-8" onClick={() => handleApproval(farmer.id, true)}>
                                    <Check className="h-4 w-4" />
                                </Button>
                            </HoverTooltip>
                            <HoverTooltip text="Tanggihan">
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleApproval(farmer.id, false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </HoverTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {searchTerm ? `Walang nahanap na magsasaka para sa "${searchTerm}".` : "Walang nakabinbing pag-apruba sa kasalukuyan."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
