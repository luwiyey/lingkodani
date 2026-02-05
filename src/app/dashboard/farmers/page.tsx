
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode.react';

import { farmers } from '@/lib/data';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, MessageSquarePlus, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FarmersPage() {
  const [qrCodeValue, setQrCodeValue] = React.useState<string | null>(null);

  const generateQr = (farmerId: string) => {
    // In a real app, this would be a URL to the farmer's logbook
    const url = `${window.location.origin}/dashboard/farmers/${farmerId}`;
    setQrCodeValue(url);
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng Magsasaka</h1>
          <p className="text-muted-foreground">Tingnan, pamahalaan, at i-update ang mga profile ng lahat ng nakarehistrong magsasaka.</p>
        </div>
        <div className="flex gap-4">
            <Button variant="outline">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Magpadala ng Broadcast
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Magdagdag ng Magsasaka
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Magrehistro ng Bagong Magsasaka</DialogTitle>
                    <DialogDescription>
                        Manu-manong magdagdag ng bagong magsasaka sa sistema. I-click ang i-save kapag tapos na.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Pangalan</Label>
                            <Input id="name" defaultValue="Pedro Penduko" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Telepono</Label>
                            <Input id="phone" defaultValue="+639123456789" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="municipality" className="text-right">Munisipalidad</Label>
                            <Input id="municipality" defaultValue="Bulacan" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Barangay</Label>
                            <Input id="location" defaultValue="San Roque" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sitio" className="text-right">Sitio/Purok</Label>
                            <Input id="sitio" defaultValue="Purok 3" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="crops" className="text-right">Mga Pananim</Label>
                            <Input id="crops" defaultValue="Palay, Mais" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="farm-size" className="text-right">Sukat (ha)</Label>
                            <Input id="farm-size" type="number" defaultValue="1.5" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">I-save ang Pagbabago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
            type="search"
            placeholder="Maghanap ng magsasaka ayon sa pangalan, lokasyon, o pananim..."
            className="w-full rounded-lg bg-background pl-8 md:w-full"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Pangalan</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead>Mga Pananim</TableHead>
                <TableHead>Huling Aktibidad (SMS)</TableHead>
                <TableHead className="text-right">Mga Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmers.map((farmer) => (
                <TableRow key={farmer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Image
                            src={farmer.avatarUrl}
                            alt={farmer.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                        />
                         <Link href={`/dashboard/farmers/${farmer.id}`} className="hover:underline">
                            {farmer.name}
                        </Link>
                    </div>
                  </TableCell>
                  <TableCell>{farmer.sitio}, {farmer.barangay}</TableCell>
                  <TableCell>
                    {farmer.crops.join(', ')}
                  </TableCell>
                  <TableCell>{new Date(farmer.lastSmsActivity).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => generateQr(farmer.id)}>
                        <QrCode className="mr-2 h-4 w-4"/>
                        ID Card
                    </Button>
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
            <DialogDescription>
              I-scan ang QR code na ito sa field para buksan ang logbook ng magsasaka.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-white rounded-lg">
            <QRCode value={qrCodeValue} size={256} />
          </div>
          <DialogFooter className="sm:justify-start">
             <Button type="button" variant="secondary" onClick={() => setQrCodeValue(null)}>
              Isara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
