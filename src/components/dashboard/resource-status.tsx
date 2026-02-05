import Link from 'next/link';
import { ArrowUpRight, Tractor, Wheat, Droplets } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { resources } from '@/lib/data';

const iconMap = {
    Seeds: Wheat,
    Fertilizers: Droplets,
    Tools: Tractor,
} as const;

export function ResourceStatus() {
    const keyResources = resources.filter(r => r.category !== 'Labor').slice(0, 3);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Resource Status</CardTitle>
                <CardDescription>
                  Current inventory levels for key resources.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/inventory">
                  Manage
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6">
                {keyResources.map(resource => {
                    const Icon = iconMap[resource.category as keyof typeof iconMap] || Droplets;
                    const stockPercentage = resource.category === 'Tools' ? resource.stock * 20 : resource.stock / 10;
                    return (
                        <div key={resource.id} className="flex items-center gap-4">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                            <div className="grid gap-1 w-full">
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium leading-none">{resource.name}</p>
                                    <p className="text-sm text-muted-foreground">{resource.stock} {resource.unit}</p>
                                </div>
                                <Progress value={stockPercentage} className="h-2" aria-label={`${stockPercentage}% in stock`} />
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
