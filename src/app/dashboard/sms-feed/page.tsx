"use client";

import * as React from 'react';
import { User, Sparkles, MessageSquare, Send, Wrench, Sprout, FilePen, ShieldAlert, CloudCog, Tractor } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { smsMessages, resources } from '@/lib/data';
import type { SmsMessage, Resource, SmsIntent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DialogState = {
  type: 'approve' | 'manual' | 'find' | null;
  message: SmsMessage | null;
}

const typeInfo: Record<SmsIntent, {label: string, icon: React.ElementType, color: string }> = {
    REGISTER: { label: 'Pagpaparehistro', icon: User, color: 'bg-blue-500'},
    CROP_UPDATE: { label: 'Update sa Pananim', icon: FilePen, color: 'bg-teal-500' },
    HARVEST: { label: 'Ulat ng Ani', icon: Sprout, color: 'bg-green-500' },
    REQUEST: { label: 'Kahilingan', icon: Tractor, color: 'bg-orange-500' },
    PEST_DISEASE: { label: 'Ulat ng Peste', icon: ShieldAlert, color: 'bg-red-500' },
    WEATHER_HELP: { label: 'Tulong sa Panahon', icon: CloudCog, color: 'bg-sky-500'},
    PRICE_CHECK: { label: 'Tsek sa Presyo', icon: MessageSquare, color: 'bg-indigo-500'},
    EMERGENCY: { label: 'Emergency', icon: ShieldAlert, color: 'bg-destructive' },
    UNKNOWN: { label: 'Hindi Kilala', icon: MessageSquare, color: 'bg-gray-500'},
}

export default function SmsFeedPage() {
    const [selectedMessage, setSelectedMessage] = React.useState<SmsMessage>(smsMessages[0]);
    const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, message: null });
    const [editableResponse, setEditableResponse] = React.useState('');
    const { toast } = useToast();
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

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
    
    const TypeIcon = selectedMessage ? typeInfo[selectedMessage.parsedIntent].icon : MessageSquare;

  return (
    <>
      <div className="grid md:grid-cols-[400px_1fr] gap-6 h-full">
        {/* Messages List */}
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Live na Feed ng SMS</CardTitle>
                <CardDescription>Suriin, aprubahan, at tumugon sa mga papasok na SMS sa real-time.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-full">
                <div className="p-4 flex flex-col gap-4">
                    {smsMessages.map(message => (
                    <button 
                        key={message.id} 
                        className={cn(
                            "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                            selectedMessage.id === message.id && "bg-muted"
                        )}
                        onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{message.farmerName}</div>
                          </div>
                          <div className={cn( "ml-auto text-xs", selectedMessage.id === message.id ? "text-foreground" : "text-muted-foreground" )}>
                            {isClient ? new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'}) : null}
                          </div>
                        </div>
                      </div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {message.message}
                      </div>
                       <div className="flex items-center gap-2 mt-1">
                          <Badge variant={message.status === 'pending_approval' ? 'secondary' : 'outline'}>{message.status.replace('_', ' ')}</Badge>
                          <Badge variant={message.urgency === 'high' ? 'destructive' : 'outline'}>{message.urgency}</Badge>
                      </div>
                    </button>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
        </Card>

        {/* Message Details */}
        {selectedMessage && (
            <div className="bg-muted/40 dark:bg-muted/20 rounded-lg flex flex-col h-full">
                <div className="p-6 border-b">
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={`https://picsum.photos/seed/${selectedMessage.farmerId}/48/48`} alt={selectedMessage.farmerName} />
                                <AvatarFallback>{selectedMessage.farmerName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-bold text-lg">{selectedMessage.farmerName}</h2>
                                <p className="text-sm text-muted-foreground">{selectedMessage.phone}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-muted-foreground">{isClient ? new Date(selectedMessage.timestamp).toLocaleString() : ''}</p>
                        </div>
                    </div>
                    <p className="mt-6 text-md p-4 bg-background rounded-lg">"{selectedMessage.message}"</p>
                </div>
                
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" /> Pagsusuri ng AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-wrap gap-2 text-sm">
                                {typeInfo[selectedMessage.parsedIntent] && (
                                    <Badge variant="outline" className={cn("text-xs", typeInfo[selectedMessage.parsedIntent].color, "border-transparent text-white")}>
                                        <TypeIcon className="w-3 h-3 mr-1" />
                                        {typeInfo[selectedMessage.parsedIntent].label}
                                    </Badge>
                                )}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <Badge variant={selectedMessage.safetyFlag === 'High' ? 'destructive' : selectedMessage.safetyFlag === 'Medium' ? 'secondary' : 'outline'}>
                                            Panganib: {selectedMessage.safetyFlag}
                                        </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                        <p>Sinuri ng AI ang panganib sa mensahe.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline">Kumpiyansa: {(selectedMessage.aiConfidence * 100).toFixed(0)}%</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Kumpiyansa ng AI sa pag-unawa sa layunin.</p>
                                        </TooltipContent>
                                     </Tooltip>
                                </TooltipProvider>
                                {selectedMessage.tone && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <Badge variant="outline">Tono: {selectedMessage.tone}</Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                            <p>Ang emosyonal na tono na natukoy sa mensahe.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                     <Card className="bg-background">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" /> Iminungkahing Tugon ng AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{selectedMessage.aiAdvice}</p>
                        </CardContent>
                    </Card>

                </div>

                <div className="p-6 mt-auto border-t bg-muted/40 dark:bg-muted/20 rounded-b-lg">
                    <div className="flex flex-wrap gap-4 justify-end">
                        <Button onClick={() => openDialog('approve', selectedMessage)} size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Aprubahan ang Tugon
                        </Button>
                        <Button onClick={() => openDialog('manual', selectedMessage)} size="sm" variant="outline">
                        <Send className="mr-2 h-4 w-4" />
                        Manu-manong Tugon
                        </Button>
                        {selectedMessage.parsedIntent === 'REQUEST' && (
                        <Button onClick={() => openDialog('find', selectedMessage)} size="sm" variant="outline">
                            <Wrench className="mr-2 h-4 w-4" />
                            Maghanap ng Kagamitan
                        </Button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Dialog for Approving AI Response */}
      <Dialog open={dialogState.type === 'approve'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suriin at I-edit ang Tugon</DialogTitle>
            <DialogDescription>
              Maaari mong i-edit ang mensahe bago ipadala kay {dialogState.message?.farmerName}.
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            className="my-4"
            value={editableResponse}
            onChange={(e) => setEditableResponse(e.target.value)}
            rows={5} 
          />
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Kanselahin</Button>
            </DialogClose>
            <Button onClick={() => handleAction('na-edit at naipadala')}>I-save at Ipadala</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for Manual Response */}
      <Dialog open={dialogState.type === 'manual'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manu-manong Tumugon kay {dialogState.message?.farmerName}</DialogTitle>
            <DialogDescription>
              Isulat ang iyong mensahe sa ibaba.
            </DialogDescription>
          </DialogHeader>
          <Textarea className="my-4" placeholder="Simulan ang pagsusulat dito..." rows={5} />
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Kanselahin</Button>
            </DialogClose>
            <Button onClick={() => handleAction('naipadala')}>Ipadala ang Mensahe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Finding Equipment */}
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
                        <Button size="sm" onClick={() => handleAction(`inirekomenda ang ${tool.name}`)}>Mag-alok</Button>
                    </div>
                ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
