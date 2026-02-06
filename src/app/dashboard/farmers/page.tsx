
'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';

import { farmers as initialFarmers } from '@/lib/data';
import type { Farmer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, QrCode, Trash2, Edit, Download, Filter, MapPin, Sprout, Activity, ArrowUp, ArrowDown, ArrowUpRight } from 'lucide-react';
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

type SortableKeys = keyof Farmer | 'location';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers.filter(f => f.status !== 'pending_approval'));
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [filters, setFilters] = useState<{
    sitios: string[];
    crops: string[];
    statuses: Farmer['status'][];
  }>({
    sitios: [],
    crops: [],
    statuses: [],
  });
  
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  const allSitios = [...new Set(initialFarmers.map((f) => f.sitio))].sort();
  const allCrops = [...new Set(initialFarmers.flatMap((f) => f.crops))];
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


  const generateQr = (farmerId: string) => {
    const url = `${window.location.origin}/dashboard/farmers/${farmerId}`;
    setQrCodeValue(url);
  };
  
  const handleEditFarmer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFarmer) return;

    const formData = new FormData(event.currentTarget);
    const updatedFarmer: Farmer = {
      ...editingFarmer,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      barangay: formData.get('barangay') as string,
      sitio: formData.get('sitio') as string,
      crops: (formData.get('crops') as string).split(',').map(c => c.trim()),
      farmSize: Number(formData.get('farm-size') as string),
    };

    setFarmers(farmers.map(f => f.id === updatedFarmer.id ? updatedFarmer : f));
    setEditingFarmer(null);
    toast({ title: "Tagumpay!", description: "Nai-update na ang datos ng magsasaka." });
  };

  const handleDeleteFarmer = (farmerId: string) => {
    setFarmers(farmers.filter(f => f.id !== farmerId));
    toast({ title: "Tagumpay!", description: "Natanggal na ang magsasaka sa database.", variant: 'destructive' });
  };

  const filteredFarmers = useMemo(() => farmers.filter(farmer => {
    const searchMatch = (
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.sitio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.crops.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sitioMatch = filters.sitios.length === 0 || filters.sitios.includes(farmer.sitio);
    const cropMatch = filters.crops.length === 0 || farmer.crops.some(crop => filters.crops.includes(crop));
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(farmer.status);

    return searchMatch && sitioMatch && cropMatch && statusMatch;
  }), [farmers, searchTerm, filters]);
  
  const sortedFarmers = useMemo(() => {
    let sortableItems = [...filteredFarmers];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            
            const key = sortConfig.key;

            if (key === 'location') {
                aValue = `${a.sitio}, ${a.barangay}`;
                bValue = `${b.sitio}, ${b.barangay}`;
            } else if (key === 'crops') {
                aValue = a.crops.join(', ');
                bValue = b.crops.join(', ');
            } else {
                 aValue = a[key as keyof Farmer];
                 bValue = b[key as keyof Farmer];
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Database ng Magsasaka</h1>
            <p className="text-muted-foreground">Tingnan, pamahalaan, at i-update ang mga profile ng lahat ng aprubadong magsasaka.</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="mr-2" /> I-export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => router.push('/dashboard/farmers/register')}><PlusCircle /> Magrehistro ng Magsasaka</Button>
          </div>
        </div>

        <div className="flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Maghanap ng magsasaka ayon sa pangalan, lokasyon, o pananim..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Filter className="mr-2" /> Filter</Button>
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
                        <DropdownMenuCheckboxItem
                          key={sitio}
                          checked={filters.sitios.includes(sitio)}
                          onCheckedChange={() => handleFilterChange('sitios', sitio)}
                        >
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
                        <DropdownMenuCheckboxItem
                          key={crop}
                          checked={filters.crops.includes(crop)}
                          onCheckedChange={() => handleFilterChange('crops', crop)}
                        >
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
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={filters.statuses.includes(status)}
                          onCheckedChange={() => handleFilterChange('statuses', status)}
                        >
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
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('name')}>
                        <div className="flex items-center">
                            Pangalan
                             <div className="w-8 flex-shrink-0 flex justify-center">
                                {sortConfig?.key === 'name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                            </div>
                        </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('location')}>
                        <div className="flex items-center">
                            Lokasyon
                            <div className="w-8 flex-shrink-0 flex justify-center">
                                {sortConfig?.key === 'location' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                            </div>
                        </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('crops')}>
                        <div className="flex items-center">
                            Mga Pananim
                            <div className="w-8 flex-shrink-0 flex justify-center">
                                {sortConfig?.key === 'crops' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                            </div>
                        </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>
                        <div className="flex items-center">
                            Katayuan
                            <div className="w-8 flex-shrink-0 flex justify-center">
                                {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                            </div>
                        </div>
                    </TableHead>
                    <TableHead className="text-right">Mga Aksyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image src={farmer.avatarUrl} alt={farmer.name} width={32} height={32} className="rounded-full object-cover" />
                        <Link href={`/dashboard/farmers/${farmer.id}`} className="hover:underline break-words">{farmer.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="break-words">{farmer.sitio}, {farmer.barangay}</TableCell>
                    <TableCell className="break-words">{farmer.crops.join(', ')}</TableCell>
                    <TableCell><Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>{farmer.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingFarmer(farmer)}><Edit /></Button>
                            <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 /></Button></AlertDialogTrigger>
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
                            <Button variant="outline" size="sm" onClick={() => generateQr(farmer.id)}><QrCode /></Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {qrCodeValue && (
        <Dialog open={!!qrCodeValue} onOpenChange={() => setQrCodeValue(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Farmer QR ID Card</DialogTitle>
              <DialogDescription>I-scan ang QR code na ito para buksan ang logbook ng magsasaka.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg"><QRCodeCanvas value={qrCodeValue} size={256} /></div>
            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="secondary" onClick={() => window.print()}>I-print</Button>
              <DialogClose asChild><Button type="button" variant="outline">Isara</Button></DialogClose>
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
                    <Label htmlFor="edit-name" className="text-right">Pangalan</Label>
                    <Input id="edit-name" name="name" defaultValue={editingFarmer.name} required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-phone" className="text-right">Telepono</Label>
                    <Input id="edit-phone" name="phone" defaultValue={editingFarmer.phone} required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-barangay" className="text-right">Barangay</Label>
                    <Input id="edit-barangay" name="barangay" defaultValue="Batakil" required readOnly className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-sitio" className="text-right">Sitio/Purok</Label>
                    <Select name="sitio" defaultValue={editingFarmer.sitio} required>
                        <SelectTrigger id="edit-sitio" className="col-span-3">
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
                    <Label htmlFor="edit-crops" className="text-right">Mga Pananim</Label>
                    <Input id="edit-crops" name="crops" defaultValue={editingFarmer.crops.join(', ')} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-farm-size" className="text-right">Sukat (ha)</Label>
                    <Input id="edit-farm-size" name="farm-size" type="number" step="0.1" defaultValue={editingFarmer.farmSize} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" asChild className="mr-auto">
                        <Link href={`/dashboard/farmers/${editingFarmer.id}`}>
                            Buong Profile
                            <ArrowUpRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                    <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                    <Button type="submit">I-save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    