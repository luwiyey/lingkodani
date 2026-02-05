
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { farmers as initialFarmers, farmerLogbookEntries as initialLogbook } from '@/lib/data';
import type { LogbookEntry, Farmer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePen, PlusCircle, Camera, Mic, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function TimelineItem({ entry }: { entry: LogbookEntry }) {
  const { icon: Icon, title, description, timestamp } = entry;
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">{title}</p>
          <time className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleString()}
          </time>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}


export default function FarmerLogbookPage() {
    const params = useParams();
    const farmerId = params.id as string;
    
    // In a real app, this would be a fetch call. Here we simulate it.
    const [farmer, setFarmer] = useState<Farmer | undefined>(initialFarmers.find(f => f.id === farmerId));
    const [logbook, setLogbook] = useState<LogbookEntry[]>(initialLogbook);
    const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
    const [newNote, setNewNote] = useState('');
    const { toast } = useToast();

    if (!farmer) {
        notFound();
    }
    
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
        
        setFarmer(updatedFarmer);
        setEditingFarmer(null);
        toast({ title: "Tagumpay!", description: "Nai-update na ang datos ng magsasaka." });
    };

    const handleSaveNote = () => {
        if (!newNote.trim()) return;
        const noteEntry: LogbookEntry = {
            id: `LOG${logbook.length + 1}`,
            timestamp: new Date().toISOString(),
            type: 'Tala sa Bukid',
            icon: FilePen,
            title: 'Nagdagdag ng Tala ang AEW',
            description: newNote,
        };
        setLogbook([noteEntry, ...logbook]);
        setNewNote('');
        toast({ title: "Tagumpay!", description: "Nai-save na ang iyong tala." });
    };

  return (
    <>
    <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Image src={farmer.avatarUrl} alt={farmer.name} width={64} height={64} className="rounded-full" />
                        <div>
                            <CardTitle className="text-2xl">{farmer.name}</CardTitle>
                            <CardDescription>ID: {farmer.id}</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setEditingFarmer(farmer)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <p><strong>Telepono:</strong> {farmer.phone}</p>
                    <p><strong>Lokasyon:</strong> {farmer.sitio}, {farmer.barangay}</p>
                    <p><strong>Sukat ng Bukid:</strong> {farmer.farmSize} ha</p>
                    <p><strong>Mga Pananim:</strong> {farmer.crops.join(', ')}</p>
                    <p><strong>Petsa ng Pagpaparehistro:</strong> {new Date(farmer.registrationDate).toLocaleDateString()}</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FilePen /> Magdagdag ng Tala sa Bukid</CardTitle>
                    <CardDescription>Mag-log ng mga obserbasyon, mag-upload ng mga larawan, o mag-record ng audio mula sa field.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Isulat ang iyong mga obserbasyon dito..." 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1"><Camera className="mr-2"/> Mag-upload ng Larawan</Button>
                        <Button variant="outline" className="flex-1"><Mic className="mr-2"/> Mag-record ng Audio</Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSaveNote}><PlusCircle className="mr-2"/> I-save ang Tala</Button>
                </CardFooter>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Logbook ng Magsasaka</CardTitle>
                    <CardDescription>Isang kumpletong timeline ng lahat ng interaksyon at aktibidad para kay {farmer.name}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {logbook.map(entry => (
                        <TimelineItem key={entry.id} entry={entry} />
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
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
