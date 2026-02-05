
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const barangayData = [
    { id: 'BRGY01', name: 'Batakil', farmerCount: 1246, activeIssues: 16, pendingRequests: 46 },
];

export default function OversightPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Panel ng Pagsubaybay ng Munisipyo</h1>
        <p className="text-muted-foreground">Pinagsama-samang pagtingin sa aktibidad ng agrikultura sa lahat ng barangay.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buod ng mga Barangay</CardTitle>
          <CardDescription>
            Pangkalahatang-ideya ng bilang ng magsasaka, mga aktibong isyu, at mga nakabinbing kahilingan sa bawat barangay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pangalan ng Barangay</TableHead>
                <TableHead>Bilang ng Magsasaka</TableHead>
                <TableHead>Mga Aktibong Isyu</TableHead>
                <TableHead>Mga Nakabinbing Kahilingan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barangayData.map((barangay) => (
                <TableRow key={barangay.id}>
                  <TableCell className="font-medium">{barangay.name}</TableCell>
                  <TableCell>{barangay.farmerCount}</TableCell>
                  <TableCell>
                    <Badge variant={barangay.activeIssues > 5 ? "destructive" : "secondary"}>
                      {barangay.activeIssues}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline">{barangay.pendingRequests}</Badge>
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
