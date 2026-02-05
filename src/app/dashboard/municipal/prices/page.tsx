
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Edit } from "lucide-react";

const prices = [
    { crop: 'Palay (tuyo)', price: 19.50, unit: 'kg', lastUpdated: '2023-10-25' },
    { crop: 'Mais (dilaw)', price: 14.00, unit: 'kg', lastUpdated: '2023-10-25' },
    { crop: 'Kamatis', price: 45.00, unit: 'kg', lastUpdated: '2023-10-26' },
    { crop: 'Tubo', price: 2200.00, unit: 'tonelada', lastUpdated: '2023-10-24' },
];

export default function PricesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sentro ng Awtoridad sa Presyo</h1>
        <p className="text-muted-foreground">Itakda at pamahalaan ang mga opisyal na presyo ng pananim para sa iyong munisipalidad.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mga Kasalukuyang Presyo ng Pananim</CardTitle>
          <CardDescription>
            Ang mga presyong ito ay awtomatikong ipinapadala sa mga magsasaka kapag sila ay nag-text ng PRESYO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pananim</TableHead>
                <TableHead>Presyo</TableHead>
                <TableHead>Yunit</TableHead>
                <TableHead>Huling Na-update</TableHead>
                <TableHead className="text-right">Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((item) => (
                <TableRow key={item.crop}>
                  <TableCell className="font-medium">{item.crop}</TableCell>
                  <TableCell>₱{item.price.toFixed(2)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" /> I-update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       <Card>
          <CardHeader>
            <CardTitle>Override ng Presyo sa Emergency</CardTitle>
            <CardDescription>Magtakda ng pansamantalang presyo bilang tugon sa mga kaganapan sa merkado. Ito ay mag-o-override sa mga karaniwang presyo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
                <Input placeholder="Pananim (e.g., Sibuyas)" />
                <Input type="number" placeholder="Bagong Presyo (₱)" />
                <Input type="number" placeholder="Bisa para sa (oras)" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive">I-activate ang Override</Button>
          </CardFooter>
        </Card>
    </div>
  );
}

    