
'use client';

import { useState } from 'react';
import { SmsFeedPreview } from "@/components/dashboard/sms-feed-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResourceStatus } from "@/components/dashboard/resource-status";
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function DisasterModePage() {
    const { toast } = useToast();
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleBroadcastClick = () => {
        if (!broadcastMessage.trim()) {
            toast({
                title: "Walang Mensahe",
                description: "Mangyaring magsulat ng mensahe bago ipadala.",
                variant: "destructive",
            });
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirmBroadcast = () => {
        toast({
            title: "Nagpapadala ng Broadcast...",
            description: "Ipinapadala ang emergency message sa lahat ng nakarehistrong magsasaka.",
        });
        setShowConfirmDialog(false);
        setBroadcastMessage(''); // Clear textarea
    };

  return (
    <>
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-destructive text-destructive-foreground animate-pulse">
            <AlertTriangle className="h-8 w-8" />
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">DISASTER MODE ACTIVATED</h1>
                <p>Nakatutok ang system sa mga emergency response. Limitado ang ibang mga feature.</p>
            </div>
            <AlertTriangle className="h-8 w-8" />
        </div>

        <Card className="border-destructive">
            <CardHeader className="flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                      <CardTitle className="flex items-center gap-2">
                          <Megaphone /> Magpadala ng Emergency Broadcast
                      </CardTitle>
                      <HelpDialog title="Emergency Broadcast">
                          <p>Ito ay isang napakahalagang tool para sa mabilis na pagpapakalat ng impormasyon sa panahon ng emerhensiya. Gamitin ang feature na ito upang magpadala ng agarang SMS alert sa LAHAT ng nakarehistrong magsasaka sa iyong barangay.</p>
                          <p><strong>Paano Gamitin:</strong></p>
                          <ul className="list-disc pl-5 space-y-1">
                              <li><strong>Isulat ang Mensahe:</strong> I-type ang iyong maikli at malinaw na alerto sa text box. Siguraduhing madaling maintindihan ang mga tagubilin. Halimbawa: "BAHA ALERT: Agad na lumikas sa mas mataas na lugar. Manatiling nakatutok para sa mga update."</li>
                              <li><strong>Ipadala:</strong> Pindutin ang "IPADALA NGAYON" na button. Ang mensahe ay agad na ipapadala sa lahat ng numero sa database.</li>
                          </ul>
                          <p className="font-bold mt-2">Mag-ingat: Gamitin lamang ang feature na ito para sa mga tunay at kumpirmadong emerhensiya upang maiwasan ang hindi kinakailangang pagka-alarma.</p>
                      </HelpDialog>
                  </div>
                  <CardDescription>Magpadala ng agarang SMS alert sa lahat ng magsasaka.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <HoverTooltip text="Isulat dito ang iyong emergency na mensahe. Siguraduhing ito ay malinaw at madaling maintindihan.">
                    <Textarea 
                        placeholder="Hal: BAHA ALERT: Agad na lumikas sa mas mataas na lugar. Manatiling nakatutok para sa mga update."
                        className="min-h-[120px] bg-background"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                </HoverTooltip>
                <HoverTooltip text="Ipadala ang alerto sa lahat ng magsasaka ngayon din.">
                    <Button variant="destructive" className="w-full" onClick={handleBroadcastClick}>
                        IPADALA NGAYON
                    </Button>
                </HoverTooltip>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SmsFeedPreview feedHref="/dashboard/disaster/sms" />
            <ResourceStatus manageHref="/dashboard/disaster/inventory" />
        </div>

    </div>
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Kumpirmahin ang Emergency Broadcast</AlertDialogTitle>
                <AlertDialogDescription>
                    Sigurado ka bang nais mong ipadala ang mensaheng ito sa LAHAT ng nakarehistrong magsasaka? Ang aksyon na ito ay hindi na maaaring bawiin.
                    <p className="mt-4 p-2 bg-muted rounded-md text-muted-foreground">"{broadcastMessage}"</p>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmBroadcast} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Oo, Ipadala
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
