
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { farmers } from '@/lib/data';
import { HelpDialog } from "@/components/ui/help-dialog";

// Helper function to get stats per zone
const getZoneStats = () => {
    const zones: { [key: string]: { farmers: number, issues: number } } = {};

    farmers.forEach(farmer => {
        if (!zones[farmer.sitio]) {
            zones[farmer.sitio] = { farmers: 0, issues: 0 };
        }
        if (farmer.status !== 'pending_approval') {
            zones[farmer.sitio].farmers++;
        }
        
        // Mock issue count based on farmer status or other logic
        // Using a deterministic check based on farmer ID to avoid hydration errors from Math.random()
        if (farmer.status === 'inactive' || (parseInt(farmer.id.replace('FARM', '')) % 4 === 0)) {
            zones[farmer.sitio].issues++;
        }
    });

    return Object.entries(zones).map(([name, stats]) => ({
        id: name,
        name,
        farmerCount: stats.farmers,
        activeIssues: stats.issues,
    })).sort((a,b) => a.name.localeCompare(b.name));
};


export default function OversightPage() {
    const zoneData = getZoneStats();

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Pangkalahatang-ideya ng Barangay</h1>
            <HelpDialog title="Pangkalahatang-ideya ng Barangay">
                <p>Ang pahinang ito ay nagbibigay ng isang "bird's-eye view" ng buong barangay, na pinaghiwa-hiwalay sa bawat zone o purok. Ito ay isang tool para sa madaliang pagtatasa ng sitwasyon sa buong komunidad.</p>
                <p>Gamit ang talahanayan, mabilis mong makikita kung aling mga zone ang may pinakamaraming magsasaka at kung saan nagkukumpol-kumpol ang mga aktibong isyu (tulad ng mga ulat ng peste, sakit, o iba pang mga problema na nangangailangan ng atensyon).</p>
                <p>Ang badge para sa "Mga Aktibong Isyu" ay magiging pula kung mayroong higit sa isang isyu, na nagpapahiwatig na maaaring kailanganin ng lugar na iyon ang iyong agarang atensyon at posibleng isang field visit mula sa isang Agricultural Extension Worker (AEW).</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Pinagsama-samang pagtingin sa aktibidad ng agrikultura sa lahat ng zone (sitio/purok).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buod ng mga Zone</CardTitle>
          <CardDescription>
            Pangkalahatang-ideya ng bilang ng magsasaka at mga aktibong isyu sa bawat zone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pangalan ng Zone</TableHead>
                <TableHead>Bilang ng Magsasaka</TableHead>
                <TableHead>Mga Aktibong Isyu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zoneData.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{zone.farmerCount}</TableCell>
                  <TableCell>
                    <Badge variant={zone.activeIssues > 1 ? "destructive" : "secondary"}>
                      {zone.activeIssues}
                    </Badge>
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
