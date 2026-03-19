
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquareQuote } from "lucide-react";
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import React from 'react';

const modules = [
  { title: "Pagsusuri ng Kaso: Pag-atake ng Leaf Blight", description: "Suriin ang isang tunay na kaso at ang inirekomendang tugon ng AI." },
  { title: "Pag-unawa sa mga Pattern ng Wika sa SMS", description: "Alamin kung paano mas mahusay na bigyang-kahulugan ang mga karaniwang parirala ng magsasaka." },
  { title: "Pagbibigay ng Feedback sa Pagtutuwid ng AI", description: "Paano itama ang mga mungkahi ng AI upang mapabuti ang sistema sa paglipas ng panahon." },
];

export default function TrainingPage() {
    const { toast } = useToast();

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: 'Salamat sa iyong Feedback!',
            description: 'Natanggap na namin ang iyong isinumite. Gagamitin ito para mapabuti ang performance ng AI sa hinaharap.'
        });
        (e.target as HTMLFormElement).reset();
    };
    
    const handleStartModule = (title: string) => {
        toast({
            title: "Modyul Paparating na!",
            description: `Ang training module na "${title}" ay kasalukuyang ginagawa.`,
        });
    };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Pagsasanay at Feedback para sa AEW</h1>
            <HelpDialog title="Pagsasanay at Feedback" tooltipText="Pagbutihin ang kasanayan at turuan ang AI.">
                <p>Ang pahinang ito ay idinisenyo para sa mga Agricultural Extension Workers (AEWs) upang mapabuti ang kanilang mga kasanayan at, higit sa lahat, magbigay ng feedback para "turuan" ang AI.</p>
                <p><strong>Mga Modyul sa Pagsasanay:</strong> Ito ay mga interactive na aralin na tumutulong sa mga AEW na mas maunawaan ang sistema at ang mga karaniwang kaso na kanilang hinaharap. Ang bawat modyul ay naglalaman ng mga pagsusulit o mga simulation ng totoong sitwasyon.</p>
                <p><strong>Feedback sa AI:</strong> Ito ang pinakamahalagang bahagi ng pagpapabuti ng sistema. Dito mo maaaring direktang turuan ang AI sa pamamagitan ng pagbibigay ng mga tamang halimbawa. Kapag nagbigay ka ng feedback, natututo ang AI mula sa iyong input at nagiging mas mahusay sa pag-unawa sa mga lokal na diyalekto, terminolohiya, at konteksto.</p>
                <p><strong>Paano Magbigay ng Feedback:</strong></p>
                 <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Halimbawang SMS:</strong> Maglagay ng isang aktwal na SMS mula sa isang magsasaka na sa tingin mo ay mahirap o mali ang interpretasyon ng AI. Halimbawa, isang mensahe na may halo-halong diyalekto.</li>
                    <li><strong>Tamang Interpretasyon:</strong> Isulat kung ano talaga ang ibig sabihin ng magsasaka. Ano ang kanyang tunay na layunin?</li>
                    <li><strong>Perpektong Tugon:</strong> Isulat ang pinakamahusay na posibleng tugon sa SMS na iyon. Ito ang magiging "gold standard" na matututunan ng AI.</li>
                    <li><strong>Isumite:</strong> Pindutin ang button upang ipadala ang iyong feedback. Ang data na ito ay gagamitin sa susunod na pag-update ng AI model.</li>
                </ol>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Mga mapagkukunan para sa pagpapabuti ng kasanayan at paghubog sa talino ng AI.</p>
      </div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
            <Card key={module.title}>
                <CardHeader className="flex-row items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                          <CardTitle>{module.title}</CardTitle>
                          <HelpDialog title={module.title} tooltipText="Alamin ang tungkol sa modyul ng pagsasanay na ito.">
                            <p>{module.description}</p>
                            <p>Ang pag-click sa "Simulan ang Modyul" ay magbubukas ng isang interactive na aralin para sa pagsasanay na ito, na maaaring may kasamang mga tanong at mga halimbawa ng totoong sitwasyon.</p>
                          </HelpDialog>
                      </div>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <HoverTooltip text="Simulan ang interactive na aralin na ito.">
                        <Button onClick={() => handleStartModule(module.title)}>Simulan ang Modyul</Button>
                    </HoverTooltip>
                </CardContent>
            </Card>
        ))}
      </div>

       <Card>
        <CardHeader className="flex-row items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <CardTitle className="flex items-center gap-2"><MessageSquareQuote /> Feedback sa AI</CardTitle>
                <HelpDialog title="Paano Magbigay ng Feedback sa AI" tooltipText="Alamin ang mga hakbang sa pagbibigay ng feedback sa AI.">
                    <p>Ito ay isang paraan para direktang turuan ang AI. Sundin ang mga hakbang na ito:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Halimbawang SMS:</strong> Maglagay ng isang aktwal na SMS mula sa isang magsasaka na sa tingin mo ay mahirap o mali ang interpretasyon ng AI. Halimbawa, isang mensahe na may halo-halong diyalekto.</li>
                        <li><strong>Tamang Interpretasyon:</strong> Isulat kung ano talaga ang ibig sabihin ng magsasaka. Ano ang kanyang tunay na layunin?</li>
                        <li><strong>Perpektong Tugon:</strong> Isulat ang pinakamahusay na posibleng tugon sa SMS na iyon. Ito ang magiging "gold standard" na matututunan ng AI.</li>
                        <li><strong>Isumite:</strong> Pindutin ang button upang ipadala ang iyong feedback. Ang data na ito ay gagamitin sa susunod na pag-update ng AI model.</li>
                    </ol>
                </HelpDialog>
              </div>
              <CardDescription>Turuan ang AI sa pamamagitan ng pagbibigay ng mga tamang halimbawa. Ito ay makakatulong sa AI na mas maunawaan ang mga lokal na wika at konteksto.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                <HoverTooltip text="Maglagay ng halimbawa ng SMS mula sa isang magsasaka.">
                    <div className="space-y-2">
                        <Label htmlFor="feedback-sms">Halimbawang SMS ng Magsasaka</Label>
                        <Textarea id="feedback-sms" placeholder="hal. 'Agbunga ti mais kon, ngem adda uleg idiay.' (Ilocano)" required rows={3}/>
                    </div>
                </HoverTooltip>
                <HoverTooltip text="Isulat dito ang tamang kahulugan o layunin ng SMS.">
                    <div className="space-y-2">
                        <Label htmlFor="feedback-intent">Ano ang tamang interpretasyon/layunin nito?</Label>
                        <Input id="feedback-intent" placeholder="hal. Ulat ng Ani na may Panganib sa Kaligtasan" required/>
                    </div>
                </HoverTooltip>
                <HoverTooltip text="Isulat dito ang pinakamahusay na tugon para sa SMS.">
                    <div className="space-y-2">
                        <Label htmlFor="feedback-reply">Ano ang dapat na perpektong tugon sa SMS na ito?</Label>
                        <Textarea id="feedback-reply" placeholder="hal. 'Congrats sa iyong ani! Mag-ingat po sa ahas. Huwag po munang pumasok sa lugar. Makikipag-ugnayan kami para sa tulong.'" required rows={3} />
                    </div>
                </HoverTooltip>
                <HoverTooltip text="Ipadala ang iyong halimbawa upang makatulong sa pagsasanay ng AI.">
                    <Button type="submit">Isumite ang Feedback</Button>
                </HoverTooltip>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
