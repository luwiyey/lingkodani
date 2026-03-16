
'use client';

import Link from 'next/link';
import { ArrowUpRight, Tractor, Wheat, Droplets } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ResourceCategory } from '@/lib/types';
import { HoverTooltip } from '../ui/hover-tooltip';
import { useData } from '@/context/data-context';

const iconMap: Record<ResourceCategory, React.ElementType> = {
    'Binhi': Wheat,
    'Pataba': Droplets,
    'Kagamitan': Tractor,
    'Paggawa': Tractor,
};

export function ResourceStatus({ manageHref = "/dashboard/inventory" }: { manageHref?: string }) {
    const { resources } = useData();
    const keyResources = resources.filter(r => r.category !== 'Paggawa').slice(0, 3);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <HoverTooltip text="Buksan ang inventory para pamahalaan ang lahat ng rekurso.">
            <Link href={manageHref} className="block h-full">
                <Card className="h-full hover:-translate-y-px hover:border-primary/15">
                    <CardHeader className="flex flex-row items-start">
                      <div className="grid gap-2">
                        <CardTitle>Katayuan ng Rekurso</CardTitle>
                        <CardDescription>
                          Kasalukuyang antas ng imbentaryo para sa mga pangunahing rekurso.
                        </CardDescription>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-sm font-medium text-primary">
                        Buksan
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {keyResources.map(resource => {
                            const Icon = iconMap[resource.category] || Droplets;
                            const stockPercentage = resource.category === 'Kagamitan' ? resource.stock * 20 : resource.stock / 10;
                            return (
                                <HoverTooltip key={resource.id} text={`Huling na-update noong ${isClient ? new Date(resource.lastUpdated).toLocaleDateString() : ''}`}>
                                    <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-muted/35 p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="grid w-full gap-2">
                                            <div className="flex justify-between gap-3">
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
            </Link>
        </HoverTooltip>
    )
}
