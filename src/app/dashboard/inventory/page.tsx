import { resources } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Imbentaryo ng mga Mapagkukunan</h1>
          <p className="text-muted-foreground">Pamahalaan ang mga pataba, binhi, kasangkapan, at iba pang yaman ng barangay.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Magdagdag ng Yaman
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pangalan</TableHead>
                <TableHead>Kategorya</TableHead>
                <TableHead>Stak</TableHead>
                <TableHead>Yunit</TableHead>
                <TableHead>Huling Na-update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{resource.category}</Badge>
                  </TableCell>
                  <TableCell>{resource.stock}</TableCell>
                  <TableCell>{resource.unit}</TableCell>
                  <TableCell>{new Date(resource.lastUpdated).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
