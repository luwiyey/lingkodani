'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountSettingsPage() {

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mga Setting ng Account</h1>
        <p className="text-muted-foreground">Pamahalaan ang iyong profile at mga setting ng privacy.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Pamahalaan ang iyong mga personal na setting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="displayName">Pangalan</Label>
                <Input id="displayName" defaultValue="Brgy Admin" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="brgy-admin@lingkodani.gov.ph" readOnly />
            </div>
             <Button>I-update ang Profile</Button>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Mga Pananggalang sa Privacy ng Data</CardTitle>
          <CardDescription>
            Mga setting na may kaugnayan sa privacy at proteksyon ng data ng magsasaka.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Ang mga feature tulad ng pag-mask ng numero ng telepono, pag-tag ng pahintulot, at mga panuntunan sa awtomatikong pagtanggal ay ipapatupad upang sumunod sa mga batas sa privacy ng data ng Pilipinas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
