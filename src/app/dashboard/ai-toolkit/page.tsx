'use client';

import { useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, BrainCircuit, CheckCircle, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { diagnosePlant } from "@/ai/flows/diagnose-plant-problem";
import type { DiagnosePlantOutput } from "@/ai/flows/diagnose-plant-problem";
import { Skeleton } from "@/components/ui/skeleton";

export default function AiToolkitPage() {
  const [fertResult, setFertResult] = useState('');
  const [pestResult, setPestResult] = useState('');
  const [profitResult, setProfitResult] = useState('');
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosePlantOutput | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

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
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handlePlantDiagnosis = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!previewImage) {
          toast({ title: 'Kulang ng Larawan', description: 'Mangyaring mag-upload ng larawan ng halaman.', variant: 'destructive' });
          return;
      }
      setDiagnosisLoading(true);
      setDiagnosisResult(null);

      try {
          const description = (e.currentTarget.querySelector('#plant-description') as HTMLTextAreaElement).value;
          const result = await diagnosePlant({ photoDataUri: previewImage, description });
          setDiagnosisResult(result);
          toast({ title: 'Tagumpay ang Pagsusuri!', description: 'Nasa ibaba ang resulta ng pagsusuri ng AI.' });
      } catch (error) {
          console.error(error);
          toast({ title: 'Nagka-error!', description: 'Hindi nagtagumpay ang pagsusuri ng halaman.', variant: 'destructive' });
      } finally {
          setDiagnosisLoading(false);
      }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">AI Toolkit</h1>
        <p className="text-muted-foreground">Mga tool para tulungan ang mga admin sa paggawa ng desisyon.</p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit /> Plant-MD: Pagsusuri ng Halaman gamit ang AI</CardTitle>
              <CardDescription>Mag-upload ng larawan ng halaman upang matukoy ang mga sakit o peste.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePlantDiagnosis}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plant-photo">Larawan ng Halaman</Label>
                  <div className="flex items-center gap-2">
                    <Input id="plant-photo" type="file" accept="image/*" onChange={handleImageChange} required className="h-auto p-0 file:p-2 file:mr-4 file:border-0 file:bg-muted file:rounded-sm cursor-pointer file:cursor-pointer"/>
                  </div>
                </div>
                {previewImage && <Image src={previewImage} alt="Plant preview" width={200} height={200} className="rounded-md mx-auto object-cover" />}
                <div className="space-y-2">
                    <Label htmlFor="plant-description">Maikling Paglalarawan ng Sintomas</Label>
                    <Textarea id="plant-description" placeholder="hal. May mga dilaw na batik sa dahon, butas-butas ang bunga..." required/>
                </div>
                
                {diagnosisLoading && (
                  <div className="space-y-4 pt-2">
                      <h3 className="font-semibold text-lg">Nagsusuri...</h3>
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                  </div>
                )}
                {diagnosisResult && (
                    <div className="space-y-4 text-sm pt-2">
                      <h3 className="font-semibold text-lg">Resulta ng Pagsusuri:</h3>
                      <p><strong>Pangalan:</strong> {diagnosisResult.identification.commonName} <em>({diagnosisResult.identification.latinName})</em></p>
                      <div className="flex items-center gap-2">
                        <strong>Kalusugan:</strong>
                        {diagnosisResult.diagnosis.isHealthy ? 
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle size={16} /> Malusog</span> :
                          <span className="flex items-center gap-1 text-destructive"><AlertTriangleIcon size={16} /> May Problema</span>
                        }
                      </div>
                      {!diagnosisResult.diagnosis.isHealthy && <p><strong>Problema:</strong> {diagnosisResult.diagnosis.problem}</p>}
                       <p><strong>Deskripsyon:</strong> {diagnosisResult.diagnosis.description}</p>
                      
                       <h4 className="font-semibold pt-2">Mga Hakbang sa Pagsugpo:</h4>
                       <ul className="list-disc pl-5 space-y-1">
                          {diagnosisResult.remediation.steps.map((step, i) => <li key={i}>{step}</li>)}
                       </ul>

                       {diagnosisResult.remediation.chemicalWarning && (
                         <div className="p-3 mt-2 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                            <p className="font-bold">{diagnosisResult.remediation.chemicalWarning}</p>
                         </div>
                       )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" type="submit" disabled={diagnosisLoading}>
                    {diagnosisLoading ? 'Nagsusuri...' : 'Suriin ang Halaman'}
                </Button>
            </CardFooter>
          </form>
        </Card>
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
}
