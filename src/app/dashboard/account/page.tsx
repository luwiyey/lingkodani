'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";

export default function AccountSettingsPage() {

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Mga Setting ng Account</h1>
            <p className="text-muted-foreground">Pamahalaan ang iyong profile at mga setting ng privacy.</p>
        </div>
        <HelpDialog title="Mga Setting ng Account">
            <p>Dito mo maaaring i-update ang iyong personal na impormasyon tulad ng iyong pangalan. Ang iyong email ay read-only at hindi maaaring baguhin.</p>
            <p>Ang seksyon ng Data Privacy ay nagbibigay ng impormasyon tungkol sa kung paano pinoprotektahan ng sistema ang data ng mga magsasaka, alinsunod sa mga batas ng Pilipinas.</p>
        </HelpDialog>
      </div>


       <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Pamahalaan ang iyong mga personal na setting.
            </CardDescription>
          </div>
           <HelpDialog title="Profile">
                <p>I-update ang iyong display name dito. Tandaan na ang iyong email address ay hindi maaaring palitan.</p>
                <p><strong>Pangalan:</strong> Ito ang pangalan na makikita ng ibang mga user sa sistema.</p>
                <p><strong>Email:</strong> Ito ang iyong login email at hindi maaaring baguhin.</p>
                <p><strong>I-update ang Profile:</strong> Pindutin ito upang i-save ang mga pagbabago sa iyong pangalan.</p>
            </HelpDialog>
        </CardHeader>
        <CardContent className="space-y-4">
            <HoverTooltip text="I-edit ang iyong display name.">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Pangalan</Label>
                    <Input id="displayName" defaultValue="Brgy Admin" />
                </div>
            </HoverTooltip>
            <HoverTooltip text="Ang iyong email address ay hindi maaaring baguhin.">
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="brgy-admin@lingkodani.gov.ph" readOnly />
                </div>
            </HoverTooltip>
            <HoverTooltip text="I-save ang mga pagbabago sa iyong pangalan.">
                 <Button>I-update ang Profile</Button>
            </HoverTooltip>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Mga Pananggalang sa Privacy ng Data</CardTitle>
            <CardDescription>
              Mga setting na may kaugnayan sa privacy at proteksyon ng data ng magsasaka.
            </CardDescription>
          </div>
            <HelpDialog title="Privacy ng Data">
                <p>Ang sistemang ito ay idinisenyo upang sumunod sa Data Privacy Act of 2012 ng Pilipinas.</p>
                <p>Kabilang sa mga feature na ipapatupad sa hinaharap ang:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Pag-mask ng Numero ng Telepono:</strong> Itatago ang mga numero ng telepono ng magsasaka mula sa mga hindi awtorisadong user.</li>
                    <li><strong>Pag-tag ng Pahintulot:</strong> Itatala kung aling mga magsasaka ang nagbigay ng pahintulot para sa pagproseso ng kanilang data.</li>
                    <li><strong>Awtomatikong Pagtanggal:</strong> Mga panuntunan para sa awtomatikong pagtanggal ng lumang data upang mapanatili lamang ang kinakailangang impormasyon.</li>
                </ul>
            </HelpDialog>
        </CardHeader>
        <CardContent>
          <p>Ang mga feature tulad ng pag-mask ng numero ng telepono, pag-tag ng pahintulot, at mga panuntunan sa awtomatikong pagtanggal ay ipapatupad upang sumunod sa mga batas sa privacy ng data ng Pilipinas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
