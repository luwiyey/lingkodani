
'use client';

import Link from 'next/link';
import { ArrowUpRight, User, FilePen, Tractor, ShieldAlert, CloudCog, MessageCircle } from 'lucide-react';
import { useState, useEffect, type ElementType } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SmsIntent } from '@/lib/types';
import { HoverTooltip } from '../ui/hover-tooltip';
import { useData } from '@/context/data-context';

const urgencyVariant = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

const typeInfo: Record<SmsIntent, {icon: ElementType }> = {
    REGISTER: { icon: User },
    CROP_UPDATE: { icon: FilePen },
    HARVEST: { icon: FilePen },
    REQUEST: { icon: Tractor },
    PEST_DISEASE: { icon: ShieldAlert },
    WEATHER_HELP: { icon: CloudCog },
    PRICE_CHECK: { icon: MessageCircle },
    EMERGENCY: { icon: ShieldAlert },
    UNKNOWN: { icon: MessageCircle },
}

export function SmsFeedPreview({ feedHref = "/dashboard/sms-feed" }: { feedHref?: string }) {
    const { smsMessages, farmers } = useData();
    const recentMessages = smsMessages.slice(0, 4);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <HoverTooltip text="Buksan ang SMS Feed para sa kumpletong listahan ng mga mensahe.">
            <Link href={feedHref} className="block h-full">
                <Card className="h-full hover:-translate-y-px hover:border-primary/15">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div className="grid gap-2">
                        <CardTitle>SMS Feed</CardTitle>
                        <CardDescription>
                          Mga pinakabagong papasok na ulat mula sa mga magsasaka.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-primary">
                        Buksan
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-0 divide-y divide-border/70">
                        {recentMessages.map((message) => {
                            const TypeIcon = typeInfo[message.parsedIntent]?.icon || MessageCircle;
                            const farmer = farmers.find(f => f.id === message.farmerId);
                            const farmerName = farmer ? farmer.name : message.farmerName;
                            return (
                            <HoverTooltip key={message.id} text={`Layunin ng AI: ${message.parsedIntent} | Kumpiyansa: ${(message.aiConfidence * 100).toFixed(0)}%`}>
                                <div className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <TypeIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-semibold leading-none">
                                            {farmerName}
                                        </p>
                                        <p className="mt-1 truncate text-sm text-muted-foreground">
                                            {message.message}
                                        </p>
                                    </div>
                                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                        <Badge variant={urgencyVariant[message.urgency]}>{message.urgency}</Badge>
                                        <div className="whitespace-nowrap text-[11px] text-muted-foreground">
                                        {isClient ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null}
                                        </div>
                                    </div>
                                </div>
                            </HoverTooltip>
                        )}
                        )}
                        {recentMessages.length === 0 && (
                            <div className="py-4 text-sm text-muted-foreground">
                                No farmer reports yet today.
                            </div>
                        )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </HoverTooltip>
    )
}
