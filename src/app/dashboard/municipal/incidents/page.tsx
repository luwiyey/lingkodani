
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const incidents = [
    { id: 'INC001', barangay: 'San Isidro', farmer: 'Maria Clara', title: 'Hindi pangkaraniwang sakit sa kamatis', status: 'under_review', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'INC002', barangay: 'Santa Cruz', farmer: 'Jose Rizal', title: 'Paulit-ulit na mababang kumpiyansa ng AI', status: 'open', timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: 'INC003', barangay: 'Mabini', farmer: 'Juan dela Cruz', title: 'Salungatan sa mamimili ng ani', status: 'resolved', timestamp: new Date(Date.now() - 259200000).toISOString() },
];

export default function IncidentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Desk ng Insidente at Pag-escalate</h1>
        <p className="text-muted-foreground">Pamahalaan ang mga isyu na in-escalate mula sa mga barangay para sa suporta.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mga Nakabinbing Insidente</CardTitle>
          <CardDescription>
            Suriin, magdagdag ng mga tala, at lutasin ang mga isyu na nangangailangan ng atensyon ng munisipyo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Magsasaka</TableHead>
                <TableHead>Pamagat</TableHead>
                <TableHead>Katayuan</TableHead>
                <TableHead className="text-right">Mga Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>{new Date(incident.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{incident.barangay}</TableCell>
                  <TableCell>{incident.farmer}</TableCell>
                  <TableCell>{incident.title}</TableCell>
                  <TableCell>
                    <Badge variant={incident.status === 'open' ? 'destructive' : incident.status === 'under_review' ? 'secondary' : 'default'}>{incident.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Suriin</Button>
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

    