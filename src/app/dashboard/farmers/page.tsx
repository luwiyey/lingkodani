
'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import type { Farmer } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, QrCode, Trash2, Edit, Download, Filter, MapPin, Sprout, Activity, ArrowUp, ArrowDown, ArrowUpRight, User, ArrowRightLeft, Archive, ArchiveRestore } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatFarmerRegistrationsAsCsv } from '@/lib/data-portability';
import { findPossibleFarmerDuplicates } from '@/lib/farmer-duplicates';

type SortableKeys = keyof Farmer | 'location';

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function FarmersPage() {
  const { farmers, updateFarmerRecord, updateFarmerStatus, mergeFarmerRecords, deleteFarmerRecord } = useData();
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [mergeSourceFarmer, setMergeSourceFarmer] = useState<Farmer | null>(null);
  const [mergeTargetFarmerId, setMergeTargetFarmerId] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();
  const [filters, setFilters] = useState<{
    sitios: string[];
    crops: string[];
    statuses: string[];
  }>({
    sitios: [],
    crops: [],
    statuses: [],
  });
  
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  const activeFarmers = farmers.filter(
    (f) => (f.status === 'active' || f.status === 'inactive') && !f.mergedIntoFarmerId
  );
  const archivedFarmers = useMemo(
    () =>
      farmers
        .filter((farmer) => farmer.status === 'archived' && !farmer.mergedIntoFarmerId)
        .sort(
          (left, right) =>
            new Date(right.archivedAt ?? right.registrationDate).getTime() -
            new Date(left.archivedAt ?? left.registrationDate).getTime()
        ),
    [farmers]
  );
  const allSitios = [...new Set(activeFarmers.map((f) => f.sitio))].sort();
  const allCrops = [...new Set(activeFarmers.flatMap((f) => f.crops))];
  const allStatuses: Farmer['status'][] = ['active', 'inactive'];

  const handleFilterChange = (
    type: 'sitios' | 'crops' | 'statuses',
    value: string
  ) => {
    setFilters((prev) => {
      const newValues = prev[type].includes(value as never)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value as never];
      return { ...prev, [type]: newValues };
    });
  };
  
  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      downloadFile(
        `lingkod-ani-farmers-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(sortedFarmers, null, 2),
        'application/json'
      );
    } else {
      downloadFile(
        `lingkod-ani-farmers-${new Date().toISOString().slice(0, 10)}.csv`,
        formatFarmerRegistrationsAsCsv(sortedFarmers),
        'text/csv;charset=utf-8'
      );
    }

    toast({
      title: 'Na-export ang farmer database',
      description: `${sortedFarmers.length} farmer profiles ang naisama sa ${format.toUpperCase()} file.`,
    });
  };

  const generateQr = (farmerId: string) => {
    const url = `${window.location.origin}/dashboard/farmers/${farmerId}`;
    setQrCodeValue(url);
  };
  
  const handleEditFarmer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFarmer) return;

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const updatedData: Partial<Farmer> = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      barangay: formData.get('barangay') as string,
      sitio: formData.get('sitio') as string,
      crops: (formData.get('crops') as string).split(',').map(c => c.trim()),
      farmSize: Number(formData.get('farm-size') as string),
    };

    updateFarmerRecord(editingFarmer.id, updatedData);
    setEditingFarmer(null);
    toast({ title: "Tagumpay!", description: "Nai-update na ang datos ng magsasaka." });
  };

  const handleDeleteFarmer = (farmerId: string) => {
    deleteFarmerRecord(farmerId);
    toast({ title: "Tagumpay!", description: "Natanggal na ang magsasaka sa database.", variant: 'destructive' });
  };

  const handleArchiveFarmer = (farmer: Farmer) => {
    updateFarmerStatus(farmer.id, 'archived', {
      archiveReason: 'Moved away, duplicate cleanup, or retained only for audit trail.',
    });
    toast({
      title: 'Na-archive ang farmer record',
      description: `Nakatago na sa active roster si ${farmer.name}, pero nananatili ang history para sa audit at reporting.`,
    });
  };

  const handleRestoreFarmer = (farmer: Farmer) => {
    updateFarmerStatus(farmer.id, 'inactive');
    toast({
      title: 'Naibalik ang farmer record',
      description: `Naibalik si ${farmer.name} sa inactive roster para ma-reactivate kung kinakailangan.`,
    });
  };

  const mergeCandidates = useMemo(
    () =>
      activeFarmers.filter((farmer) => farmer.id !== mergeSourceFarmer?.id),
    [activeFarmers, mergeSourceFarmer?.id]
  );
  const duplicateHints = useMemo(
    () =>
      new Map(
        activeFarmers.map((farmer) => [
          farmer.id,
          findPossibleFarmerDuplicates(farmer, activeFarmers)
            .map((match) => ({
              ...match,
              farmer: activeFarmers.find((candidate) => candidate.id === match.farmerId),
            }))
            .filter((match) => Boolean(match.farmer))
            .slice(0, 2),
        ])
      ),
    [activeFarmers]
  );

  const handleMergeFarmer = async () => {
    if (!mergeSourceFarmer || !mergeTargetFarmerId) {
      return;
    }

    const targetFarmer = farmers.find((farmer) => farmer.id === mergeTargetFarmerId);

    if (!targetFarmer) {
      toast({
        title: 'Walang target farmer',
        description: 'Pumili muna ng tamang farmer record na paglalagyan ng merged history.',
        variant: 'destructive',
      });
      return;
    }

    const merged = await mergeFarmerRecords(mergeSourceFarmer.id, mergeTargetFarmerId);

    if (!merged) {
      toast({
        title: 'Hindi natuloy ang merge',
        description: 'Walang nabagong farmer records. Pakisubukang muli kapag stable ang koneksyon.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Na-merge ang farmer records',
      description: `Ang history ni ${mergeSourceFarmer.name} ay nailipat na kay ${targetFarmer.name}. Mananatiling traceable ang lumang number sa phone history.`,
    });
    setMergeSourceFarmer(null);
    setMergeTargetFarmerId('');
  };

  const filteredFarmers = useMemo(() => activeFarmers.filter(farmer => {
    const searchMatch = (
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.sitio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.crops.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sitioMatch = filters.sitios.length === 0 || filters.sitios.includes(farmer.sitio);
    const cropMatch = filters.crops.length === 0 || farmer.crops.some(crop => filters.crops.includes(crop));
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(farmer.status);

    return searchMatch && sitioMatch && cropMatch && statusMatch;
  }), [activeFarmers, searchTerm, filters]);
  
  const sortedFarmers = useMemo(() => {
    const sortableItems = [...filteredFarmers];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            let aValue: string | number = '';
            let bValue: string | number = '';
            
            const key = sortConfig.key;

            if (key === 'location') {
                aValue = `${a.sitio}, ${a.barangay}`;
                bValue = `${b.sitio}, ${b.barangay}`;
            } else if (key === 'crops') {
                aValue = a.crops.join(', ');
                bValue = b.crops.join(', ');
            } else {
                 aValue = (a[key as keyof Farmer] as string | number | undefined) ?? '';
                 bValue = (b[key as keyof Farmer] as string | number | undefined) ?? '';
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredFarmers, sortConfig]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="space-y-1">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold tracking-tight">Database ng Magsasaka</h1>
                    <HoverTooltip text="Tingnan, pamahalaan, at i-update ang mga profile ng lahat ng aprubadong magsasaka.">
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 self-center shrink-0">
                            
                        </Button>
                    </HoverTooltip>
                </div>
                <p className="text-muted-foreground">Tingnan, pamahalaan, at i-update ang mga profile ng lahat ng aprubadong magsasaka.</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" />I-export</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('json')}>Export JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => router.push('/dashboard/farmers/register')}><PlusCircle /> Magrehistro ng Magsasaka</Button>
            </div>
        </div>

        <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Maghanap ng magsasaka..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Lokasyon (Sitio)</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>Pumili ng Sitio</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allSitios.map((sitio) => (
                        <DropdownMenuCheckboxItem key={sitio} checked={filters.sitios.includes(sitio)} onCheckedChange={() => handleFilterChange('sitios', sitio)}>
                          {sitio}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sprout className="mr-2 h-4 w-4" />
                    <span>Pananim</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>Pumili ng Pananim</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allCrops.map((crop) => (
                        <DropdownMenuCheckboxItem key={crop} checked={filters.crops.includes(crop)} onCheckedChange={() => handleFilterChange('crops', crop)}>
                          {crop}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Activity className="mr-2 h-4 w-4" />
                    <span>Katayuan</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>Pumili ng Katayuan</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allStatuses.map((status) => (
                        <DropdownMenuCheckboxItem key={status} checked={filters.statuses.includes(status)} onCheckedChange={() => handleFilterChange('statuses', status)}>
                          {status}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                
              </DropdownMenuContent>
            </DropdownMenu>
        </div>


        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 md:px-4" onClick={() => requestSort('name')}>
                          <div className="flex items-center">
                              Pangalan
                              <div className="w-8 flex-shrink-0 flex justify-center">
                                  {sortConfig?.key === 'name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                              </div>
                          </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 md:px-4" onClick={() => requestSort('location')}>
                          <div className="flex items-center">
                              Lokasyon
                              <div className="w-8 flex-shrink-0 flex justify-center">
                                  {sortConfig?.key === 'location' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                              </div>
                          </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 md:px-4" onClick={() => requestSort('crops')}>
                          <div className="flex items-center">
                              Mga Pananim
                              <div className="w-8 flex-shrink-0 flex justify-center">
                                  {sortConfig?.key === 'crops' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                              </div>
                          </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 px-2 md:px-4" onClick={() => requestSort('status')}>
                          <div className="flex items-center">
                              Katayuan
                              <div className="w-8 flex-shrink-0 flex justify-center">
                                  {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                              </div>
                          </div>
                      </TableHead>
                      <TableHead className="text-right px-2 md:px-4">Mga Aksyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFarmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium px-2 py-2 md:px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border">
                                {farmer.avatarUrl ? <AvatarImage src={farmer.avatarUrl} alt={farmer.name} /> : null}
                                <AvatarFallback>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                              <div className="min-w-0">
                                <span className="truncate block">{farmer.name}</span>
                                {duplicateHints.get(farmer.id)?.length ? (
                                  <div className="mt-1 space-y-1">
                                    <Badge variant="outline">Possible duplicate</Badge>
                                    {duplicateHints.get(farmer.id)?.map((hint) => (
                                      <p key={hint.farmerId} className="text-xs text-muted-foreground">
                                        {hint.farmer?.name} · {hint.reasons.join(', ')}
                                      </p>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                        </TableCell>
                      <TableCell className="px-2 py-4 md:px-4">{farmer.sitio}, {farmer.barangay}</TableCell>
                      <TableCell className="px-2 py-4 md:px-4">{farmer.crops.join(', ')}</TableCell>
                      <TableCell className="px-2 py-4 md:px-4">
                        <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>{farmer.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right px-2 py-4 md:px-4">
                        <div className="flex flex-wrap justify-end gap-1">
                            <HoverTooltip text="I-edit">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingFarmer(farmer)}><Edit className="h-4 w-4" /></Button>
                            </HoverTooltip>
                            <HoverTooltip text="I-merge sa ibang farmer record">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setMergeSourceFarmer(farmer);
                                  setMergeTargetFarmerId('');
                                }}
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            </HoverTooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <HoverTooltip text="I-archive para manatiling nasa audit history">
                                  <Button variant="outline" size="icon" className="h-8 w-8"><Archive className="h-4 w-4" /></Button>
                                </HoverTooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>I-archive ang farmer record?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                      Hindi ito permanenteng mabubura. Aalis lang ito sa active roster pero mananatili ang SMS history, assistance ledger, at audit trail.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleArchiveFarmer(farmer)}>I-archive</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <HoverTooltip text="Alisin">
                                  <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
                                </HoverTooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Sigurado ka ba?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                      Ang aksyon na ito ay hindi na maaaring bawiin. Permanenteng tatanggalin nito ang datos ng magsasaka.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteFarmer(farmer.id)}>Ituloy</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <HoverTooltip text="I-generate ang QR Code">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => generateQr(farmer.id)}><QrCode className="h-4 w-4" /></Button>
                            </HoverTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Archived Farmer Records</h2>
                <p className="text-sm text-muted-foreground">
                  Mga record na hindi na aktibong kasama sa roster pero nananatiling traceable para sa audit at historical reporting.
                </p>
              </div>
              <Badge variant="outline">{archivedFarmers.length}</Badge>
            </div>

            {archivedFarmers.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Wala pang archived farmer records.
              </div>
            ) : (
              <div className="space-y-3">
                {archivedFarmers.map((farmer) => (
                  <div key={farmer.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{farmer.name}</span>
                        <Badge variant="secondary">archived</Badge>
                        {farmer.phone ? <Badge variant="outline">{farmer.phone}</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {farmer.sitio}, {farmer.barangay}
                        {farmer.archiveReason ? ` · ${farmer.archiveReason}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Archived {farmer.archivedAt ? new Date(farmer.archivedAt).toLocaleString() : 'recently'}
                        {farmer.archivedBy ? ` by ${farmer.archivedBy}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRestoreFarmer(farmer)}>
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Restore as inactive
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/farmers/${farmer.id}`)}>
                        Buksan ang profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {qrCodeValue && (
        <Dialog open={!!qrCodeValue} onOpenChange={() => setQrCodeValue(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Farmer QR ID Card</DialogTitle>
              <DialogDescription>I-scan ang QR code na ito para buksan ang logbook ng magsasaka.</DialogDescription>
            </DialogHeader>
            <div className="p-4 flex justify-center">
              <QRCodeCanvas value={qrCodeValue} size={256} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>I-print</Button>
              <DialogClose asChild>
                <Button>Isara</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingFarmer && (
        <Dialog open={!!editingFarmer} onOpenChange={() => setEditingFarmer(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>I-edit ang Profile ng Magsasaka</DialogTitle>
                <DialogDescription>I-update ang mga detalye para kay {editingFarmer.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditFarmer}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Pangalan</Label>
                    <Input id="name" name="name" defaultValue={editingFarmer.name} required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Telepono</Label>
                    <Input id="phone" name="phone" defaultValue={editingFarmer.phone} required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barangay" className="text-right">Barangay</Label>
                    <Input id="barangay" name="barangay" defaultValue="Batakil" required readOnly className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sitio" className="text-right">Sitio/Purok</Label>
                    <Select name="sitio" defaultValue={editingFarmer.sitio} required>
                        <SelectTrigger id="sitio" className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 7 }, (_, i) => i + 1).map(zone => (
                                <SelectItem key={zone} value={`Zone ${zone}`}>
                                    Zone {zone}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="crops" className="text-right">Mga Pananim</Label>
                    <Input id="crops" name="crops" defaultValue={editingFarmer.crops.join(', ')} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="farm-size" className="text-right">Sukat (ha)</Label>
                    <Input id="farm-size" name="farm-size" type="number" step="0.1" defaultValue={editingFarmer.farmSize} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                    <div className="flex-1">
                        <Button variant="link" className="p-0" asChild>
                            <Link href={`/dashboard/farmers/${editingFarmer.id}`}>Buong Profile <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </div>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Kanselahin</Button>
                    </DialogClose>
                    <Button type="submit">I-save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
      )}

      {mergeSourceFarmer && (
        <Dialog open={!!mergeSourceFarmer} onOpenChange={() => {
          setMergeSourceFarmer(null);
          setMergeTargetFarmerId('');
        }}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>I-merge ang farmer record</DialogTitle>
              <DialogDescription>
                Gamitin ito kung nagpalit ng SIM ang magsasaka o may duplicate profile. Ililipat ang SMS case ownership, assistance, visits, vouchers, at phone history sa napiling target record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">Source record</p>
                <p className="mt-1">{mergeSourceFarmer.name}</p>
                <p className="text-muted-foreground">{mergeSourceFarmer.phone} · {mergeSourceFarmer.sitio}, {mergeSourceFarmer.barangay}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="merge-target">Target farmer record</Label>
                <Select value={mergeTargetFarmerId} onValueChange={setMergeTargetFarmerId}>
                  <SelectTrigger id="merge-target">
                    <SelectValue placeholder="Piliin ang farmer na magmamana ng history" />
                  </SelectTrigger>
                  <SelectContent>
                    {mergeCandidates.map((farmer) => (
                      <SelectItem key={farmer.id} value={farmer.id}>
                        {farmer.name} · {farmer.phone} · {farmer.sitio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Kanselahin</Button>
              </DialogClose>
              <Button type="button" onClick={handleMergeFarmer} disabled={!mergeTargetFarmerId}>
                I-merge ang records
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
