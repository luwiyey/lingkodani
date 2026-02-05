

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mga Setting</h1>
        <p className="text-muted-foreground">Pamahalaan ang iyong account at mga setting ng application.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Pamahalaan ang iyong mga setting ng profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Malapit nang maging available dito ang pamamahala ng profile ng gumagamit.</p>
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
