
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const photoUploadRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUploadClick = () => {
    photoUploadRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        toast({
            title: "Nai-upload na ang Larawan!",
            description: `Ang file na "${e.target.files[0].name}" ay matagumpay na na-upload.`,
        });
        // In a real app, you would handle the file upload process here
        // and update the avatar source.
    }
  };


  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tagumpay!",
      description: "Nai-save na ang iyong bagong password.",
    });
  }
  
  const handleChangeEmail = () => {
      toast({
          title: "Kahilingan Ipinadala",
          description: "Isang verification link ang ipinadala sa iyong bagong email address.",
      })
  }

  return (
    <div className="flex flex-col gap-8">
      <Input type="file" ref={photoUploadRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
      <div className="space-y-1">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Mga Setting ng Account</h1>
            <HelpDialog title="Mga Setting ng Account">
                <p>Dito mo maaaring i-update ang iyong profile picture at mga setting ng seguridad. Ang iyong pangalan at email ay naka-lock at hindi maaaring baguhin nang direkta para sa mga kadahilanang pang-seguridad.</p>
                <p><strong>Profile:</strong> I-update ang iyong larawan at tingnan ang iyong personal na impormasyon.</p>
                <p><strong>Pag-login at Seguridad:</strong> Baguhin ang iyong password o humiling na palitan ang iyong email address.</p>
                <p><strong>Mga Pananggalang sa Privacy ng Data:</strong> Alamin ang tungkol sa mga feature ng privacy ng system.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Pamahalaan ang iyong profile, seguridad, at mga setting ng privacy.</p>
      </div>

       <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
                <CardTitle>Profile</CardTitle>
                <HelpDialog title="Profile">
                    <p>Dito mo maaaring i-update ang iyong profile picture. Ang iyong pangalan at email ay naka-lock para sa mga layuning pang-seguridad.</p>
                    <p><strong>Mag-upload ng Larawan:</strong> Pindutin ito upang pumili ng bagong larawan mula sa iyong computer.</p>
                </HelpDialog>
            </div>
            <CardDescription>
              Pamahalaan ang iyong personal na impormasyon at larawan.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <HoverTooltip text="Ito ang iyong kasalukuyang larawan sa profile.">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src="https://picsum.photos/seed/admin/200/200" alt="Admin" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                </HoverTooltip>
                <HoverTooltip text="Pumili ng bagong larawan mula sa iyong device.">
                    <Button variant="outline" onClick={handlePhotoUploadClick}>Mag-upload ng Bagong Larawan</Button>
                </HoverTooltip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HoverTooltip text="Ang iyong display name ay naka-lock at hindi maaaring baguhin.">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Pangalan</Label>
                        <Input id="displayName" defaultValue="Brgy Admin" readOnly />
                    </div>
                </HoverTooltip>
                <HoverTooltip text="Ang iyong email address ay hindi maaaring baguhin nang direkta. Gamitin ang seksyon ng seguridad upang humiling ng pagbabago.">
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="brgy-admin@lingkodani.gov.ph" readOnly />
                    </div>
                </HoverTooltip>
            </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <div className="flex items-center">
            <CardTitle>Pag-login at Seguridad</CardTitle>
             <HelpDialog title="Pag-login at Seguridad">
                <p>Panatilihing secure ang iyong account.</p>
                <p><strong>Baguhin ang Password:</strong> Regular na palitan ang iyong password para mapanatiling ligtas ang iyong account. Ilagay ang iyong kasalukuyan at bagong password.</p>
                <p><strong>Baguhin ang Email:</strong> Kung kailangan mong i-update ang iyong email, pindutin ang button na ito. Isang email ng kumpirmasyon ang ipapadala sa iyong bagong address.</p>
             </HelpDialog>
          </div>
          <CardDescription>I-update ang iyong password at pamahalaan ang iyong email sa pag-login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <h3 className="font-semibold text-lg">Baguhin ang Password</h3>
              <HoverTooltip text="Ilagay ang iyong kasalukuyang password.">
                  <div className="space-y-2">
                      <Label htmlFor="current-password">Kasalukuyang Password</Label>
                      <Input id="current-password" type="password" required />
                  </div>
              </HoverTooltip>
              <HoverTooltip text="Ilagay ang iyong nais na bagong password.">
                  <div className="space-y-2">
                      <Label htmlFor="new-password">Bagong Password</Label>
                      <Input id="new-password" type="password" required />
                  </div>
              </HoverTooltip>
               <HoverTooltip text="Kumpirmahin ang iyong bagong password.">
                   <div className="space-y-2">
                      <Label htmlFor="confirm-password">Kumpirmahin ang Bagong Password</Label>
                      <Input id="confirm-password" type="password" required />
                  </div>
              </HoverTooltip>
              <HoverTooltip text="I-save ang mga pagbabago sa iyong password.">
                  <Button type="submit">I-save ang Bagong Password</Button>
              </HoverTooltip>
            </form>

            <Separator />

            <div className="space-y-4 max-w-sm">
              <h3 className="font-semibold text-lg">Baguhin ang Email Address</h3>
              <div className="space-y-2">
                <Label>Kasalukuyang Email</Label>
                 <Input id="current-email" type="email" defaultValue="brgy-admin@lingkodani.gov.ph" readOnly />
              </div>
               <div className="space-y-2">
                <Label>Bagong Email Address</Label>
                <Input id="new-email" type="email" placeholder="ilagay ang iyong bagong email address" />
              </div>
              <HoverTooltip text="Simulan ang proseso ng pagbabago ng iyong email address.">
                  <Button onClick={handleChangeEmail}>Baguhin ang Email</Button>
              </HoverTooltip>
              <p className="text-xs text-muted-foreground pt-2">Ang pag-click sa "Baguhin ang Email" ay magpapadala ng link sa pag-verify sa iyong bagong email address.</p>
            </div>
        </CardContent>
       </Card>
      
       <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
                <CardTitle>Mga Pananggalang sa Privacy ng Data</CardTitle>
                <HelpDialog title="Privacy ng Data">
                    <p>Ang sistemang ito ay idinisenyo upang sumunod sa Data Privacy Act of 2012 ng Pilipinas.</p>
                    <p>Kabilang sa mga feature na ipapatupad sa hinaharap ang:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Pag-mask ng Numero ng Telepono:</strong> Itatago ang mga numero ng telepono ng magsasaka mula sa mga hindi awtorisadong user.</li>
                        <li><strong>Pag-tag ng Pahintulot:</strong> Itatala kung aling mga magsasaka ang nagbigay ng pahintulot para sa pagproseso ng kanilang data.</li>
                        <li><strong>Awtomatikong Pagtanggal:</strong> Mga panuntunan para sa awtomatikong pagtanggal ng lumang data upang mapanatili lamang ang kinakailangang impormasyon.</li>
                    </ul>
                </HelpDialog>
            </div>
            <CardDescription>
              Mga setting na may kaugnayan sa privacy at proteksyon ng data ng magsasaka.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p>Ang mga feature tulad ng pag-mask ng numero ng telepono, pag-tag ng pahintulot, at mga panuntunan sa awtomatikong pagtanggal ay ipapatupad upang sumunod sa mga batas sa privacy ng data ng Pilipinas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
