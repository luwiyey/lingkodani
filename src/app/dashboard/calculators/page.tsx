
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

export default function CalculatorsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Toolkit ng Operasyon sa Bukid</h1>
        <p className="text-muted-foreground">Mga calculator para tulungan sa paggawa ng desisyon sa bukid.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator /> Calculator ng Pataba</CardTitle>
            <CardDescription>Kalkulahin ang tamang dami ng pataba para sa iyong pananim.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fert-area">Laki ng Lupa (ha)</Label>
              <Input id="fert-area" type="number" placeholder="hal. 1.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fert-crop">Uri ng Pananim</Label>
              <Input id="fert-crop" placeholder="hal. Palay" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Kalkulahin</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator /> Calculator ng Dosis ng Pestisidyo</CardTitle>
            <CardDescription>Tukuyin ang tamang halo ng pestisidyo at tubig.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="pest-area">Laki ng Lupa (ha)</Label>
              <Input id="pest-area" type="number" placeholder="hal. 1.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pest-name">Pestisidyo</Label>
              <Input id="pest-name" placeholder="hal. Cypermethrin" />
            </div>
          </CardContent>
           <CardFooter>
            <Button className="w-full">Kalkulahin</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator /> Pagsusuri sa Kita ng Pananim</CardTitle>
            <CardDescription>Tantyahin ang potensyal na kita at break-even point.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="profit-yield">Inaasahang Ani (kg)</Label>
              <Input id="profit-yield" type="number" placeholder="hal. 5000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profit-price">Presyo sa Merkado (bawat kg)</Label>
              <Input id="profit-price" type="number" placeholder="hal. 19" />
            </div>
          </CardContent>
           <CardFooter>
            <Button className="w-full">Kalkulahin</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

    