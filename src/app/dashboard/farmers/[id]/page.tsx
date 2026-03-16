
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import type { Farmer, FarmerAssistanceRecord, FieldVisitTask, LogbookEntry, OutboundMessage, SmsMessage } from '@/lib/types';
import { getLogbookEntryIcon } from '@/lib/logbook';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilePen, PlusCircle, Camera, Mic, Edit, Archive, Upload, ArrowLeft, User, MessageSquare, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function TimelineItem({ entry }: { entry: LogbookEntry }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const Icon = entry.icon ?? getLogbookEntryIcon(entry.type);
  const { title, description, timestamp } = entry;
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

function formatConversationTimestamp(value: string, isClient: boolean) {
  if (!isClient) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}


export default function FarmerLogbookPage() {
    const params = useParams();
    const router = useRouter();
    const farmerId = params.id as string;
    
    const {
      farmers,
      updateFarmerRecord,
      logbook,
      smsMessages,
      outboundMessages,
      addLogbookEntry,
      assistanceRecords,
      addAssistanceRecord,
      updateAssistanceRecordStatus,
      fieldVisitTasks,
      scheduleFieldVisit,
      updateFieldVisitTaskStatus,
    } = useData();
    const farmer = farmers.find(f => f.id === farmerId);
    const farmerLogbook = logbook.filter((entry) => entry.farmerId === farmerId);
    const farmerAssistanceRecords = useMemo(
      () => assistanceRecords
        .filter((record) => record.farmerId === farmerId)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
      [assistanceRecords, farmerId]
    );
    const farmerFieldVisits = useMemo(
      () => fieldVisitTasks
        .filter((task) => task.farmerId === farmerId)
        .sort((left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()),
      [farmerId, fieldVisitTasks]
    );
    const farmerConversation = useMemo(
      () => smsMessages
        .filter((message) => message.farmerId === farmerId)
        .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()),
      [farmerId, smsMessages]
    );
    const outboundBySmsMessageId = useMemo(() => {
      const grouped = new Map<string, OutboundMessage[]>();

      outboundMessages.forEach((message) => {
        const existing = grouped.get(message.smsMessageId) ?? [];
        existing.push(message);
        grouped.set(message.smsMessageId, existing);
      });

      grouped.forEach((records, key) => {
        grouped.set(
          key,
          [...records].sort((left, right) => {
            const leftTime = new Date(left.sentAt ?? left.createdAt).getTime();
            const rightTime = new Date(right.sentAt ?? right.createdAt).getTime();
            return leftTime - rightTime;
          }),
        );
      });

      return grouped;
    }, [outboundMessages]);
    
    const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
    const [newNote, setNewNote] = useState('');
    const [isAssistanceDialogOpen, setIsAssistanceDialogOpen] = useState(false);
    const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
    const [assistanceForm, setAssistanceForm] = useState({
      type: 'Technical Advice' as FarmerAssistanceRecord['type'],
      title: '',
      details: '',
      quantity: '',
      nextAction: '',
    });
    const [visitForm, setVisitForm] = useState({
      title: '',
      purpose: '',
      scheduledFor: '',
      priority: 'medium' as FieldVisitTask['priority'],
      assignedTo: '',
    });
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
            updateFarmerRecord(farmer.id, { avatarUrl: newAvatarUrl });
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
        
        updateFarmerRecord(updatedFarmer.id, updatedFarmer);
        setEditingFarmer(null);
        toast({ title: "Tagumpay!", description: "Nai-update na ang datos ng magsasaka." });
    };

    const handleSaveNote = () => {
        if (!newNote.trim()) return;
        const noteEntry: Omit<LogbookEntry, 'id' | 'timestamp'> = {
            farmerId: farmer.id,
            type: 'Tala sa Bukid',
            title: 'Nagdagdag ng Tala ang AEW',
            description: newNote,
        };
        addLogbookEntry(noteEntry);
        setNewNote('');
        toast({ title: "Tagumpay!", description: "Nai-save na ang iyong tala." });
    };

    const getAssistanceBadgeVariant = (status: FarmerAssistanceRecord['status']) => {
        if (status === 'completed') return 'secondary' as const;
        if (status === 'in_progress') return 'default' as const;
        return 'outline' as const;
    };

    const getVisitBadgeVariant = (status: FieldVisitTask['status']) => {
        if (status === 'completed') return 'secondary' as const;
        if (status === 'in_progress') return 'default' as const;
        if (status === 'scheduled') return 'outline' as const;
        return 'destructive' as const;
    };

    const handleCreateAssistance = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!assistanceForm.title.trim() || !assistanceForm.details.trim()) {
            toast({ title: "Kulang ang detalye", description: "Lagyan ng pamagat at detalye ang assistance record.", variant: "destructive" });
            return;
        }

        addAssistanceRecord({
            farmerId: farmer.id,
            type: assistanceForm.type,
            title: assistanceForm.title.trim(),
            details: assistanceForm.details.trim(),
            quantity: assistanceForm.quantity.trim() || undefined,
            nextAction: assistanceForm.nextAction.trim() || undefined,
        });
        setAssistanceForm({
            type: 'Technical Advice',
            title: '',
            details: '',
            quantity: '',
            nextAction: '',
        });
        setIsAssistanceDialogOpen(false);
        toast({ title: "Naidagdag ang tulong", description: `May bagong assistance record na para kay ${farmer.name}.` });
    };

    const handleScheduleVisit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!visitForm.title.trim() || !visitForm.purpose.trim() || !visitForm.scheduledFor) {
            toast({ title: "Kulang ang detalye", description: "Punan ang title, purpose, at schedule ng field visit.", variant: "destructive" });
            return;
        }

        scheduleFieldVisit({
            farmerId: farmer.id,
            title: visitForm.title.trim(),
            purpose: visitForm.purpose.trim(),
            scheduledFor: new Date(visitForm.scheduledFor).toISOString(),
            priority: visitForm.priority,
            assignedTo: visitForm.assignedTo.trim() || undefined,
        });
        setVisitForm({
            title: '',
            purpose: '',
            scheduledFor: '',
            priority: 'medium',
            assignedTo: '',
        });
        setIsVisitDialogOpen(false);
        toast({ title: "Naiskedyul ang pagbisita", description: `Naidagdag ang field visit para kay ${farmer.name}.` });
    };

    const handleAdvanceAssistance = (record: FarmerAssistanceRecord) => {
        const nextStatus = record.status === 'planned' ? 'in_progress' : 'completed';
        updateAssistanceRecordStatus(record.id, nextStatus);
        toast({ title: "Na-update ang tulong", description: `${record.title} ay naka-${nextStatus}.` });
    };

    const handleAdvanceVisit = (task: FieldVisitTask) => {
        const nextStatus = task.status === 'scheduled' ? 'in_progress' : 'completed';
        updateFieldVisitTaskStatus(task.id, nextStatus);
        toast({ title: "Na-update ang field visit", description: `${task.title} ay naka-${nextStatus}.` });
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
                        <div className="flex flex-col gap-4 sm:flex-row">
                             <HoverTooltip text="Mag-upload ng larawan mula sa iyong pagbisita.">
                                <Button variant="outline" className="w-full sm:flex-1" onClick={() => fieldPhotoUploadRef.current?.click()}><Camera className="mr-2"/> Mag-upload ng Larawan</Button>
                            </HoverTooltip>
                             <HoverTooltip text="Mag-record ng audio note o panayam sa magsasaka.">
                                <Button variant="outline" className="w-full sm:flex-1" onClick={() => audioUploadRef.current?.click()}><Mic className="mr-2"/> Mag-record ng Audio</Button>
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
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Usapang SMS at Mga Tugon
                            </CardTitle>
                            <CardDescription>
                                Buong thread ng mga inquiry ni {farmer.name} at mga tugon ng system o barangay team.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit">
                            {farmerConversation.length} {farmerConversation.length === 1 ? 'inquiry' : 'inquiries'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {farmerConversation.length > 0 ? farmerConversation.map((message: SmsMessage) => {
                            const relatedReplies = outboundBySmsMessageId.get(message.id) ?? [];
                            const hasSentReply = relatedReplies.length > 0;

                            return (
                                <div key={message.id} className="rounded-[10px] border border-border bg-muted/20 p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border border-border">
                                            {farmer.avatarUrl ? <AvatarImage src={farmer.avatarUrl} alt={farmer.name} /> : null}
                                            <AvatarFallback>{farmer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 max-w-[88%] space-y-2">
                                            <div className="rounded-[18px] border border-border bg-background px-4 py-3 shadow-sm">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground">{farmer.name}</p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatConversationTimestamp(message.timestamp, isClient)}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-foreground">{message.message}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-1">
                                                <Badge variant="outline">{message.parsedIntent}</Badge>
                                                <Badge variant="outline">{message.urgency} priority</Badge>
                                                <Badge variant={message.safetyFlag === 'High' ? 'destructive' : 'outline'}>
                                                    {message.safetyFlag} risk
                                                </Badge>
                                                <Badge variant="outline">AI {(message.aiConfidence * 100).toFixed(0)}%</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {hasSentReply ? relatedReplies.map((reply) => (
                                            <div key={reply.id} className="flex justify-end">
                                                <div className="min-w-0 max-w-[88%] space-y-2">
                                                    <div className="rounded-[18px] bg-primary px-4 py-3 text-primary-foreground shadow-sm">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                                <Send className="h-4 w-4" />
                                                                Tugon ng Lingkod-Ani
                                                            </div>
                                                            <span className="text-xs text-primary-foreground/80">
                                                                {formatConversationTimestamp(reply.sentAt ?? reply.createdAt, isClient)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-6">{reply.body}</p>
                                                    </div>
                                                    <div className="flex flex-wrap justify-end gap-2 pr-1">
                                                        <Badge
                                                            variant={reply.status === 'failed' ? 'destructive' : 'secondary'}
                                                            className={cn(reply.status !== 'failed' && 'bg-primary/10 text-primary')}
                                                        >
                                                            {reply.status}
                                                        </Badge>
                                                        {reply.attempts ? <Badge variant="outline">{reply.attempts} attempts</Badge> : null}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex justify-end">
                                                <div className="min-w-0 max-w-[88%] space-y-2">
                                                    <div className="rounded-[18px] border border-primary/20 bg-primary/5 px-4 py-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold text-primary">Draft reply pa lang</p>
                                                            <span className="text-xs text-muted-foreground">
                                                                Hindi pa naipapadala
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-6 text-foreground">{message.aiAdvice}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="rounded-[10px] border border-dashed border-border bg-muted/10 p-6 text-center">
                                <p className="text-sm font-medium text-foreground">Wala pang SMS conversation thread para sa magsasakang ito.</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Kapag may papasok na inquiry at system reply, lilitaw dito ang buong usapan na parang phone conversation record.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Assistance Ledger</CardTitle>
                                <CardDescription>Mga ibinigay at kasalukuyang tulong para kay {farmer.name}.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsAssistanceDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Magdagdag
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {farmerAssistanceRecords.length > 0 ? farmerAssistanceRecords.map((record) => (
                                <div key={record.id} className="rounded-xl border p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{record.title}</p>
                                        <Badge variant="outline">{record.type}</Badge>
                                        <Badge variant={getAssistanceBadgeVariant(record.status)}>{record.status}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{record.details}</p>
                                    {record.quantity ? <p className="mt-1 text-sm text-muted-foreground">Dami: {record.quantity}</p> : null}
                                    {record.nextAction ? <p className="mt-1 text-sm text-muted-foreground">Next action: {record.nextAction}</p> : null}
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                        {record.status !== 'completed' ? (
                                            <Button size="sm" className="h-auto min-h-11 whitespace-normal break-words px-4 py-3 text-center leading-snug" onClick={() => handleAdvanceAssistance(record)}>
                                                {record.status === 'planned' ? 'Simulan' : 'Markahang tapos'}
                                            </Button>
                                        ) : null}
                                        <span className="text-xs text-muted-foreground">
                                            Updated: {isClient ? new Date(record.updatedAt).toLocaleString() : ''}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground">Wala pang assistance ledger entry para sa magsasakang ito.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Field Visits at Follow-up</CardTitle>
                                <CardDescription>Mga onsite visit at future check-in para kay {farmer.name}.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsVisitDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Schedule
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {farmerFieldVisits.length > 0 ? farmerFieldVisits.map((task) => (
                                <div key={task.id} className="rounded-xl border p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{task.title}</p>
                                        <Badge variant="outline">{task.priority} priority</Badge>
                                        <Badge variant={getVisitBadgeVariant(task.status)}>{task.status}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{task.purpose}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Assigned to: {task.assignedTo}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Schedule: {isClient ? new Date(task.scheduledFor).toLocaleString() : ''}
                                    </p>
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                        {task.status !== 'completed' && task.status !== 'cancelled' ? (
                                            <Button size="sm" className="h-auto min-h-11 whitespace-normal break-words px-4 py-3 text-center leading-snug" onClick={() => handleAdvanceVisit(task)}>
                                                {task.status === 'scheduled' ? 'Simulan' : 'Markahang tapos'}
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground">Wala pang nakaiskedyul na field visit para sa magsasakang ito.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Logbook ng Magsasaka</CardTitle>
                        <CardDescription>Isang kumpletong timeline ng lahat ng interaksyon at aktibidad para kay {farmer.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {farmerLogbook.map(entry => (
                            <TimelineItem key={entry.id} entry={entry} />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
        <Dialog open={isAssistanceDialogOpen} onOpenChange={setIsAssistanceDialogOpen}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Magdagdag ng Assistance Record</DialogTitle>
                    <DialogDescription>I-log ang tulong o intervention na ibibigay kay {farmer.name}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAssistance} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="assistance-type">Uri ng Tulong</Label>
                        <Select value={assistanceForm.type} onValueChange={(value) => setAssistanceForm(current => ({ ...current, type: value as FarmerAssistanceRecord['type'] }))}>
                            <SelectTrigger id="assistance-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Technical Advice">Technical Advice</SelectItem>
                                <SelectItem value="Voucher">Voucher</SelectItem>
                                <SelectItem value="Binhi">Binhi</SelectItem>
                                <SelectItem value="Pataba">Pataba</SelectItem>
                                <SelectItem value="Pesticide">Pesticide</SelectItem>
                                <SelectItem value="Kagamitan">Kagamitan</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Cash Relief">Cash Relief</SelectItem>
                                <SelectItem value="Field Visit">Field Visit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="assistance-title">Pamagat</Label>
                        <Input id="assistance-title" value={assistanceForm.title} onChange={(event) => setAssistanceForm(current => ({ ...current, title: event.target.value }))} placeholder="hal. Pesticide support para sa rice bugs" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="assistance-details">Detalye</Label>
                        <Textarea id="assistance-details" value={assistanceForm.details} onChange={(event) => setAssistanceForm(current => ({ ...current, details: event.target.value }))} placeholder="Ilagay ang intervention o support na ibibigay." />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="assistance-quantity">Dami o Saklaw</Label>
                            <Input id="assistance-quantity" value={assistanceForm.quantity} onChange={(event) => setAssistanceForm(current => ({ ...current, quantity: event.target.value }))} placeholder="hal. 2 bote o 1 voucher" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assistance-next">Next Action</Label>
                            <Input id="assistance-next" value={assistanceForm.nextAction} onChange={(event) => setAssistanceForm(current => ({ ...current, nextAction: event.target.value }))} placeholder="hal. Follow-up sa March 20" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                        <Button type="submit">I-save ang Tulong</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Mag-schedule ng Field Visit</DialogTitle>
                    <DialogDescription>Ilagay ang purpose at schedule ng pagbisita para kay {farmer.name}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleScheduleVisit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="visit-title">Title</Label>
                        <Input id="visit-title" value={visitForm.title} onChange={(event) => setVisitForm(current => ({ ...current, title: event.target.value }))} placeholder="hal. Follow-up sa tomato leafminer" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visit-purpose">Purpose</Label>
                        <Textarea id="visit-purpose" value={visitForm.purpose} onChange={(event) => setVisitForm(current => ({ ...current, purpose: event.target.value }))} placeholder="Ano ang gagawin o iche-check sa pagbisita?" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="visit-schedule">Schedule</Label>
                            <Input id="visit-schedule" type="datetime-local" value={visitForm.scheduledFor} onChange={(event) => setVisitForm(current => ({ ...current, scheduledFor: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="visit-priority">Priority</Label>
                            <Select value={visitForm.priority} onValueChange={(value) => setVisitForm(current => ({ ...current, priority: value as FieldVisitTask['priority'] }))}>
                                <SelectTrigger id="visit-priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visit-assigned">Assigned To</Label>
                        <Input id="visit-assigned" value={visitForm.assignedTo} onChange={(event) => setVisitForm(current => ({ ...current, assignedTo: event.target.value }))} placeholder="hal. AEW Jose Rizal" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                        <Button type="submit">I-save ang Visit</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
