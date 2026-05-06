'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Check, Download, Search, Upload, X } from 'lucide-react';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  extractFarmerRegistrationsFromJson,
  formatFarmerRegistrationsAsCsv,
  parseFarmerRegistrationsCsv,
} from '@/lib/data-portability';
import { getFarmerIdentityAssessment } from '@/lib/farmer-identity';
import { cn } from '@/lib/utils';

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function getIdentityBadgeClass(trustLevel?: 'unknown' | 'probable' | 'verified') {
  if (trustLevel === 'verified') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (trustLevel === 'probable') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function getRiskBadgeClass(risk?: 'none' | 'shared_household' | 'possible_duplicate' | 'high_duplicate') {
  if (risk === 'shared_household') {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }

  if (risk === 'possible_duplicate') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (risk === 'high_duplicate') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function formatRiskLabel(risk?: 'none' | 'shared_household' | 'possible_duplicate' | 'high_duplicate') {
  if (risk === 'shared_household') {
    return 'Shared household';
  }

  if (risk === 'possible_duplicate') {
    return 'Needs duplicate review';
  }

  if (risk === 'high_duplicate') {
    return 'High duplicate risk';
  }

  return 'No duplicate risk';
}

function ApprovalsPageContent() {
  const { farmers, addPendingFarmer, updateFarmerStatus, updateManyFarmerStatuses } = useData();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [updatingFarmerIds, setUpdatingFarmerIds] = useState<string[]>([]);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);
  const focusedFarmerId = searchParams.get('farmer');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!focusedFarmerId) {
      return;
    }

    const target = document.getElementById(`farmer-row-${focusedFarmerId}`);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusedFarmerId, farmers.length]);

  const pendingFarmers = farmers.filter((farmer) => farmer.status === 'pending_approval');

  const identityHints = useMemo(() => {
    const activeOrInactive = farmers.filter(
      (farmer) =>
        (farmer.status === 'active' || farmer.status === 'inactive') &&
        !farmer.mergedIntoFarmerId
    );

    return new Map(
      pendingFarmers.map((farmer) => {
        const assessment = getFarmerIdentityAssessment(farmer, activeOrInactive);

        return [
          farmer.id,
          {
            ...assessment,
            matches: assessment.duplicateMatches
              .map((match) => ({
                ...match,
                farmer: activeOrInactive.find((candidate) => candidate.id === match.farmerId),
              }))
              .filter((match) => Boolean(match.farmer))
              .slice(0, 3),
          },
        ];
      })
    );
  }, [farmers, pendingFarmers]);

  const handleApproval = async (farmerId: string, isApproved: boolean) => {
    const farmerToUpdate = farmers.find((farmer) => farmer.id === farmerId);

    if (!farmerToUpdate) {
      toast({
        title: 'Walang farmer record',
        description: 'Hindi na makita ang pending farmer na ito. Subukang i-refresh ang page.',
        variant: 'destructive',
      });
      return;
    }

    if (farmerToUpdate.status !== 'pending_approval') {
      toast({
        title: 'Hindi na valid ang approval action',
        description: `Si ${farmerToUpdate.name} ay wala na sa pending approvals queue.`,
        variant: 'destructive',
      });
      return;
    }

    if (updatingFarmerIds.includes(farmerId)) {
      return;
    }

    const newStatus = isApproved ? 'active' : 'rejected';

    setUpdatingFarmerIds((prev) => [...prev, farmerId]);
    const result = await updateFarmerStatus(farmerId, newStatus);
    setUpdatingFarmerIds((prev) => prev.filter((id) => id !== farmerId));

    if (!result.ok) {
      toast({
        title: 'Hindi natuloy ang update',
        description:
          result.reason === 'no_change'
            ? `Si ${farmerToUpdate.name} ay na-process na dati.`
            : result.reason === 'not_found'
              ? 'Hindi makita ang farmer record sa demo data store.'
              : 'May problema sa pag-save ng approval sa demo data store.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: isApproved ? "Magsasaka Inaprubahan" : "Magsasaka Tinanggihan",
      description: `Si ${farmerToUpdate.name} ay matagumpay na ${isApproved ? 'naaprubahan at naidagdag sa database' : 'tinanggihan'}.`,
    });
  };

  const handleApproveAll = async () => {
    if (pendingFarmers.length === 0) {
      toast({
        title: "Walang Nakabinbing Pag-apruba",
        description: "Wala nang magsasaka na kailangang aprubahan.",
        variant: "destructive",
      });
      return;
    }

    const reviewSafeFarmers = pendingFarmers.filter((farmer) => {
      const risk = identityHints.get(farmer.id)?.duplicateRiskLevel;
      return risk !== 'high_duplicate' && risk !== 'possible_duplicate';
    });
    const skippedForReview = pendingFarmers.length - reviewSafeFarmers.length;

    if (reviewSafeFarmers.length === 0) {
      toast({
        title: 'Kailangan ng manu-manong review',
        description: 'May duplicate-risk flags ang lahat ng pending farmers. Paki-review sila isa-isa bago aprubahan.',
        variant: 'destructive',
      });
      return;
    }

    setIsApprovingAll(true);
    const result = await updateManyFarmerStatuses(
      reviewSafeFarmers.map((farmer) => farmer.id),
      'active'
    );
    setIsApprovingAll(false);

    if (!result.ok) {
      toast({
        title: 'Hindi natuloy ang bulk approval',
        description:
          result.reason === 'none_selected'
            ? 'Walang valid na farmer records para i-update.'
            : 'May problema sa pag-save ng bulk approval sa demo data store.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: "Lahat ay Inaprubahan",
      description: `${result.updatedCount} na magsasaka ang naaprubahan.${skippedForReview > 0 ? ` ${skippedForReview} ang iniwan muna para sa duplicate review.` : ''}`,
    });
  };

  const handleImportSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const extension = getFileExtension(file.name);
      const importedFarmers = extension === 'csv'
        ? parseFarmerRegistrationsCsv(text)
        : extension === 'json'
          ? extractFarmerRegistrationsFromJson(JSON.parse(text))
          : [];

      if (importedFarmers.length === 0) {
        throw new Error('Walang valid na farmer registration records sa napiling file. Gumamit ng JSON o CSV export mula sa Lingkod-Ani.');
      }

      const existingPhones = new Set(farmers.map((farmer) => normalizePhone(farmer.phone)));
      let importedCount = 0;
      let skippedCount = 0;

      for (const importedFarmer of importedFarmers) {
        const normalizedPhone = normalizePhone(importedFarmer.phone);
        const candidateRecord = {
          id: `IMPORT-${importedCount + skippedCount}`,
          name: importedFarmer.name,
          age: importedFarmer.age || 0,
          gender: importedFarmer.gender || 'Hindi natukoy',
          phone: importedFarmer.phone,
          barangay: importedFarmer.barangay,
          sitio: importedFarmer.sitio,
          farmSize: importedFarmer.farmSize || 0,
          crops: importedFarmer.crops ? importedFarmer.crops.split(',').map((crop) => crop.trim()).filter(Boolean) : [],
          registrationDate: new Date().toISOString(),
          lastSmsActivity: new Date().toISOString(),
          status: 'pending_approval' as const,
          sharedPhone: importedFarmer.sharedPhone,
          householdLabel: importedFarmer.householdLabel,
          sharedPhoneNotes: importedFarmer.sharedPhoneNotes,
        };
        const assessment = getFarmerIdentityAssessment(candidateRecord, farmers);
        const blocksImport =
          assessment.duplicateRiskLevel === 'high_duplicate' ||
          (assessment.duplicateRiskLevel === 'possible_duplicate' && existingPhones.has(normalizedPhone));

        if (blocksImport) {
          skippedCount += 1;
          continue;
        }

        const result = await addPendingFarmer(importedFarmer);

        if (result.ok) {
          existingPhones.add(normalizedPhone);
          importedCount += 1;
        } else {
          skippedCount += 1;
        }
      }

      toast({
        title: 'Natapos ang farmer import',
        description: `${importedCount} bagong pending registrations ang naidagdag.${skippedCount > 0 ? ` ${skippedCount} duplicate-risk records ang nilaktawan muna.` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Hindi ma-import ang farmer registrations',
        description: error instanceof Error ? error.message : 'Hindi mabasa ang import file.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'json') {
      downloadFile(
        `lingkod-ani-pending-farmers-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(filteredFarmers, null, 2),
        'application/json'
      );
    } else {
      downloadFile(
        `lingkod-ani-pending-farmers-${new Date().toISOString().slice(0, 10)}.csv`,
        formatFarmerRegistrationsAsCsv(filteredFarmers),
        'text/csv;charset=utf-8'
      );
    }

    toast({
      title: 'Na-export ang pending registrations',
      description: `${filteredFarmers.length} pending farmer records ang naisama sa ${format.toUpperCase()} file.`,
    });
  };

  const filteredFarmers = pendingFarmers.filter((farmer) =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${farmer.sitio}, ${farmer.barangay}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (farmer.householdLabel ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Input type="file" ref={importRef} className="hidden" onChange={handleImportSelect} accept=".json,.csv,application/json,text/csv" />
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pag-apruba ng Magsasaka</h1>
          <p className="text-muted-foreground">Suriin at aprubahan ang mga bagong magsasaka na nagparehistro sa pamamagitan ng SMS o manu-manong pag-input.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Mag-import</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> I-export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>Export JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => void handleApproveAll()} disabled={isApprovingAll}>
            {isApprovingAll ? 'Inaaprubahan...' : 'Aprubahan Lahat'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Maghanap ng magsasaka ayon sa pangalan, telepono, lokasyon, o household..."
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
                  filteredFarmers.map((farmer) => {
                    const identityAssessment = identityHints.get(farmer.id);

                    return (
                      <TableRow
                        key={farmer.id}
                        id={`farmer-row-${farmer.id}`}
                        className={cn(
                          focusedFarmerId === farmer.id && 'bg-primary/5 outline outline-2 outline-primary/40',
                        )}
                      >
                        <TableCell className="font-medium px-2 py-4 md:px-4 break-words">
                          <div className="space-y-2">
                            <p>{farmer.name}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className={cn(getIdentityBadgeClass(identityAssessment?.trustLevel))}
                              >
                                Identity: {identityAssessment?.trustLevel ?? 'unknown'}
                              </Badge>
                              {farmer.sharedPhone || identityAssessment?.duplicateRiskLevel === 'shared_household' ? (
                                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                                  Shared phone
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="break-all px-2 py-4 md:px-4">{farmer.phone}</TableCell>
                        <TableCell className="break-words px-2 py-4 md:px-4">
                          <div className="space-y-2">
                            <p>{farmer.sitio}, {farmer.barangay}</p>
                            {farmer.householdLabel ? (
                              <p className="text-xs text-muted-foreground">Household: {farmer.householdLabel}</p>
                            ) : null}
                            {identityAssessment?.matches.length ? (
                              <div className="space-y-1">
                                <Badge
                                  variant="outline"
                                  className={cn(getRiskBadgeClass(identityAssessment.duplicateRiskLevel))}
                                >
                                  {formatRiskLabel(identityAssessment.duplicateRiskLevel)}
                                </Badge>
                                {identityAssessment.matches.map((hint) => (
                                  <p key={hint.farmerId} className="text-xs text-muted-foreground">
                                    Match: {hint.farmer?.name} ({hint.farmer?.phone}) · score {hint.score} · {hint.reasons.join(', ')}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="break-words px-2 py-4 md:px-4">{isClient ? new Date(farmer.registrationDate).toLocaleString() : ''}</TableCell>
                        <TableCell className="text-right px-2 py-4 md:px-4">
                          <div className="flex justify-end gap-2">
                            <HoverTooltip text="Aprubahan">
                              <Button
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => void handleApproval(farmer.id, true)}
                                disabled={updatingFarmerIds.includes(farmer.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </HoverTooltip>
                            <HoverTooltip text="Tanggihan">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => void handleApproval(farmer.id, false)}
                                disabled={updatingFarmerIds.includes(farmer.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </HoverTooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-6" />}>
      <ApprovalsPageContent />
    </Suspense>
  );
}
