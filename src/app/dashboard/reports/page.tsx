import { File, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueTrendsChart } from '@/components/reports/issue-trends-chart';
import { SmsVolumeChart } from '@/components/reports/sms-volume-chart';
import { AdviceSuccessChart } from '@/components/reports/advice-success-chart';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Mga Ulat at Analitika</h1>
          <p className="text-muted-foreground">I-visualize ang mga trend, suriin ang data, at makakuha ng mga insight.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Salain ayon sa Petsa
            </Button>
            <Button>
                <File className="mr-2 h-4 w-4" />
                I-export
            </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SmsVolumeChart />
          <AdviceSuccessChart />
          <Card>
            <CardHeader>
                <CardTitle>Lingguhang Buod ng AI</CardTitle>
                <CardDescription>Mga insight na binuo ng AI mula sa data ngayong linggo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Nakita ngayong linggo ang <strong>25% pagtaas</strong> sa mga ulat na may kaugnayan sa <strong className="text-foreground">mga peste</strong>, partikular na ang mga stem borer sa tubo at dilaw na batik sa kamatis.</p>
                    <p>Nanatiling matatag ang mga alalahanin sa patubig, habang bumaba ang mga kahilingan para sa payo pagkatapos ng ani para sa palay, na nagpapahiwatig ng pagtatapos ng panahon ng pag-aani para sa marami.</p>
                    <p><strong>Rekomendasyon:</strong> Isaalang-alang ang paglabas ng isang artikulo sa knowledge base tungkol sa organikong pagkontrol ng peste para sa mga karaniwang gulay.</p>
                </div>
            </CardContent>
          </Card>
      </div>
      <div className="grid grid-cols-1">
        <IssueTrendsChart />
      </div>
    </div>
  );
}
