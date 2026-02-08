
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { auditLogs as initialLogs } from '@/lib/data';
import type { AuditLog } from '@/lib/types';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
    const [searchTerm, setSearchTerm] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const filteredLogs = logs.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Log ng Pagsusuri</h1>
            <HelpDialog title="Log ng Pagsusuri">
                <p>Ang pahinang ito ay naglalaman ng isang kumpletong talaan (log) ng lahat ng mahahalagang aksyon na ginawa ng mga user sa sistema. Ito ay para sa layunin ng seguridad, pananagutan, at pag-troubleshoot.</p>
                <p><strong>Mga Tampok:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Maghanap:</strong> Gamitin ang search bar upang mabilis na mahanap ang mga partikular na log ayon sa pangalan ng user, uri ng aksyon, o mga detalye.</li>
                    <li><strong>Timestamp:</strong> Nagpapakita kung kailan eksaktong ginawa ang isang aksyon.</li>
                    <li><strong>Gumagamit:</strong> Ang email address ng user na gumawa ng aksyon.</li>
                    <li><strong>Aksyon:</strong> Ang uri ng aksyon na ginawa (hal., pag-apruba ng mensahe, pag-update ng profile).</li>
                    <li><strong>Mga Detalye:</strong> Isang mas detalyadong paglalarawan ng aksyon.</li>
                </ul>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Isang detalyadong talaan ng lahat ng mahahalagang aksyon na ginawa sa sistema.</p>
      </div>

       <div className="flex gap-4">
            <HoverTooltip text="Mag-type dito upang maghanap ng mga log. Maaari kang maghanap ayon sa email ng user, uri ng aksyon, o mga keyword sa detalye.">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Maghanap sa mga log ayon sa user, aksyon, o detalye..."
                        className="w-full rounded-lg bg-background pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </HoverTooltip>
        </div>

      <Card>
        <CardContent>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Gumagamit</TableHead>
                <TableHead>Aksyon</TableHead>
                <TableHead>Mga Detalye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="break-words">{isClient ? new Date(log.timestamp).toLocaleString() : ''}</TableCell>
                  <TableCell className="font-medium break-words">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="break-words">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
