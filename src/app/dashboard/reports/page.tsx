

import { File, Filter, Upload, Download, ArrowDownToLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueTrendsChart } from '@/components/reports/issue-trends-chart';
import { SmsVolumeChart } from '@/components/reports/sms-volume-chart';
import { AdviceSuccessChart } from '@/components/reports/advice-success-chart';
import { CropStageChart } from '@/components/reports/crop-stage-chart';
import { TopKeywordsChart } from '@/components/reports/top-keywords-chart';
import { LanguageUsageChart } from '@/components/reports/language-usage-chart';
import { SmsPeakHoursChart } from '@/components/reports/sms-peak-hours-chart';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Mga Ulat at Pagsusuri</h1>
          <p className="text-muted-foreground">I-visualize ang mga trend, suriin ang data, at makakuha ng mga insight para sa paggawa ng desisyon.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Salain ayon sa Petsa
            </Button>
            <Button>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                I-export sa CSV
            </Button>
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <SmsVolumeChart />
          <AdviceSuccessChart />
          <CropStageChart />
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <TopKeywordsChart />
        <LanguageUsageChart />
        <SmsPeakHoursChart />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <IssueTrendsChart />
        <Card>
            <CardHeader>
                <CardTitle>Lingguhang Buod ng AI</CardTitle>
                <CardDescription>Mga insight na binuo ng AI mula sa data ngayong linggo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                    <p>Nakita ngayong linggo ang <strong>25% pagtaas</strong> sa mga ulat na may kaugnayan sa <strong className="text-foreground">mga peste</strong>, partikular na ang mga stem borer sa tubo at leafminer sa kamatis.</p>
                    <p>Nanatiling matatag ang mga alalahanin sa patubig, habang bumaba ang mga kahilingan para sa payo pagkatapos ng ani para sa palay, na nagpapahiwatig ng pagtatapos ng panahon ng pag-aani para sa marami.</p>
                    <p><strong>Rekomendasyon:</strong> Isaalang-alang ang paglabas ng isang artikulo sa knowledge base tungkol sa organikong pagkontrol ng peste para sa mga karaniwang gulay.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
