
'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import type { LogbookEntry, Farmer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePen, PlusCircle, Camera, Mic, Edit, Archive, Upload, ArrowLeft, User } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function TimelineItem({ entry }: { entry: LogbookEntry }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
            {isClient ? new Date(timestamp).toLocaleString() : ''}
          </time>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}


export default function FarmerLogbookPage() {
    const params = useParams();
    const router = useRouter();
    const farmerId = params.id as string;
    
    const { farmers, setFarmers, logbook, setLogbook } = useData();
    const farmer = farmers.find(f => f.id === farmerId);
    
    const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
    const [newNote, setNewNote] = useState('');
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const avatarUploadRef = useRef<HTMLInputElement>(null);
    const docUploadRef = useRef<HTMLInputElement>(null);
    const fieldPhotoUploadRef = useRef<HTMLInputElement>(null);
    const audioUploadRef = useRef<HTMLInputElement>(null);

    if (!farmer) {
        notFound();
    }
    
    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onloadend = () => {
            const newAvatarUrl = reader.result as string;
            setFarmers(prev => prev.map(f => f.id === farmer.id ? { ...f, avatarUrl: newAvatarUrl } : f));
            toast({
                title: "Nai-upload na ang Larawan!",
                description: `Ang profile picture para kay ${farmer.name} ay na-update na.`,
            });
        };
        
        reader.readAsDataURL(file);
        
        if (e.target) {
            e.target.value = '';
        }
    };


     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
        if (e.target.files && e.target.files[0]) {
            toast({
                title: `${fileType} Nai-upload!`,
                description: `Ang file na "${e.target.files[0].name}" ay matagumpay na na-upload.`,
            });
        }
        // Reset file input
        if (e.target) {
            e.target.value = '';
        }
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
            age: Number(formData.get('age') as string),
            gender: formData.get('gender') as string,
        };
        
        setFarmers(current => current.map(f => f.id === updatedFarmer.id ? updatedFarmer : f));
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
    <div className="flex flex-col gap-6">
        <Input type="file" ref={avatarUploadRef} className="hidden" onChange={handleAvatarSelect} accept="image/*"/>
        <Input type="file" ref={docUploadRef} className="hidden" onChange={(e) => handleFileSelect(e, 'Dokumento')} />
        <Input type="file" ref={fieldPhotoUploadRef} className="hidden" onChange={(e) => handleFileSelect(e, 'Larawan sa Bukid')} accept="image/*"/>
        <Input type="file" ref={audioUploadRef} className="hidden" onChange={(e) => handleFileSelect(e, 'Audio')} accept="audio/*"/>

        <div className="flex items-center gap-4">
            <HoverTooltip text="Bumalik sa listahan ng mga magsasaka.">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft />
                </Button>
            </HoverTooltip>
            <div className="space-y-1">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold tracking-tight">Profile ng Magsasaka</h1>
                    <HelpDialog title="Profile ng Magsasaka" tooltipText="Tingnan ang kumpletong profile at kasaysayan ng magsasaka.">
                        <p>Ito ang detalyadong view para sa isang partikular na magsasaka. Dito mo makikita ang lahat ng impormasyong may kaugnayan sa kanila sa isang lugar.</p>
                        <p><strong>Profile Card:</strong> Naglalaman ito ng lahat ng personal at impormasyon sa bukid ng magsasaka. Maaari mong i-edit ang impormasyon sa pamamagitan ng pag-click sa "Edit" (lapis) na button.</p>
                        <p><strong>Logbook:</strong> Ito ang pinakamahalagang bahagi. Ito ay isang kumpletong timeline ng lahat ng interaksyon sa magsasaka, kabilang ang kanilang mga SMS, payo ng AI, mga tala mula sa field, at iba pang mahahalagang kaganapan. Nakakatulong ito para maunawaan ang buong kasaysayan ng isang magsasaka.</p>
                        <p><strong>Magdagdag ng Tala:</strong> Para sa mga Agricultural Extension Workers (AEWs), ito ay isang mahalagang tool para mag-log ng mga obserbasyon, mag-upload ng mga larawan, o mag-record ng audio mula sa isang pagbisita sa bukid.</p>
                    </HelpDialog>
                </div>
                <p className="text-muted-foreground">Tingnan ang kumpletong profile at kasaysayan ni {farmer?.name}.</p>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-center pt-4 gap-4">
                            <HoverTooltip text="Mag-click para mag-upload ng bagong larawan">
                                <button onClick={() => avatarUploadRef.current?.click()} className="relative group">
                                    <Avatar className="h-24 w-24 border">
                                        {farmer.avatarUrl ? <AvatarImage src={farmer.avatarUrl} alt={farmer.name} /> : null}
                                        <AvatarFallback className="bg-muted">
                                            <User className="h-12 w-12 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload className="h-8 w-8 text-white" />
                                    </div>
                                </button>
                            </HoverTooltip>
                            <div className="text-center">
                                <CardTitle className="text-2xl">{farmer.name}</CardTitle>
                                <CardDescription>ID: {farmer.id}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                         <div className="flex justify-end border-b pb-4 -mt-6">
                            <HoverTooltip text="I-edit ang mga detalye ng profile">
                                <Button variant="outline" size="sm" onClick={() => setEditingFarmer(farmer)}>
                                    <Edit className="mr-2 h-4 w-4" /> I-edit ang Profile
                                </Button>
                            </HoverTooltip>
                        </div>
                        <p><strong>Telepono:</strong> {farmer.phone}</p>
                        <p><strong>Edad:</strong> {farmer.age}</p>
                        <p><strong>Kasarian:</strong> {farmer.gender}</p>
                        <p><strong>Lokasyon:</strong> {farmer.sitio}, {farmer.barangay}</p>
                        <p><strong>Sukat ng Bukid:</strong> {farmer.farmSize} ha</p>
                        <p><strong>Mga Pananim:</strong> {farmer.crops.join(', ')}</p>
                        <p><strong>Petsa ng Pagpaparehistro:</strong> {isClient ? new Date(farmer.registrationDate).toLocaleDateString() : ''}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Archive /> Vault ng Dokumento</CardTitle>
                        <CardDescription>Mga mahalagang dokumento tulad ng mga sertipiko.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                            <p>Wala pang na-upload na dokumento.</p>
                        </div>
                        <HoverTooltip text="Mag-upload ng isang file mula sa iyong computer.">
                          <Button variant="outline" className="w-full mt-4" onClick={() => docUploadRef.current?.click()}><Upload className="mr-2"/> Mag-upload</Button>
                        </HoverTooltip>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FilePen /> Magdagdag ng Tala sa Bukid</CardTitle>
                        <CardDescription>Mag-log ng mga obserbasyon, mag-upload ng mga larawan, o mag-record ng audio mula sa field.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <HoverTooltip text="Isulat dito ang iyong mga napansin, rekomendasyon, o anumang mahalagang impormasyon mula sa iyong pagbisita sa bukid.">
                            <Textarea 
                                placeholder="Isulat ang iyong mga obserbasyon dito..." 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                        </HoverTooltip>
                        <div className="flex gap-4">
                             <HoverTooltip text="Mag-upload ng larawan mula sa iyong pagbisita.">
                                <Button variant="outline" className="flex-1" onClick={() => fieldPhotoUploadRef.current?.click()}><Camera className="mr-2"/> Mag-upload ng Larawan</Button>
                            </HoverTooltip>
                             <HoverTooltip text="Mag-record ng audio note o panayam sa magsasaka.">
                                <Button variant="outline" className="flex-1" onClick={() => audioUploadRef.current?.click()}><Mic className="mr-2"/> Mag-record ng Audio</Button>
                            </HoverTooltip>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <HoverTooltip text="I-save ang iyong isinulat na tala sa logbook ng magsasaka.">
                            <Button className="w-full" onClick={handleSaveNote}><PlusCircle className="mr-2"/> I-save ang Tala</Button>
                        </HoverTooltip>
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-2">
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
                        <Label htmlFor="edit-age" className="text-right">Edad</Label>
                        <Input id="edit-age" name="age" type="number" defaultValue={editingFarmer.age} className="col-span-3" />
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-gender" className="text-right">Kasarian</Label>
                        <Select name="gender" defaultValue={editingFarmer.gender}>
                          <SelectTrigger id="edit-gender" className="col-span-3">
                              <SelectValue placeholder="Pumili ng kasarian" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Babae">Babae</SelectItem>
                              <SelectItem value="Lalaki">Lalaki</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Button type="submit">I-save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
            </Dialog>
          )}
    </div>
  );
}
