
"use client";

import * as React from 'react';
import { Check, Edit, Info, Send, ThumbsDown, User, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { smsMessages } from '@/lib/data';
import type { SmsMessage } from '@/lib/types';
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
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    edited: 'bg-blue-500',
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
        return <div>Loading...</div>
    }

  return (
    <div className="h-[calc(100vh-5rem)] grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card className="md:col-span-1 lg:col-span-1 h-full overflow-y-auto">
        <CardHeader>
          <CardTitle>Incoming SMS</CardTitle>
          <CardDescription>Select a message to validate.</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
            <div className="flex flex-col gap-2">
            {smsMessages.map(message => (
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
                    <p className="text-sm text-muted-foreground truncate mt-1">{message.message}</p>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleString()}</span>
                        <div className={`w-2 h-2 rounded-full ${statusColors[message.status]}`}></div>
                    </div>
                </button>
            ))}
            </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2 lg:col-span-3 h-full overflow-y-auto">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">AI Validation Workflow</CardTitle>
                    <CardDescription>Review and take action on AI-generated advice.</CardDescription>
                </div>
                <Badge variant={selectedMessage.status === 'pending' ? 'default' : selectedMessage.status === 'approved' ? 'secondary' : 'destructive'}>
                    Status: {selectedMessage.status}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Farmer's Report</h3>
                <div className="p-4 bg-muted rounded-lg">
                    <p className="text-muted-foreground">{selectedMessage.message}</p>
                </div>
            </div>

            <Separator />
            
            <div className="space-y-2">
                <h3 className="font-semibold">AI Generated Advisory</h3>
                <div className="flex items-center gap-4">
                    <span>Confidence Score:</span>
                    <Progress value={selectedMessage.aiConfidence * 100} className="w-1/3 h-3" />
                    <span className="font-bold text-primary">{ (selectedMessage.aiConfidence * 100).toFixed(1) }%</span>
                </div>
                {selectedMessage.knowledgeBaseId && (
                     <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        References Knowledge Base Article: <Link href="/dashboard/knowledge-base" className="text-primary underline">{selectedMessage.knowledgeBaseId}</Link>
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
                        <Button onClick={() => setIsEditing(false)} variant="outline"><X className="mr-2"/>Cancel</Button>
                        <Button><Check className="mr-2"/>Save & Approve</Button>
                        </>
                    ) : (
                        <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Send className="mr-2" />Approve & Send
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Send advice to farmer as is.</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2" />Edit Advice
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Modify the advice before sending.</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive">
                                    <ThumbsDown className="mr-2" />Reject
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Reject advice and flag for manual review.</p></TooltipContent>
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

// Dummy Link component for demonstration since next/link is not available here
const Link = ({href, className, children}: {href:string, className:string, children: React.ReactNode}) => <a href={href} className={className}>{children}</a>;
