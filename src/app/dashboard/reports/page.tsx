
'use client';
import { useState } from 'react';
import { Bot, Calendar as CalendarIcon, Download, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';

// Chart Imports
import { IssueTrendsChart } from '@/components/reports/issue-trends-chart';
import { SmsVolumeChart } from '@/components/reports/sms-volume-chart';
import { AdviceSuccessChart } from '@/components/reports/advice-success-chart';
import { CropStageChart } from '@/components/reports/crop-stage-chart';
import { TopKeywordsChart } from '@/components/reports/top-keywords-chart';
import { LanguageUsageChart } from '@/components/reports/language-usage-chart';
import { SmsPeakHoursChart } from '@/components/reports/sms-peak-hours-chart';
import { InterventionSupportChart } from '@/components/reports/intervention-support-chart';
import { ValidationQueueChart } from '@/components/reports/validation-queue-chart';
import { AdvisoryDeliveryChart } from '@/components/reports/advisory-delivery-chart';
import { FollowUpRateChart } from '@/components/reports/follow-up-rate-chart';
import { AIConfidenceTrendChart } from '@/components/reports/ai-confidence-trend-chart';
import { CorrectionLogChart } from '@/components/reports/correction-log-chart';
import { AIAgreementChart } from '@/components/reports/ai-agreement-chart';
import { HighRiskKeywordChart } from '@/components/reports/high-risk-keyword-chart';
import { OutbreakAlertChart } from '@/components/reports/outbreak-alert-chart';
import { SeverityIndexChart } from '@/components/reports/severity-index-chart';
import { RecommendationTypeChart } from '@/components/reports/recommendation-type-chart';
import { MessageLengthChart } from '@/components/reports/message-length-chart';
import { ClarificationNeededChart } from '@/components/reports/clarification-needed-chart';
import { TopInquiriesChart } from '@/components/reports/top-inquiries-chart';
import { SeasonalTrendChart } from '@/components/reports/seasonal-trend-chart';
import { FarmerEngagementChart } from '@/components/reports/farmer-engagement-chart';
import { GeographicHotspotChart } from '@/components/reports/geographic-hotspot-chart';
import { SmsDeliveryStatusChart } from '@/components/reports/sms-delivery-status-chart';
import { MessageToneChart } from '@/components/reports/message-tone-chart';
import { ResponseTimeChart } from '@/components/reports/response-time-chart';


export default function ReportsPage() {
    const [timeframe, setTimeframe] = useState('Lingguhan');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Mga Ulat at Pagsusuri</h1>
            <HelpDialog title="Mga Ulat at Pagsusuri">
                <p>Ang pahinang ito ay ang iyong sentro para sa pagsusuri ng data. Dito mo makikita ang mga visual na representasyon ng mga trend at pattern na nangyayari sa iyong barangay.</p>
                <p><strong>Buod ng AI:</strong> Isang mabilis na buod na binuo ng AI batay sa pinakabagong data. Magpalit ng timeframe (lingguhan, buwanan, atbp.) upang makita ang mga insight para sa iba't ibang panahon.</p>
                <p><strong>Mga Tab:</strong> Ang mga ulat ay naka-grupo sa tatlong kategorya: Pagsusuri ng SMS, Performance ng AI, at Operasyon. Bawat tab ay naglalaman ng mga kaugnay na chart.</p>
                <p><strong>Mga Chart:</strong> Bawat card ay isang chart. Maaari mong i-click ang expand button (parang box) sa kanang itaas ng bawat card upang makita ang mas malaki at mas detalyadong view ng chart, kasama ang isang mas malalim na pagsusuri at rekomendasyon.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">I-visualize ang mga trend, suriin ang data, at makakuha ng mga insight para sa paggawa ng desisyon.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <HoverTooltip text="I-download ang buod ng ulat sa AI bilang PDF.">
            <Button>
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                I-export ang Buod
            </Button>
          </HoverTooltip>
        </div>
      </div>
      
       <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center">
                            <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Buod ng AI</CardTitle>
                            <HelpDialog title="Buod ng AI">
                                <p>Ito ay isang awtomatikong buod na binuo ng artificial intelligence. Sinusuri nito ang lahat ng data para sa napiling timeframe at nagbibigay ng mga pangunahing insight at rekomendasyon.</p>
                                <p>Halimbawa, kung tumaas ang mga ulat ng peste, sasabihin ito ng AI at magmumungkahi ng posibleng aksyon. Ito ay idinisenyo upang makatipid ka ng oras sa pagsusuri ng data.</p>
                            </HelpDialog>
                        </div>
                        <CardDescription>Mga awtomatikong nabuong insight. Huling update: 7:00 PM.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <HoverTooltip text="Baguhin ang sakop na oras para sa buod at mga ulat.">
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {timeframe}
                            </Button>
                          </HoverTooltip>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setTimeframe('Ngayong Araw')}>Ngayong Araw</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Quarterly')}>Quarterly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Taunan')}>Taunan</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Ngayong linggo, nakita ang <strong>25% pagtaas</strong> sa mga ulat na may kaugnayan sa <strong className="text-foreground">mga peste</strong>, partikular ang mga stem borer sa tubo at leafminer sa kamatis.</p>
                    <p>Ang mga alalahanin sa patubig ay nanatiling matatag, habang bumaba ang mga kahilingan para sa payo pagkatapos ng ani para sa palay, na nagpapahiwatig ng pagtatapos ng panahon ng pag-aani para sa marami. Ang Zone 3 ay nagpapakita ng pinakamataas na bilang ng mga ulat ng sakit.</p>
                    <p><strong>Rekomendasyon:</strong> Isaalang-alang ang paglabas ng isang artikulo sa knowledge base tungkol sa organikong pagkontrol ng peste para sa mga karaniwang gulay at mag-iskedyul ng pagbisita ng AEW sa Zone 3.</p>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="sms" className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Pagsusuri ng SMS</TabsTrigger>
                <TabsTrigger value="ai" className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Performance ng AI</TabsTrigger>
                <TabsTrigger value="operations" className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Operasyon at Pakikilahok</TabsTrigger>
            </TabsList>
            <TabsContent value="sms" className="mt-6">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <SmsVolumeChart />
                    <SmsPeakHoursChart />
                    <MessageToneChart />
                    <LanguageUsageChart />
                    <MessageLengthChart />
                    <TopKeywordsChart />
                    <TopInquiriesChart />
                    <HighRiskKeywordChart />
                    <GeographicHotspotChart />
                    <SeasonalTrendChart />
                    <OutbreakAlertChart />
                    <SeverityIndexChart />
                    <SmsDeliveryStatusChart />
                </div>
            </TabsContent>
            <TabsContent value="ai" className="mt-6">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <AdviceSuccessChart />
                    <AIAgreementChart />
                    <AIConfidenceTrendChart />
                    <ClarificationNeededChart />
                    <CorrectionLogChart />
                    <RecommendationTypeChart />
                </div>
            </TabsContent>
            <TabsContent value="operations" className="mt-6">
                 <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <IssueTrendsChart />
                    <CropStageChart />
                    <InterventionSupportChart />
                    <ValidationQueueChart />
                    <AdvisoryDeliveryChart />
                    <FollowUpRateChart />
                    <FarmerEngagementChart />
                    <ResponseTimeChart />
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
