
'use client';

import { useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, CheckCircle, Leaf, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { diagnosePlant } from "@/ai/flows/diagnose-plant-problem";
import type { DiagnosePlantOutput } from "@/ai/flows/diagnose-plant-problem";
import { calculateFertilizer } from "@/ai/flows/calculate-fertilizer";
import { calculatePesticide } from "@/ai/flows/calculate-pesticide";
import { calculateProfit } from "@/ai/flows/calculate-profit";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { AiStatusBanner } from "@/components/shared/ai-status-banner";
import { useRuntimeCapabilities } from "@/hooks/use-runtime-capabilities";

export default function AiToolkitPage() {
  const [fertResult, setFertResult] = useState('');
  const [pestResult, setPestResult] = useState('');
  const [profitResult, setProfitResult] = useState('');

  const [fertLoading, setFertLoading] = useState(false);
  const [pestLoading, setPestLoading] = useState(false);
  const [profitLoading, setProfitLoading] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosePlantOutput | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const { toast } = useToast();
  const { capabilities, capabilitiesLoading } = useRuntimeCapabilities();
  const aiLocked = !capabilities.aiConfigured;
  const aiLockMessage =
    capabilities.reasons.ai ??
    "Naka-lock muna ang AI tools habang hindi pa available ang Gemini/Genkit service sa build na ito.";

  const showAiLockedToast = () => {
    toast({
      title: "AI tools locked",
      description: aiLockMessage,
      variant: "destructive",
    });
  };

  const handleFertilizerCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aiLocked) {
      showAiLockedToast();
      return;
    }
    setFertLoading(true);
    setFertResult('');
    try {
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const area = Number(formData.get('fert-area') as string);
        const crop = formData.get('fert-crop') as string;
        const result = await calculateFertilizer({ area, crop });
        setFertResult(result.recommendation);
        toast({ title: 'Nakalkula na ang Pataba!', description: 'Nasa ibaba ang resulta.' });
    } catch (error) {
        console.error(error);
        toast({ title: 'Nagka-error!', description: 'Hindi nagtagumpay ang kalkulasyon.', variant: 'destructive' });
    } finally {
        setFertLoading(false);
    }
  };
  
  const handlePesticideCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aiLocked) {
      showAiLockedToast();
      return;
    }
    setPestLoading(true);
    setPestResult('');
     try {
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const area = Number(formData.get('pest-area') as string);
        const pest = formData.get('pest-name') as string;
        const result = await calculatePesticide({ area, pest });
        setPestResult(result.recommendation);
        toast({ title: 'Nakalkula na ang Pestisidyo!', description: 'Nasa ibaba ang resulta.' });
    } catch (error) {
        console.error(error);
        toast({ title: 'Nagka-error!', description: 'Hindi nagtagumpay ang kalkulasyon.', variant: 'destructive' });
    } finally {
        setPestLoading(false);
    }
  };

  const handleProfitCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aiLocked) {
      showAiLockedToast();
      return;
    }
    setProfitLoading(true);
    setProfitResult('');
    try {
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const yieldVal = Number(formData.get('profit-yield') as string);
        const price = Number(formData.get('profit-price') as string);
        const result = await calculateProfit({ yield: yieldVal, price });
        setProfitResult(result.analysis);
        toast({ title: 'Nasuri na ang Kita!', description: 'Nasa ibaba ang resulta.' });
    } catch (error) {
        console.error(error);
        toast({ title: 'Nagka-error!', description: 'Hindi nagtagumpay ang pagsusuri.', variant: 'destructive' });
    } finally {
        setProfitLoading(false);
    }
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
      if (aiLocked) {
          showAiLockedToast();
          return;
      }
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
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">AI Toolkit</h1>
            <HelpDialog title="AI Toolkit" tooltipText="Gumamit ng mga tool ng AI para sa pagsusuri.">
              <p>Ito ay isang koleksyon ng mga espesyal na tool na pinapagana ng AI upang tulungan ka sa mga karaniwang kalkulasyon at pagsusuri sa agrikultura.</p>
              <p><strong>Plant-MD:</strong> Mag-upload ng larawan ng may sakit na halaman at ilarawan ang mga sintomas. Gagamitin ng AI ang impormasyong ito upang magbigay ng diagnosis at mga hakbang sa paggamot.</p>
              <p><strong>Mga Calculator:</strong> Mabilis na kalkulahin ang mga rekomendasyon para sa pataba, pestisidyo, at tantyahin ang potensyal na kita batay sa ani at presyo sa merkado.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Mga tool para tulungan ang mga admin sa paggawa ng desisyon.</p>
      </div>

      <AiStatusBanner
        title={aiLocked ? "AI tools locked in this build" : "AI tools connected with review fallback"}
        description={
          aiLocked
            ? aiLockMessage
            : "Available ang AI service para sa diagnosis at calculator actions, pero dapat pa ring i-review ng staff ang mga resulta bago ito gamiting operational advice."
        }
      />
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                    <CardTitle className="flex items-center gap-2"><Leaf /> Plant-MD: Pagsusuri ng Halaman gamit ang AI</CardTitle>
                    <HelpDialog title="Plant-MD: Pagsusuri ng Halaman" tooltipText="Suriin ang mga sakit ng halaman gamit ang isang larawan.">
                      <p>Gamitin ang tool na ito upang makakuha ng mabilis na pagsusuri ng AI para sa mga problema sa halaman.</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Mag-upload ng Larawan:</strong> Pumili ng malinaw na larawan ng apektadong bahagi ng halaman.</li>
                        <li><strong>Ilarawan ang Sintomas:</strong> Magbigay ng mas maraming detalye hangga't maaari, tulad ng kulay ng mga batik, kung may mga insekto, atbp.</li>
                        <li><strong>Suriin:</strong> Pindutin ang button upang simulan ang pagsusuri. Ibabalik ng AI ang pangalan ng halaman, ang diagnosis, at mga rekomendasyon sa paggamot.</li>
                      </ol>
                  </HelpDialog>
                </div>
                <CardDescription>Mag-upload ng larawan ng halaman upang matukoy ang mga sakit o peste.</CardDescription>
              </div>
          </CardHeader>
          <form onSubmit={handlePlantDiagnosis}>
            <CardContent className="space-y-4">
                <HoverTooltip text="Pumili ng larawan ng halaman na may sintomas.">
                  <div className="space-y-2">
                    <Label htmlFor="plant-photo">Larawan ng Halaman</Label>
                    <div className="flex items-center gap-2">
                      <Input id="plant-photo" type="file" accept="image/*" onChange={handleImageChange} required className="h-auto p-0 file:p-2 file:mr-4 file:border-0 file:bg-muted file:rounded-sm cursor-pointer file:cursor-pointer"/>
                    </div>
                  </div>
                </HoverTooltip>
                {previewImage && <Image src={previewImage} alt="Plant preview" width={200} height={200} className="rounded-md mx-auto object-cover" />}
                <HoverTooltip text="Ilarawan ang mga nakikitang sintomas. Mas maraming detalye, mas mahusay.">
                  <div className="space-y-2">
                      <Label htmlFor="plant-description">Maikling Paglalarawan ng Sintomas</Label>
                      <Textarea id="plant-description" placeholder="hal. May mga dilaw na batik sa dahon, butas-butas ang bunga..." required/>
                  </div>
                </HoverTooltip>
                
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
                <HoverTooltip text="Simulan ang pagsusuri ng AI sa in-upload na larawan at deskripsyon.">
                  <Button className="w-full" type="submit" disabled={diagnosisLoading || aiLocked || capabilitiesLoading}>
                      {diagnosisLoading ? 'Nagsusuri...' : aiLocked ? 'AI locked muna' : 'Suriin ang Halaman'}
                  </Button>
                </HoverTooltip>
            </CardFooter>
          </form>
        </Card>
        <div className="space-y-6">
            <form onSubmit={handleFertilizerCalculation}>
            <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <CardTitle className="text-lg">Calculator ng Pataba</CardTitle>
                    <HelpDialog title="Calculator ng Pataba" tooltipText="Kalkulahin ang tamang dami ng pataba.">
                      <p>Gamitin ito para makakuha ng mabilis na rekomendasyon sa pataba na nasa Filipino.</p>
                      <p>Ilagay ang sukat ng lupa sa ektarya (hectares) at ang uri ng pananim. Ang AI ay magbibigay ng simpleng rekomendasyon batay sa mga karaniwang kasanayan.</p>
                    </HelpDialog>
                  </div>
                  <CardDescription>Kalkulahin ang tamang dami ng pataba.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <HoverTooltip text="Ilagay ang sukat ng iyong bukid sa ektarya.">
                  <div className="space-y-2">
                  <Label htmlFor="fert-area">Laki ng Lupa (ha)</Label>
                  <Input id="fert-area" name="fert-area" type="number" step="0.1" placeholder="hal. 1.5" required/>
                  </div>
                </HoverTooltip>
                <HoverTooltip text="Ilagay ang uri ng iyong pananim.">
                  <div className="space-y-2">
                  <Label htmlFor="fert-crop">Uri ng Pananim</Label>
                  <Input id="fert-crop" name="fert-crop" placeholder="hal. Palay" required/>
                  </div>
                </HoverTooltip>
                {fertLoading && <Skeleton className="h-4 w-full" />}
                {fertResult && <p className="text-sm font-medium text-primary">{fertResult}</p>}
            </CardContent>
            <CardFooter>
                <HoverTooltip text="Kalkulahin ang rekomendasyon ng pataba.">
                  <Button className="w-full" disabled={fertLoading || aiLocked || capabilitiesLoading}>{fertLoading ? 'Kinakalkula...' : aiLocked ? 'AI locked muna' : 'Kalkulahin'}</Button>
                </HoverTooltip>
            </CardFooter>
            </Card>
            </form>
            
            <form onSubmit={handlePesticideCalculation}>
            <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <CardTitle className="text-lg">Dosis ng Pestisidyo</CardTitle>
                    <HelpDialog title="Dosis ng Pestisidyo" tooltipText="Tukuyin ang tamang halo ng pestisidyo.">
                      <p>Gamitin ito para makakuha ng rekomendasyon sa tamang pag-halo ng pestisidyo.</p>
                       <p>Ilagay ang sukat ng lupa na i-ispreyan at ang pangalan ng pestisidyo. Ang AI ay magbibigay ng rekomendasyon sa Filipino, tulad ng "X ml bawat 16L na tubig".</p>
                    </HelpDialog>
                  </div>
                  <CardDescription>Tukuyin ang tamang halo ng pestisidyo.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <HoverTooltip text="Ilagay ang sukat ng lupa na i-ispreyan sa ektarya.">
                  <div className="space-y-2">
                  <Label htmlFor="pest-area">Laki ng Lupa (ha)</Label>
                  <Input id="pest-area" name="pest-area" type="number" step="0.1" placeholder="hal. 1.5" required/>
                  </div>
                </HoverTooltip>
                <HoverTooltip text="Ilagay ang pangalan ng pestisidyo na gagamitin.">
                  <div className="space-y-2">
                  <Label htmlFor="pest-name">Pestisidyo</Label>
                  <Input id="pest-name" name="pest-name" placeholder="hal. Cypermethrin" required/>
                  </div>
                </HoverTooltip>
                {pestLoading && <Skeleton className="h-4 w-full" />}
                {pestResult && <p className="text-sm font-medium text-primary">{pestResult}</p>}
            </CardContent>
            <CardFooter>
                <HoverTooltip text="Kalkulahin ang rekomendasyon sa dosis ng pestisidyo.">
                  <Button className="w-full" disabled={pestLoading || aiLocked || capabilitiesLoading}>{pestLoading ? 'Kinakalkula...' : aiLocked ? 'AI locked muna' : 'Kalkulahin'}</Button>
                </HoverTooltip>
            </CardFooter>
            </Card>
            </form>

            <form onSubmit={handleProfitCalculation}>
            <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                    <CardTitle className="text-lg">Pagsusuri sa Kita</CardTitle>
                    <HelpDialog title="Pagsusuri sa Kita" tooltipText="Tantyahin ang potensyal na kita mula sa ani.">
                      <p>Isang simpleng calculator para matantya ang potensyal na kita mula sa iyong ani.</p>
                       <p>Ilagay ang inaasahang ani sa kilo (kg) at ang kasalukuyang presyo sa merkado bawat kilo. Ang AI ay magbibigay ng isang pangungusap na pagsusuri sa Filipino, kasama ang tinatayang kita at break-even point.</p>
                    </HelpDialog>
                </div>
                <CardDescription>Tantyahin ang potensyal na kita.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <HoverTooltip text="Ilagay ang inaasahang ani sa kilo.">
                  <div className="space-y-2">
                  <Label htmlFor="profit-yield">Inaasahang Ani (kg)</Label>
                  <Input id="profit-yield" name="profit-yield" type="number" placeholder="hal. 5000" required/>
                  </div>
                </HoverTooltip>
                <HoverTooltip text="Ilagay ang kasalukuyang presyo sa merkado bawat kilo.">
                  <div className="space-y-2">
                  <Label htmlFor="profit-price">Presyo sa Merkado (bawat kg)</Label>
                  <Input id="profit-price" name="profit-price" type="number" placeholder="hal. 19" required/>
                  </div>
                </HoverTooltip>
                {profitLoading && <Skeleton className="h-4 w-full" />}
                {profitResult && <p className="text-sm font-medium text-primary">{profitResult}</p>}
            </CardContent>
            <CardFooter>
                <HoverTooltip text="Kalkulahin ang tinatayang kita.">
                  <Button className="w-full" disabled={profitLoading || aiLocked || capabilitiesLoading}>{profitLoading ? 'Kinakalkula...' : aiLocked ? 'AI locked muna' : 'Kalkulahin'}</Button>
                </HoverTooltip>
            </CardFooter>
            </Card>
            </form>
        </div>
      </div>
    </div>
  );
}
