'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';

import { farmers as initialFarmers } from '@/lib/data';
import type { Farmer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, QrCode, Trash2, Edit, Upload, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const { toast } = useToast();

  const generateQr = (farmerId: string) => {
    const url = `${window.location.origin}/dashboard/farmers/${farmerId}`;
    setQrCodeValue(url);
  };
  
  const handleAddFarmer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newFarmer: Farmer = {
      id: `FARM${String(farmers.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      municipality: formData.get('municipality') as string,
      barangay: formData.get('barangay') as string,
      sitio: formData.get('sitio') as string,
      crops: (formData.get('crops') as string).split(',').map(c => c.trim()),
      farmSize: Number(formData.get('farm-size') as string),
      age: 40, // default
      gender: 'Lalaki', // default
      registrationDate: new Date().toISOString(),
      lastSmsActivity: new Date().toISOString(),
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/40/40`,
      status: 'active',
    };
    setFarmers([newFarmer, ...farmers]);
    setAddDialogOpen(false);
    toast({ title: "Tagumpay!", description: "Matagumpay na naidagdag ang magsasaka." });
  };
  
  const handleEditFarmer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFarmer) return;

    const formData = new FormData(event.currentTarget);
    const updatedFarmer: Farmer = {
      ...editingFarmer,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      municipality: formData.get('municipality') as string,
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

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.crops.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Database ng Magsasaka</h1>
            <p className="text-muted-foreground">Tingnan, pamahalaan, at i-update ang mga profile ng lahat ng nakarehistrong magsasaka.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Upload /> Mag-import</Button>
            <Button variant="outline"><Download /> I-export</Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><PlusCircle /> Magdagdag ng Magsasaka</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Magrehistro ng Bagong Magsasaka</DialogTitle>
                  <DialogDescription>Manu-manong magdagdag ng bagong magsasaka sa sistema.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddFarmer}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Pangalan</Label>
                      <Input id="name" name="name" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">Telepono</Label>
                      <Input id="phone" name="phone" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="municipality" className="text-right">Munisipalidad</Label>
                      <Input id="municipality" name="municipality" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="barangay" className="text-right">Barangay</Label>
                      <Input id="barangay" name="barangay" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="sitio" className="text-right">Sitio/Purok</Label>
                      <Input id="sitio" name="sitio" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="crops" className="text-right">Mga Pananim</Label>
                      <Input id="crops" name="crops" placeholder="Palay, Mais" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="farm-size" className="text-right">Sukat (ha)</Label>
                      <Input id="farm-size" name="farm-size" type="number" step="0.1" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                    <Button type="submit">I-save ang Magsasaka</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
            <Button variant="outline">Salain</Button>
            <Button variant="outline">Pagbukud-bukurin</Button>
        </div>


        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Pangalan</TableHead>
                  <TableHead>Lokasyon</TableHead>
                  <TableHead>Mga Pananim</TableHead>
                  <TableHead>Huling Aktibidad</TableHead>
                  <TableHead className="text-right w-[240px]">Mga Aksyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image src={farmer.avatarUrl} alt={farmer.name} width={32} height={32} className="rounded-full object-cover" />
                        <Link href={`/dashboard/farmers/${farmer.id}`} className="hover:underline">{farmer.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell>{farmer.sitio}, {farmer.barangay}</TableCell>
                    <TableCell>{farmer.crops.join(', ')}</TableCell>
                    <TableCell>{new Date(farmer.lastSmsActivity).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingFarmer(farmer)}><Edit /></Button>
                        <Button variant="outline" size="sm" onClick={() => generateQr(farmer.id)}><QrCode /></Button>
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
                    <Label htmlFor="edit-municipality" className="text-right">Munisipalidad</Label>
                    <Input id="edit-municipality" name="municipality" defaultValue={editingFarmer.municipality} required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-barangay" className="text-right">Barangay</Label>
                    <Input id="edit-barangay" name="barangay" defaultValue={editingFarmer.barangay} required className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-sitio" className="text-right">Sitio/Purok</Label>
                    <Input id="edit-sitio" name="sitio" defaultValue={editingFarmer.sitio} required className="col-span-3" />
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
                  <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                  <Button type="submit">I-save ang Pagbabago</Button>
                </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
