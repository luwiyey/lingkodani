
import Link from 'next/link';
import { ArrowUpRight, Tractor, Wheat, Droplets } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { resources } from '@/lib/data';
import type { ResourceCategory } from '@/lib/types';
import { HoverTooltip } from '../ui/hover-tooltip';

const iconMap: Record<ResourceCategory, React.ElementType> = {
    'Binhi': Wheat,
    'Pataba': Droplets,
    'Kagamitan': Tractor,
    'Paggawa': Tractor,
};

export function ResourceStatus({ manageHref = "/dashboard/inventory" }: { manageHref?: string }) {
    const keyResources = resources.filter(r => r.category !== 'Paggawa').slice(0, 3);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start">
              <div className="grid gap-2">
                <CardTitle>Katayuan ng Rekurso</CardTitle>
                <CardDescription>
                  Kasalukuyang antas ng imbentaryo para sa mga pangunahing rekurso.
                </CardDescription>
              </div>
              <HoverTooltip text="Pumunta sa pahina ng imbentaryo upang pamahalaan ang lahat ng rekurso.">
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href={manageHref}>
                    Pamahalaan
                    <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
              </HoverTooltip>
            </CardHeader>
            <CardContent className="grid gap-6">
                {keyResources.map(resource => {
                    const Icon = iconMap[resource.category] || Droplets;
                    const stockPercentage = resource.category === 'Kagamitan' ? resource.stock * 20 : resource.stock / 10;
                    return (
                        <HoverTooltip key={resource.id} text={`Huling na-update noong ${new Date(resource.lastUpdated).toLocaleDateString()}`}>
                            <div className="flex items-center gap-4">
                                <Icon className="h-6 w-6 text-muted-foreground" />
                                <div className="grid gap-1 w-full">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-medium leading-none">{resource.name}</p>
                                        <p className="text-sm text-muted-foreground">{resource.stock} {resource.unit}</p>
                                    </div>
                                    <Progress value={stockPercentage} className="h-2" aria-label={`${stockPercentage}% in stock`} />
                                </div>
                            </div>
                        </HoverTooltip>
                    )
                })}
            </CardContent>
        </Card>
    )
}
