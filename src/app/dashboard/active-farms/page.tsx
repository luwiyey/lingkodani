
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { farmers } from '@/lib/data';
import { HelpDialog } from "@/components/ui/help-dialog";
import { Sprout, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import type { Metadata } from 'next';

// This would ideally be in a layout if it's shared
// export const metadata: Metadata = {
//   title: 'Mga Aktibong Sakahan | Lingkod-Ani',
//   description: 'Subaybayan ang kasalukuyang yugto ng mga pananim sa buong barangay.',
// };

// In a real app, this data would likely come from a 'crop_cycles' collection in Firestore.
// For this prototype, we'll generate it based on our mock farmers.
const activeFarms = farmers.filter(f => f.status === 'active').map((farmer, index) => {
    // This logic is just for creating varied mock data
    const stages = ['Paglago', 'Pamumulaklak', 'Pagtatanim', 'Pag-aani'];
    const crops = farmer.crops.length > 0 ? farmer.crops : ['Unknown'];
    const stage = stages[index % stages.length];
    return {
        id: `CROP${String(index + 1).padStart(3, '0')}`,
        farmerId: farmer.id,
        farmerName: farmer.name,
        crop: crops[0], // Show the first crop for simplicity
        stage: stage,
        lastUpdate: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString()
    }
});


const stageColors: { [key: string]: string } = {
    'Pagtatanim': 'bg-blue-500/10 text-blue-500',
    'Paglago': 'bg-green-500/10 text-green-500',
    'Pamumulaklak': 'bg-yellow-500/10 text-yellow-500',
    'Pag-aani': 'bg-orange-500/10 text-orange-500',
}

export default function ActiveFarmsPage() {
  const router = useRouter();

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
                <TableHead>Pangalan ng Magsasaka</TableHead>
                <TableHead>Pananim</TableHead>
                <TableHead>Kasalukuyang Yugto</TableHead>
                <TableHead>Huling Update</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeFarms.map((farm) => (
                <TableRow key={farm.id}>
                  <TableCell className="font-medium">{farm.farmerName}</TableCell>
                  <TableCell>{farm.crop}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={stageColors[farm.stage as keyof typeof stageColors] || ''}>
                      {farm.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(farm.lastUpdate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/farmers/${farm.farmerId}`}>
                            Tingnan <ArrowUpRight className="ml-2 h-4 w-4" />
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
