
'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const trainingModules = [
  { title: "Pagsusuri ng Kaso: Pag-atake ng Leaf Blight", description: "Suriin ang isang tunay na kaso at ang inirekomendang tugon ng AI." },
  { title: "Pag-unawa sa mga Pattern ng Wika sa SMS", description: "Alamin kung paano mas mahusay na bigyang-kahulugan ang mga karaniwang parirala ng magsasaka." },
  { title: "Pagbibigay ng Feedback sa Pagtutuwid ng AI", description: "Paano itama ang mga mungkahi ng AI upang mapabuti ang sistema sa paglipas ng panahon." },
];

export default function AiToolkitPage() {
  const [fertResult, setFertResult] = useState('');
  const [pestResult, setPestResult] = useState('');
  const [profitResult, setProfitResult] = useState('');
  const { toast } = useToast();

  const calculateFertilizer = (e: React.FormEvent) => {
    e.preventDefault();
    // Simpleng pagkalkula para sa demo
    setFertResult('Rekomendasyon: 3 sako ng Urea, 2 sako ng Complete (14-14-14).');
    toast({ title: 'Nakalkula na ang Pataba!', description: fertResult });
  };
  
  const calculatePesticide = (e: React.FormEvent) => {
    e.preventDefault();
    setPestResult('Rekomendasyon: 20ml ng pestisidyo bawat 16L na tubig.');
    toast({ title: 'Nakalkula na ang Pestisidyo!', description: pestResult });
  };

  const calculateProfit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfitResult('Tinatayang Kita: ₱45,000. Break-even sa 2,800 kg.');
    toast({ title: 'Nasuri na ang Kita!', description: profitResult });
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">AI Toolkit</h1>
        <p className="text-muted-foreground">Mga calculator at pagsasanay na pinapagana ng AI para sa pagsasaka.</p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator /> Mga Calculator sa Bukid</CardTitle>
            <CardDescription>Mga calculator para tulungan sa paggawa ng desisyon sa bukid.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <form onSubmit={calculateFertilizer}>
            <Card>
            <CardHeader>
                <CardTitle className="text-lg">Calculator ng Pataba</CardTitle>
                <CardDescription>Kalkulahin ang tamang dami ng pataba.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="fert-area">Laki ng Lupa (ha)</Label>
                <Input id="fert-area" type="number" step="0.1" placeholder="hal. 1.5" required/>
                </div>
                <div className="space-y-2">
                <Label htmlFor="fert-crop">Uri ng Pananim</Label>
                <Input id="fert-crop" placeholder="hal. Palay" required/>
                </div>
                {fertResult && <p className="text-sm font-medium text-primary">{fertResult}</p>}
            </CardContent>
            <CardFooter>
                <Button className="w-full">Kalkulahin</Button>
            </CardFooter>
            </Card>
            </form>
            
            <form onSubmit={calculatePesticide}>
            <Card>
            <CardHeader>
                <CardTitle className="text-lg">Dosis ng Pestisidyo</CardTitle>
                <CardDescription>Tukuyin ang tamang halo ng pestisidyo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="pest-area">Laki ng Lupa (ha)</Label>
                <Input id="pest-area" type="number" step="0.1" placeholder="hal. 1.5" required/>
                </div>
                <div className="space-y-2">
                <Label htmlFor="pest-name">Pestisidyo</Label>
                <Input id="pest-name" placeholder="hal. Cypermethrin" required/>
                </div>
                {pestResult && <p className="text-sm font-medium text-primary">{pestResult}</p>}
            </CardContent>
            <CardFooter>
                <Button className="w-full">Kalkulahin</Button>
            </CardFooter>
            </Card>
            </form>

            <form onSubmit={calculateProfit}>
            <Card>
            <CardHeader>
                <CardTitle className="text-lg">Pagsusuri sa Kita</CardTitle>
                <CardDescription>Tantyahin ang potensyal na kita.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="profit-yield">Inaasahang Ani (kg)</Label>
                <Input id="profit-yield" type="number" placeholder="hal. 5000" required/>
                </div>
                <div className="space-y-2">
                <Label htmlFor="profit-price">Presyo sa Merkado (bawat kg)</Label>
                <Input id="profit-price" type="number" placeholder="hal. 19" required/>
                </div>
                {profitResult && <p className="text-sm font-medium text-primary">{profitResult}</p>}
            </CardContent>
            <CardFooter>
                <Button className="w-full">Kalkulahin</Button>
            </CardFooter>
            </Card>
            </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles /> Pagsasanay para sa AEW</CardTitle>
            <CardDescription>Mga mapagkukunan para sa pagpapabuti ng kasanayan ng mga Agricultural Extension Worker.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trainingModules.map((module) => (
                <Card key={module.title}>
                    <CardHeader>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button>Simulan ang Modyul</Button>
                    </CardContent>
                </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

    