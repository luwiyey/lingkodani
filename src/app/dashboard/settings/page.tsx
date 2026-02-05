import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mga Setting</h1>
        <p className="text-muted-foreground">Pamahalaan ang iyong account at mga setting ng application.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Malapit na</CardTitle>
          <CardDescription>
            Ang seksyon na ito ay kasalukuyang ginagawa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Ang pamamahala ng profile ng gumagamit, mga kagustuhan sa notification, at iba pang mga setting ng application ay magiging available dito sa isang update sa hinaharap.</p>
        </CardContent>
      </Card>
    </div>
  );
}
