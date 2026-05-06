
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from '@/context/data-context';
import { HelpDialog } from "@/components/ui/help-dialog";
import { Sprout, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import React from "react";
import { getLatestFarmerCropStage } from '@/lib/crop-stage';

const stageColors: { [key: string]: string } = {
    'Pagtatanim': 'bg-blue-500/10 text-blue-500',
    'Paglago': 'bg-green-500/10 text-green-500',
    'Pamumulaklak': 'bg-yellow-500/10 text-yellow-500',
    'Pag-aani': 'bg-orange-500/10 text-orange-500',
    'Hindi pa naitatala': 'bg-slate-500/10 text-slate-600',
}

export default function ActiveFarmsPage() {
  const router = useRouter();
  const { farmers, smsMessages } = useData();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const activeFarms = farmers.filter(f => f.status === 'active').map((farmer, index) => {
    const crops = farmer.crops.length > 0 ? farmer.crops : ['Unknown'];
    const latestMessage = smsMessages
      .filter((message) => message.farmerId === farmer.id)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0];
    const stage = getLatestFarmerCropStage(farmer, smsMessages);
    const fallbackLastUpdate = latestMessage?.timestamp || farmer.lastSmsActivity || farmer.registrationDate;
    return {
        id: `CROP${String(index + 1).padStart(3, '0')}`,
        farmerId: farmer.id,
        farmerName: farmer.name,
        crop: crops[0], // Show the first crop for simplicity
        stage: stage,
        lastUpdate: fallbackLastUpdate,
    }
  });

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-4">
            <HoverTooltip text="Bumalik sa Dashboard">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            </HoverTooltip>
            <div className="space-y-1">
                <div className="flex items-center">
                    <Sprout className="mr-2 h-6 w-6"/>
                    <h1 className="text-2xl font-bold tracking-tight">Mga Aktibong Sakahan</h1>
                    <HelpDialog title="Mga Aktibong Sakahan" tooltipText="Subaybayan ang mga yugto ng pananim sa buong barangay.">
                        <p>Ang pahinang ito ay nagbibigay ng isang pangkalahatang-ideya ng lahat ng mga sakahan na kasalukuyang may aktibong tanim (crop cycle). Ito ay nagbibigay-daan sa iyo na subaybayan ang pag-unlad ng mga pananim sa buong barangay.</p>
                        <p><strong>Talahanayan ng mga Aktibong Sakahan:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Pangalan ng Magsasaka:</strong> Ang magsasaka na nagmamay-ari ng sakahan. Maaari mong i-click ang pangalan upang pumunta sa kanilang detalyadong profile.</li>
                            <li><strong>Pananim:</strong> Ang kasalukuyang itinatanim na pananim.</li>
                            <li><strong>Kasalukuyang Yugto:</strong> Ang yugto ng paglago ng pananim (hal. Pagtatanim, Paglago, Pamumulaklak, Pag-aani).</li>
                            <li><strong>Huling Update:</strong> Ang petsa kung kailan huling nagbigay ng update ang magsasaka tungkol sa kanilang pananim.</li>
                        </ul>
                        <p>Gamitin ang impormasyong ito upang ma-anticipate ang mga pangangailangan ng mga magsasaka batay sa yugto ng kanilang pananim. Halimbawa, ang mga nasa yugto ng paglago ay maaaring mangailangan ng payo tungkol sa pataba o peste.</p>
                    </HelpDialog>
                </div>
                <p className="text-muted-foreground">Subaybayan ang kasalukuyang yugto at pag-unlad ng mga pananim sa buong barangay.</p>
                <p className="text-xs text-muted-foreground">
                  Ang stage ay hinango mula sa pinakahuling crop-related SMS context ng bawat aktibong magsasaka. Kapag wala pang malinaw na stage signal, lalabas ito bilang "Hindi pa naitatala."
                </p>
            </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Listahan ng mga Sakahan</CardTitle>
          <CardDescription>
            Mayroong {activeFarms.length} na sakahan na may aktibong crop cycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 md:px-4">Pangalan ng Magsasaka</TableHead>
                <TableHead className="px-2 md:px-4">Pananim</TableHead>
                <TableHead className="px-2 md:px-4">Kasalukuyang Yugto</TableHead>
                <TableHead className="px-2 md:px-4">Huling Update</TableHead>
                <TableHead className="text-right px-2 md:px-4">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeFarms.map((farm) => (
                <TableRow key={farm.id}>
                  <TableCell className="font-medium px-2 py-4 md:px-4">{farm.farmerName}</TableCell>
                  <TableCell className="px-2 py-4 md:px-4">{farm.crop}</TableCell>
                  <TableCell className="px-2 py-4 md:px-4">
                    <Badge variant="outline" className={stageColors[farm.stage as keyof typeof stageColors] || ''}>
                      {farm.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 py-4 md:px-4">{isClient ? new Date(farm.lastUpdate).toLocaleDateString() : ''}</TableCell>
                  <TableCell className="text-right px-2 py-4 md:px-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/farmers/${farm.farmerId}`}>
                            <span className="hidden sm:inline">Tingnan</span> <ArrowUpRight className="ml-0 sm:ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
