'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BrainCircuit } from "lucide-react";


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

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Pagsasanay at Feedback para sa AEW</h1>
        <p className="text-muted-foreground">Mga mapagkukunan para sa pagpapabuti ng kasanayan at paghubog sa talino ng AI.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
            <Card key={module.title}>
                <CardHeader>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button>Simulan ang Modyul</Button>
                </CardContent>
            </Card>
        ))}
      </div>

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
