import Image from 'next/image';
import { farmers } from '@/lib/data';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';

export default function FarmersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Talaan ng Magsasaka</h1>
          <p className="text-muted-foreground">Tingnan at pamahalaan ang lahat ng nakarehistrong magsasaka.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Magdagdag ng Magsasaka
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
            type="search"
            placeholder="Maghanap ng magsasaka..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pangalan</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead>Mga Pananim</TableHead>
                <TableHead>Puntos ng Panganib</TableHead>
                <TableHead>Petsa ng Pagpaparehistro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmers.map((farmer) => (
                <TableRow key={farmer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Image
                            src={farmer.avatarUrl}
                            alt={farmer.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                        />
                        {farmer.name}
                    </div>
                  </TableCell>
                  <TableCell>{farmer.location}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {farmer.crops.map(crop => <Badge key={crop} variant="outline">{crop}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={farmer.riskScore > 50 ? 'destructive' : 'secondary'}>{farmer.riskScore}</Badge>
                  </TableCell>
                  <TableCell>{new Date(farmer.registrationDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
