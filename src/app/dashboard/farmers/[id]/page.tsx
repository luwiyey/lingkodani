
'use client';
import React from 'react';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { farmers, farmerLogbookEntries } from '@/lib/data';
import type { LogbookEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePen, PlusCircle, Camera, Mic } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

function TimelineItem({ entry }: { entry: LogbookEntry }) {
  const { icon: Icon, title, description, timestamp } = entry;
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">{title}</p>
          <time className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleString()}
          </time>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}


export default function FarmerLogbookPage() {
    const params = useParams();
    const farmerId = params.id as string;
    const farmer = farmers.find(f => f.id === farmerId);

    if (!farmer) {
        notFound();
    }

  return (
    <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
            <Card>
                <CardHeader className="flex-row items-center gap-4">
                    <Image src={farmer.avatarUrl} alt={farmer.name} width={64} height={64} className="rounded-full" />
                    <div>
                        <CardTitle className="text-2xl">{farmer.name}</CardTitle>
                        <CardDescription>ID: {farmer.id}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Edad:</strong> {farmer.age}</p>
                    <p><strong>Kasarian:</strong> {farmer.gender}</p>
                    <p><strong>Telepono:</strong> {farmer.phone}</p>
                    <p><strong>Lokasyon:</strong> {farmer.sitio}, {farmer.barangay}, {farmer.municipality}</p>
                    <p><strong>Sukat ng Bukid:</strong> {farmer.farmSize} ha</p>
                    <p><strong>Mga Pananim:</strong> {farmer.crops.join(', ')}</p>
                    <p><strong>Petsa ng Pagpaparehistro:</strong> {new Date(farmer.registrationDate).toLocaleDateString()}</p>
                </CardContent>
            </Card>
            <Card className="mt-6">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FilePen /> Magdagdag ng Tala sa Bukid</CardTitle>
                    <CardDescription>Mag-log ng mga obserbasyon, mag-upload ng mga larawan, o mag-record ng audio mula sa field. Nagsi-sync offline.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea placeholder="Isulat ang iyong mga obserbasyon dito..." />
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1"><Camera className="mr-2"/> Mag-upload ng Larawan</Button>
                        <Button variant="outline" className="flex-1"><Mic className="mr-2"/> Mag-record ng Audio</Button>
                    </div>
                    <Button className="w-full"><PlusCircle className="mr-2"/> I-save ang Tala</Button>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Logbook ng Magsasaka</CardTitle>
                    <CardDescription>Isang kumpletong timeline ng lahat ng interaksyon at aktibidad para kay {farmer.name}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {farmerLogbookEntries.map(entry => (
                        <TimelineItem key={entry.id} entry={entry} />
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    