
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const auditLogs = [
  { id: 'LOG001', user: 'brgy-admin@lingkod.ph', action: 'Nag-apruba ng payo sa SMS', target: 'SMS001', timestamp: new Date().toISOString() },
  { id: 'LOG002', user: 'brgy-admin@lingkod.ph', action: 'Nag-edit ng AI reply', target: 'SMS003', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'LOG003', user: 'brgy-admin@lingkod.ph', action: 'Nagpadala ng broadcast', target: 'Lahat ng Magsasaka', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'LOG004', user: 'municipal-admin@lingkod.ph', action: 'Niresolba ang insidente', target: 'INC001', timestamp: new Date(Date.now() - 86400000).toISOString() },
];

export default function AuditLogPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Log ng Pagsusuri</h1>
        <p className="text-muted-foreground">Subaybayan ang mahahalagang aksyon na ginawa ng mga gumagamit sa sistema.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Log ng mga Aksyon</CardTitle>
          <CardDescription>
            Isang talaan ng lahat ng kritikal na aksyon ng gumagamit para sa pananagutan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Gumagamit</TableHead>
                <TableHead>Aksyon</TableHead>
                <TableHead>Target ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.target}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    