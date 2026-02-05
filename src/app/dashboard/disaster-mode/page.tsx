'use client';

import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, ShieldAlert, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DisasterModePage() {
    const { toast } = useToast();

    const handleBroadcast = () => {
        toast({
            title: "Nagpapadala ng Broadcast...",
            description: "Ipinapadala ang emergency message sa lahat ng nakarehistrong magsasaka.",
            variant: "destructive",
        });
    };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-destructive text-destructive-foreground animate-pulse">
            <AlertTriangle className="h-8 w-8" />
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">DISASTER MODE ACTIVATED</h1>
                <p>Nakatutok ang system sa mga emergency response. Limitado ang ibang mga feature.</p>
            </div>
            <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone /> Magpadala ng Emergency Broadcast
                    </CardTitle>
                    <CardDescription>Magpadala ng agarang SMS alert sa lahat ng magsasaka.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Hal: BAHA ALERT: Agad na lumikas sa mas mataas na lugar. Manatiling nakatutok para sa mga update."
                        className="min-h-[120px] bg-background"
                    />
                    <Button variant="destructive" className="w-full" onClick={handleBroadcast}>
                        IPADALA NGAYON
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert /> Mga Priority Alert
                    </CardTitle>
                    <CardDescription>Mga awtomatikong nabuong alerto batay sa mga ulat at data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Ang seksyon ng mga alerto ay ipapakita dito para sa mabilis na pag-access sa panahon ng emergency.</p>
                </CardContent>
            </Card>
        </div>
        
        <SmsFeedPreview />

    </div>
  );
}
