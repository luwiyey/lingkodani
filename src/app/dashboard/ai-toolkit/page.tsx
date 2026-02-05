
'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function AiToolkitPage() {
  const [fertResult, setFertResult] = useState('');
  const [pestResult, setPestResult] = useState('');
  const [profitResult, setProfitResult] = useState('');
  const { toast } = useToast();

  const calculateFertilizer = (e: React.FormEvent) => {
    e.preventDefault();
    setFertResult('Rekomendasyon: 3 sako ng Urea, 2 sako ng Complete (14-14-14).');
    toast({ title: 'Nakalkula na ang Pataba!', description: 'Nasa ibaba ang resulta.' });
  };
  
  const calculatePesticide = (e: React.FormEvent) => {
    e.preventDefault();
    setPestResult('Rekomendasyon: 20ml ng pestisidyo bawat 16L na tubig.');
    toast({ title: 'Nakalkula na ang Pestisidyo!', description: 'Nasa ibaba ang resulta.' });
  };

  const calculateProfit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfitResult('Tinatayang Kita: ₱45,000. Break-even sa 2,800 kg.');
    toast({ title: 'Nasuri na ang Kita!', description: 'Nasa ibaba ang resulta.' });
  };
  
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: 'Salamat sa iyong Feedback!',
        description: 'Natanggap na namin ang iyong isinumite. Gagamitin ito para mapabuti ang performance ng AI sa hinaharap.'
    });
    (e.target as HTMLFormElement).reset();
};


  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">AI Toolkit & Pagsasanay</h1>
        <p className="text-muted-foreground">Mga tool at feature para tulungan ang mga admin at sanayin ang AI.</p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator /> Mga Calculator sa Bukid</CardTitle>
            <CardDescription>Mga calculator para tulungan sa paggawa ng desisyon sa bukid.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
            <CardTitle className="flex items-center gap-2"><BrainCircuit /> Feedback sa AI</CardTitle>
            <CardDescription>Turuan ang AI sa pamamagitan ng pagbibigay ng mga tamang halimbawa. Ito ay makakatulong sa AI na mas maunawaan ang mga lokal na wika at konteksto.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="feedback-sms">Halimbawang SMS ng Magsasaka</Label>
                    <Textarea id="feedback-sms" placeholder="hal. 'Agbunga ti mais kon, ngem adda uleg idiay.' (Ilocano)" required rows={3}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="feedback-intent">Ano ang tamang interpretasyon/layunin nito?</Label>
                    <Input id="feedback-intent" placeholder="hal. Ulat ng Ani na may Panganib sa Kaligtasan" required/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="feedback-reply">Ano ang dapat na perpektong tugon sa SMS na ito?</Label>
                    <Textarea id="feedback-reply" placeholder="hal. 'Congrats sa iyong ani! Mag-ingat po sa ahas. Huwag po munang pumasok sa lugar. Makikipag-ugnayan kami para sa tulong.'" required rows={3} />
                </div>
                 <Button type="submit">Isumite ang Feedback</Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
