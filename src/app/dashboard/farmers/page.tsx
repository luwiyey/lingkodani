
import Image from 'next/image';
import { farmers } from '@/lib/data';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, MessageSquarePlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';

export default function FarmersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Talaan ng Magsasaka</h1>
          <p className="text-muted-foreground">Tingnan at pamahalaan ang lahat ng nakarehistrong magsasaka.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Magpadala ng Broadcast
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Magdagdag ng Magsasaka
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Magrehistro ng Bagong Magsasaka</DialogTitle>
                    <DialogDescription>
                        Manu-manong magdagdag ng bagong magsasaka sa sistema. I-click ang i-save kapag tapos na.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Pangalan</Label>
                            <Input id="name" defaultValue="Pedro Penduko" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Telepono</Label>
                            <Input id="phone" defaultValue="+639123456789" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Barangay</Label>
                            <Input id="location" defaultValue="San Roque" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="municipality" className="text-right">Munisipalidad</Label>
                            <Input id="municipality" defaultValue="Bulacan" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="crops" className="text-right">Mga Pananim</Label>
                            <Input id="crops" defaultValue="Palay, Mais" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="farm-size" className="text-right">Sukat (ha)</Label>
                            <Input id="farm-size" type="number" defaultValue="1.5" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">I-save ang Pagbabago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
            type="search"
            placeholder="Maghanap ng magsasaka ayon sa pangalan, lokasyon, o pananim..."
            className="w-full rounded-lg bg-background pl-8 md:w-full"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Pangalan</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead>Mga Pananim</TableHead>
                <TableHead className="text-center">Sukat (ha)</TableHead>
                <TableHead className="text-center">Puntos ng Panganib</TableHead>
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
                  <TableCell>{farmer.location}, {farmer.municipality}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {farmer.crops.map(crop => <Badge key={crop} variant="outline">{crop}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{farmer.farmSize}</TableCell>
                  <TableCell className="text-center">
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
