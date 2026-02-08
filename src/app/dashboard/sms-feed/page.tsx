
"use client";

import * as React from 'react';
import { User, Sparkles, MessageSquare, Send, Wrench, Sprout, FilePen, ShieldAlert, CloudCog, Tractor } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { smsMessages, resources } from '@/lib/data';
import type { SmsMessage, Resource, SmsIntent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';

type DialogState = {
  type: 'approve' | 'manual' | 'find' | null;
  message: SmsMessage | null;
}

const typeInfo: Record<SmsIntent, {label: string, icon: React.ElementType }> = {
    REGISTER: { label: 'Pagpaparehistro', icon: User },
    CROP_UPDATE: { label: 'Update sa Pananim', icon: FilePen },
    HARVEST: { label: 'Ulat ng Ani', icon: Sprout },
    REQUEST: { label: 'Tool Request', icon: Tractor },
    PEST_DISEASE: { label: 'Ulat ng Peste', icon: ShieldAlert },
    WEATHER_HELP: { label: 'Tulong sa Panahon', icon: CloudCog },
    PRICE_CHECK: { label: 'Tsek sa Presyo', icon: MessageSquare },
    EMERGENCY: { label: 'Emergency', icon: ShieldAlert },
    UNKNOWN: { label: 'Hindi Kilala', icon: MessageSquare },
}

function SmsMessageCard({ message, onActionClick }: { message: SmsMessage, onActionClick: (type: DialogState['type'], message: SmsMessage) => void }) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);

    const intentLabel = typeInfo[message.parsedIntent]?.label || 'Hindi Kilala';
    const IntentIcon = typeInfo[message.parsedIntent]?.icon || MessageSquare;

    return (
        <Card className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-sidebar-border">
            <CardContent className="p-4 space-y-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 border-2 border-background/50 flex-shrink-0">
                             <AvatarImage src={`https://picsum.photos/seed/${message.farmerId}/40/40`} alt={message.farmerName} />
                             <AvatarFallback>{message.farmerName.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <div className="min-w-0">
                            <span className="font-semibold truncate block">{message.farmerName}</span>
                            <p className="text-xs text-sidebar-foreground/70">{message.phone}</p>
                         </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <time className="text-xs text-sidebar-foreground/70 block">
                            {isClient ? new Date(message.timestamp).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                            }) : ''}
                        </time>
                        <time className="text-xs text-sidebar-foreground/70 block">
                            {isClient ? new Date(message.timestamp).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                            }) : ''}
                        </time>
                    </div>
                </div>

                <p className="text-sm flex-grow">"{message.message}"</p>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Pagsusuri ng AI</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                         <Badge variant="outline" className="text-sidebar-foreground border-sidebar-accent bg-sidebar-accent/50">
                            <IntentIcon className="w-3 h-3 mr-1.5"/>
                            {intentLabel}
                        </Badge>
                        <Badge variant={message.safetyFlag === 'High' ? 'destructive' : 'outline'} className="text-sidebar-foreground border-sidebar-accent bg-sidebar-accent/50">{message.safetyFlag} Risk</Badge>
                        <Badge variant="outline" className="text-sidebar-foreground border-sidebar-accent bg-sidebar-accent/50">Conf: {(message.aiConfidence * 100).toFixed(0)}%</Badge>
                        {message.tone && <Badge variant="outline" className="text-sidebar-foreground border-sidebar-accent bg-sidebar-accent/50">Tono: {message.tone}</Badge>}
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <HoverTooltip text="Suriin at i-edit ang tugon ng AI bago ipadala.">
                            <Button variant="outline" size="sm" onClick={() => onActionClick('approve', message)} className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Aprubahan
                            </Button>
                        </HoverTooltip>
                        <HoverTooltip text="Sumulat ng sarili mong tugon mula sa simula.">
                            <Button variant="outline" size="sm" onClick={() => onActionClick('manual', message)} className="bg-sidebar-accent hover:bg-sidebar-accent/80">
                                <Send className="mr-2 h-4 w-4" />
                                Manwal
                            </Button>
                        </HoverTooltip>
                    </div>
                    {message.parsedIntent === 'REQUEST' && (
                        <HoverTooltip text="Tingnan kung may magagamit na kagamitan sa imbentaryo.">
                            <Button variant="outline" size="sm" onClick={() => onActionClick('find', message)} className="bg-sidebar-accent hover:bg-sidebar-accent/80 w-full">
                                <Wrench className="mr-2 h-4 w-4" />
                                Maghanap ng Kagamitan
                            </Button>
                        </HoverTooltip>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SmsFeedPage() {
    const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, message: null });
    const [editableResponse, setEditableResponse] = React.useState('');
    const { toast } = useToast();
    
    const openDialog = (type: DialogState['type'], message: SmsMessage) => {
        setDialogState({ type, message });
        if (type === 'approve' && message.aiAdvice) {
            setEditableResponse(message.aiAdvice);
        }
    };

    const closeDialog = () => {
        setDialogState({ type: null, message: null });
        setEditableResponse('');
    };
    
    const handleAction = (action: string) => {
        toast({
            title: "Aksyon naisagawa!",
            description: `Ang mensahe ay matagumpay na ${action}.`,
        });
        closeDialog();
    }
    
  return (
    <>
      <div className="mb-6 space-y-1">
          <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-tight">Live na Feed ng SMS</h1>
              <HelpDialog title="Live na Feed ng SMS" tooltipText="Suriin at tumugon sa mga papasok na SMS.">
                <p>Ito ang iyong real-time na inbox para sa lahat ng mensahe mula sa mga magsasaka. Bawat card ay kumakatawan sa isang papasok na SMS na kailangan ng iyong atensyon.</p>
                <p><strong>Daloy ng Trabaho:</strong> Ang isang bagong SMS ay papasok at agad na susuriin ng AI. Ang AI ay magbibigay ng paunang pagsusuri sa layunin (intent), tono, at panganib ng mensahe, at magmumungkahi ng isang tugon. Ang iyong gawain ay suriin ang mungkahi ng AI at aprubahan o i-edit ito.</p>
                <p><strong>Mga Aksyon sa Card:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Aprubahan:</strong> Nagbubukas ito ng isang pop-up kung saan maaari mong suriin at i-edit ang tugon ng AI bago ito ipadala sa magsasaka. Ito ang pinakakaraniwang aksyon.</li>
                    <li><strong>Manwal:</strong> Kung ang mungkahi ng AI ay hindi angkop, pinapayagan ka nitong magsulat ng iyong sariling tugon mula sa simula.</li>
                    <li><strong>Maghanap ng Kagamitan:</strong> Isang shortcut na lilitaw lamang para sa mga mensahe na may layuning "REQUEST". Mabilis nitong hinahanap ang imbentaryo para sa mga magagamit na kagamitan.</li>
                </ul>
              </HelpDialog>
          </div>
          <p className="text-muted-foreground">Suriin, aprubahan, at tumugon sa mga papasok na SMS sa real-time.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {smsMessages.map(message => (
              <SmsMessageCard key={message.id} message={message} onActionClick={openDialog} />
          ))}
      </div>

      <Dialog open={dialogState.type === 'approve'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suriin at I-edit ang Tugon</DialogTitle>
            <DialogDescription>
              Maaari mong i-edit ang mensahe bago ipadala kay {dialogState.message?.farmerName}.
            </DialogDescription>
          </DialogHeader>
          <HoverTooltip text="I-edit dito ang iminungkahing tugon ng AI.">
            <Textarea 
                className="my-4"
                value={editableResponse}
                onChange={(e) => setEditableResponse(e.target.value)}
                rows={5} 
            />
          </HoverTooltip>
          <DialogFooter>
            <HoverTooltip text="Isara at huwag ipadala ang tugon.">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Kanselahin</Button>
                </DialogClose>
            </HoverTooltip>
            <HoverTooltip text="I-save ang iyong mga pag-edit at ipadala ang tugon sa magsasaka.">
                <Button onClick={() => handleAction('na-edit at naipadala')}>I-save at Ipadala</Button>
            </HoverTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogState.type === 'manual'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manu-manong Tumugon kay {dialogState.message?.farmerName}</DialogTitle>
            <DialogDescription>
              Isulat ang iyong mensahe sa ibaba.
            </DialogDescription>
          </DialogHeader>
          <HoverTooltip text="Isulat dito ang iyong custom na tugon.">
            <Textarea className="my-4" placeholder="Simulan ang pagsusulat dito..." rows={5} />
          </HoverTooltip>
          <DialogFooter>
             <HoverTooltip text="Isara at huwag magpadala ng mensahe.">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Kanselahin</Button>
                </DialogClose>
            </HoverTooltip>
             <HoverTooltip text="Ipadala ang iyong isinulat na mensahe sa magsasaka.">
                <Button onClick={() => handleAction('naipadala')}>Ipadala ang Mensahe</Button>
            </HoverTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'find'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Maghanap ng Kagamitan sa Imbentaryo</DialogTitle>
            <DialogDescription>
              Narito ang mga kasalukuyang magagamit na kagamitan sa barangay.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="my-4 h-64">
            <div className="space-y-2 pr-4">
                {resources.filter(r => r.category === 'Kagamitan').map((tool: Resource) => (
                    <div key={tool.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{tool.name}</p>
                            <p className="text-sm text-muted-foreground">{tool.stock} yunit ang magagamit</p>
                        </div>
                        <HoverTooltip text={`Ipadala ang isang SMS na nag-aalok ng ${tool.name} sa magsasaka.`}>
                            <Button size="sm" onClick={() => handleAction(`inirekomenda ang ${tool.name}`)}>Mag-alok</Button>
                        </HoverTooltip>
                    </div>
                ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <HoverTooltip text="Isara ang window na ito.">
                <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
                </DialogClose>
            </HoverTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
