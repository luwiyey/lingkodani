"use client";

import * as React from 'react';
import { User, Sparkles, MessageSquare, Send, Wrench } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { smsMessages, resources } from '@/lib/data';
import type { SmsMessage, Resource } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

type DialogState = {
  type: 'approve' | 'manual' | 'find' | null;
  message: SmsMessage | null;
}

export default function SmsFeedPage() {
    const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, message: null });
    const { toast } = useToast();

    const openDialog = (type: DialogState['type'], message: SmsMessage) => {
        setDialogState({ type, message });
    };

    const closeDialog = () => {
        setDialogState({ type: null, message: null });
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
      <div className="space-y-1 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Live na Feed ng SMS</h1>
        <p className="text-muted-foreground">Suriin, aprubahan, at tumugon sa mga papasok na SMS sa real-time.</p>
      </div>
      <div className="space-y-4">
        {smsMessages.map(message => (
          <Card key={message.id} className="bg-card/80">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{message.farmerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{message.farmerName}</p>
                  <p className="text-sm text-muted-foreground">"{message.message}"</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">{new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
            </CardHeader>
            <CardContent>
              <Separator className="my-3 bg-white/10" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Pagsusuri ng AI</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Layunin: {message.parsedIntent.replace('_', ' ')}</Badge>
                  <Badge variant={message.safetyFlag === 'High' ? 'destructive' : message.safetyFlag === 'Medium' ? 'secondary' : 'outline'}>
                    Panganib: {message.safetyFlag}
                  </Badge>
                  <Badge variant="outline">Kumpiyansa: {(message.aiConfidence * 100).toFixed(0)}%</Badge>
                  <Badge variant="outline">Tono: {message.tone}</Badge>
                </div>
              </div>
              <Separator className="my-3 bg-white/10" />
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => openDialog('approve', message)} size="sm" className="bg-white/10 hover:bg-white/20 text-foreground">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Aprubahan ang Tugon ng AI
                </Button>
                <Button onClick={() => openDialog('manual', message)} size="sm" className="bg-white/10 hover:bg-white/20 text-foreground">
                  <Send className="mr-2 h-4 w-4" />
                  Manu-manong Tugon
                </Button>
                {message.parsedIntent === 'REQUEST' && (
                  <Button onClick={() => openDialog('find', message)} size="sm" className="bg-white/10 hover:bg-white/20 text-foreground">
                    <Wrench className="mr-2 h-4 w-4" />
                    Maghanap ng Kagamitan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for Approving AI Response */}
      <Dialog open={dialogState.type === 'approve'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprubahan at Ipadala ang Tugon ng AI?</DialogTitle>
            <DialogDescription>
              Ang mensaheng ito ay ipapadala kay {dialogState.message?.farmerName}.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-4 bg-muted rounded-lg text-sm">
            <p>{dialogState.message?.aiAdvice}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Kanselahin</Button>
            </DialogClose>
            <Button onClick={() => handleAction('naaprubahan')}>Kumpirmahin at Ipadala</Button>
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
