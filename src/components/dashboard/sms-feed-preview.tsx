
import Link from 'next/link';
import { ArrowUpRight, User, FilePen, Tractor, ShieldAlert, CloudCog, MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { smsMessages } from '@/lib/data';
import type { SmsMessageType } from '@/lib/types';

const urgencyVariant = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

const typeInfo: Record<SmsMessageType, {icon: React.ElementType }> = {
    pagpaparehistro: { icon: User },
    'update-sa-pananim': { icon: FilePen },
    kahilingan: { icon: Tractor },
    'ulat-ng-peste': { icon: ShieldAlert },
    'ulat-panahon': { icon: CloudCog },
    pangkalahatan: { icon: MessageCircle },
}

export function SmsFeedPreview() {
    const recentMessages = smsMessages.slice(0, 4);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Live na Feed ng SMS</CardTitle>
                <CardDescription>
                  Mga papasok na ulat mula sa mga magsasaka na nangangailangan ng pagpapatunay.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/sms-feed">
                  Tingnan Lahat
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {recentMessages.map((message) => {
                    const TypeIcon = typeInfo[message.type]?.icon || MessageCircle;
                    return (
                    <div key={message.id} className="flex items-start gap-4">
                        <TypeIcon className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-medium leading-none">
                                {message.farmerName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {message.message}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant={urgencyVariant[message.urgency]}>{message.urgency}</Badge>
                            <div className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
