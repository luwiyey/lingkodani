
'use client';

import Link from 'next/link';
import { ArrowUpRight, User, FilePen, Tractor, ShieldAlert, CloudCog, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { smsMessages } from '@/lib/data';
import type { SmsIntent } from '@/lib/types';

const urgencyVariant = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

const typeInfo: Record<SmsIntent, {icon: React.ElementType }> = {
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
    const recentMessages = smsMessages.slice(0, 4);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="grid gap-2">
                <CardTitle>Live na Feed ng SMS</CardTitle>
                <CardDescription>
                  Mga papasok na ulat mula sa mga magsasaka na nangangailangan ng pagpapatunay.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="gap-1 flex-shrink-0">
                <Link href={feedHref}>
                  Tingnan Lahat
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {recentMessages.map((message) => {
                    const TypeIcon = typeInfo[message.parsedIntent]?.icon || MessageCircle;
                    return (
                    <div key={message.id} className="flex items-start gap-4">
                        <TypeIcon className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                                {message.farmerName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {message.message}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <Badge variant={urgencyVariant[message.urgency]}>{message.urgency}</Badge>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {isClient ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null}
                            </div>
                        </div>
                    </div>
                )}
                )}
                </div>
            </CardContent>
        </Card>
    )
}
