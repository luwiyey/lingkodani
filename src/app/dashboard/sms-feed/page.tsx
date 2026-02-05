"use client";

import * as React from 'react';
import Link from 'next/link';
import { Check, Edit, Info, Send, ThumbsDown, User, X, MessageCircle, FilePen, Tractor, CloudCog, ShieldAlert, BadgeInfo, AlertTriangle, ArrowUpCircle, Bot, Sprout } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { smsMessages } from '@/lib/data';
import type { SmsMessage, SmsIntent } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const urgencyVariant = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

const statusColors = {
    pending_approval: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    replied: 'bg-blue-500',
}

const typeInfo: Record<SmsIntent, {label: string, icon: React.ElementType, color: string}> = {
    REGISTER: { label: 'Pagpaparehistro', icon: User, color: 'bg-blue-500'},
    CROP_UPDATE: { label: 'Update sa Pananim', icon: FilePen, color: 'bg-teal-500' },
    HARVEST: { label: 'Ulat ng Ani', icon: Sprout, color: 'bg-green-500' },
    REQUEST: { label: 'Kahilingan', icon: Tractor, color: 'bg-orange-500' },
    PEST_DISEASE: { label: 'Ulat ng Peste', icon: ShieldAlert, color: 'bg-red-500' },
    WEATHER_HELP: { label: 'Tulong sa Panahon', icon: CloudCog, color: 'bg-sky-500'},
    PRICE_CHECK: { label: 'Suriin ang Presyo', icon: BadgeInfo, color: 'bg-indigo-500'},
    EMERGENCY: { label: 'Emergency', icon: AlertTriangle, color: 'bg-rose-600'},
    UNKNOWN: { label: 'Pangkalahatan', icon: MessageCircle, color: 'bg-gray-500' },
}

export default function SmsFeedPage() {
    const [selectedMessage, setSelectedMessage] = React.useState<SmsMessage | null>(smsMessages[0]);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedAdvice, setEditedAdvice] = React.useState("");

    React.useEffect(() => {
        if (selectedMessage) {
            setEditedAdvice(selectedMessage.aiAdvice);
            setIsEditing(false);
        }
    }, [selectedMessage]);

    if (!selectedMessage) {
        return <div className="flex items-center justify-center h-full"><p>Mangyaring pumili ng mensahe.</p></div>
    }

    const SelectedMessageIcon = typeInfo[selectedMessage.parsedIntent]?.icon;

  return (
    <div className="h-[calc(100vh-5rem)] grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card className="md:col-span-1 lg:col-span-1 h-full overflow-y-auto">
        <CardHeader>
          <CardTitle>SMS Command Monitor</CardTitle>
          <CardDescription>Suriin, aprubahan, at tumugon sa mga papasok na SMS.</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
            <div className="flex flex-col gap-2">
            {smsMessages.map(message => {
                const TypeIcon = typeInfo[message.parsedIntent]?.icon || MessageCircle;
                return (
                    <button
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            selectedMessage?.id === message.id ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <p className="font-semibold">{message.farmerName}</p>
                            <Badge variant={urgencyVariant[message.urgency]}>{message.urgency}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <TypeIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground truncate">{message.message}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            <TooltipProvider><Tooltip><TooltipTrigger>
                                <div className={cn("w-2 h-2 rounded-full", statusColors[message.status])}></div>
                            </TooltipTrigger><TooltipContent><p>{message.status.replace('_', ' ')}</p></TooltipContent></Tooltip></TooltipProvider>
                        </div>
                    </button>
                )
            })}
            </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2 lg:col-span-3 h-full overflow-y-auto">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">Proseso ng Pagpapatunay ng Payo</CardTitle>
                    <CardDescription>Suriin ang SMS, payo ng AI, at gumawa ng aksyon.</CardDescription>
                </div>
                <Badge variant={selectedMessage.status === 'pending_approval' ? 'default' : selectedMessage.status === 'approved' ? 'secondary' : 'destructive'}>
                    Katayuan: {selectedMessage.status.replace('_', ' ')}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4"/>
                        <h3 className="font-semibold">Ulat mula kay {selectedMessage.farmerName}</h3>
                    </div>
                     {SelectedMessageIcon && (
                    <Badge variant="outline" className={cn("text-xs border-transparent text-white", typeInfo[selectedMessage.parsedIntent].color)}>
                        <SelectedMessageIcon className="w-3 h-3 mr-1" />
                        {typeInfo[selectedMessage.parsedIntent].label}
                    </Badge>
                    )}
                </div>
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-muted-foreground">{selectedMessage.message}</p>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2"><Bot className="w-4 h-4"/> Payo na Binuo ng AI</h3>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <Info className="w-4 h-4" />
                                    <span className="ml-2">Bakit ito iminungkahi?</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Paliwanag ng AI: Nakita ang keyword na 'leafminer' at 'kamatis'.<br/> Ang mungkahi ay batay sa KB012.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span>Marka ng Kumpiyansa:</span>
                        <div className="flex items-center gap-2">
                            <Progress value={selectedMessage.aiConfidence * 100} className="w-full h-3" />
                            <span className="font-bold text-primary">{ (selectedMessage.aiConfidence * 100).toFixed(1) }%</span>
                        </div>
                    </div>
                     <div>
                        <span>Bandila ng Kaligtasan:</span>
                         <Badge variant={selectedMessage.safetyFlag === 'High' ? 'destructive' : selectedMessage.safetyFlag === 'Medium' ? 'secondary' : 'outline'}>
                            {selectedMessage.safetyFlag} Panganib
                        </Badge>
                    </div>
                </div>

                {selectedMessage.knowledgeBaseId && (
                     <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Sumasangguni sa Artikulo sa Knowledge Base: <Link href={`/dashboard/knowledge-base#${selectedMessage.knowledgeBaseId}`} className="text-primary underline">{selectedMessage.knowledgeBaseId}</Link>
                    </p>
                )}
                <div className="p-4 bg-primary/5 rounded-lg">
                   {isEditing ? (
                        <Textarea 
                            value={editedAdvice}
                            onChange={(e) => setEditedAdvice(e.target.value)}
                            className="min-h-[120px]"
                        />
                   ) : (
                    <p className="text-primary-foreground/80">{selectedMessage.aiAdvice}</p>
                   )}
                </div>
            </div>

            <Separator />

            <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                        <>
                        <Button onClick={() => setIsEditing(false)} variant="outline"><X className="mr-2"/>Kanselahin</Button>
                        <Button><Check className="mr-2"/>I-save at Aprubahan</Button>
                        </>
                    ) : (
                        <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Send className="mr-2" />Aprubahan at Ipadala
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ipadala ang payo sa magsasaka kung ano ito.</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2" />I-edit bago Ipadala
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Baguhin ang payo bago ipadala.</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive">
                                    <ThumbsDown className="mr-2" />Tanggihan
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Tanggihan ang payo at i-flag para sa manu-manong pagsusuri.</p></TooltipContent>
                        </Tooltip>
                        </>
                    )}
                </div>
            </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
