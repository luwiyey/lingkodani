
'use client';
import { Bot, Calendar as CalendarIcon, Download, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import { ReportsTimeframeProvider, useReportsTimeframe } from '@/context/reports-timeframe-context';

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


function ReportsPageContent() {
    const { timeframe, setTimeframe } = useReportsTimeframe();
    const { toast } = useToast();
    const {
      topKeywordsData,
      geographicHotspotData,
      riskAlerts,
      liveContextUpdatedAt,
      highRiskCount,
      completedFieldVisits,
      scheduledFieldVisits,
      completedAssistance,
      openAssistance,
      totalAlertBroadcasts,
      broadcastRecipients,
      failedBroadcastRecipients,
      trackedMarketPrices,
      stalePriceCount,
    } = useAnalytics();
    const topKeyword = topKeywordsData[0];
    const topHotspot = geographicHotspotData[0];
    const liveSyncLabel = `${liveContextUpdatedAt.slice(0, 19).replace('T', ' ')} UTC`;

    const handleExportSummary = () => {
        const summaryLines = [
          `Lingkod-Ani Report Summary`,
          `Timeframe: ${timeframe}`,
          `Live Context Updated At: ${liveContextUpdatedAt}`,
          ``,
          `High-priority SMS: ${highRiskCount}`,
          `Risk alerts: ${riskAlerts.length}`,
          `Alert broadcasts sent: ${totalAlertBroadcasts}`,
          `Broadcast recipients reached: ${broadcastRecipients}`,
          `Broadcast failures: ${failedBroadcastRecipients}`,
          `Open assistance records: ${openAssistance}`,
          `Completed assistance records: ${completedAssistance}`,
          `Scheduled field visits: ${scheduledFieldVisits}`,
          `Completed field visits: ${completedFieldVisits}`,
          `Tracked market prices: ${trackedMarketPrices}`,
          `Stale market prices: ${stalePriceCount}`,
          `Top keyword: ${topKeyword?.word ?? 'wala'} (${topKeyword?.count ?? 0})`,
          `Top hotspot: ${topHotspot?.zone ?? 'wala'} (${topHotspot?.issues ?? 0} ulat)`,
          ``,
          `Recommendations:`,
          `- I-prioritize ang hotspot zone para sa field action.`,
          `- Maghanda ng advisory content para sa top keyword concern.`,
        ].join('\n');

        const blob = new Blob([summaryLines], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lingkod-ani-report-summary-${timeframe.toLowerCase().replace(/\s+/g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
            title: "Na-export ang ulat",
            description: `Na-download ang buod para sa "${timeframe}" bilang text file.`,
        });
    };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Mga Ulat at Pagsusuri</h1>
            <HelpDialog title="Mga Ulat at Pagsusuri" tooltipText="I-visualize ang data at makakuha ng mga insight.">
                <p>Ang pahinang ito ay ang iyong sentro para sa pagsusuri ng data. Dito mo makikita ang mga visual na representasyon ng mga trend at pattern na nangyayari sa iyong komunidad ng magsasaka, na nagbibigay-daan sa iyo na gumawa ng mga desisyon na batay sa datos.</p>
                <p><strong>Buod ng AI:</strong> Isang mabilis na buod na binuo ng AI batay sa lahat ng data para sa napiling timeframe. Maaari kang magpalit ng timeframe (Lingguhan, Buwanan, atbp.) upang makita ang mga insight para sa iba't ibang panahon.</p>
                <p><strong>Mga Tab:</strong> Ang mga ulat ay naka-grupo sa tatlong pangunahing kategorya: "Pagsusuri ng SMS" (tungkol sa mga mensahe mismo), "Performance ng AI" (kung gaano kahusay gumagana ang AI), at "Operasyon at Pakikilahok" (tungkol sa workload at paggamit ng sistema).</p>
                <p><strong>Mga Chart:</strong> Bawat card ay isang interactive na chart. Maaari mong i-click ang expand button (isang box icon) sa kanang itaas ng bawat card upang makita ang mas malaki at mas detalyadong view ng chart. Sa expanded view, makakakita ka ng mas malalim na pagsusuri at mga konkretong rekomendasyon batay sa data.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">I-visualize ang mga trend, suriin ang data, at makakuha ng mga insight para sa paggawa ng desisyon.</p>
          <p className="text-xs text-muted-foreground">Live context sync: {liveSyncLabel}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <HoverTooltip text="I-download ang buod ng ulat sa AI bilang PDF.">
            <Button onClick={handleExportSummary}>
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
                            <HelpDialog title="Buod ng AI" tooltipText="Basahin ang buod ng AI para sa napiling timeframe.">
                                <p>Ito ay isang awtomatikong buod na binuo ng artificial intelligence. Sinusuri nito ang lahat ng data mula sa mga chart sa ibaba para sa napiling timeframe at nagbibigay ng mga pangunahing insight at rekomendasyon sa simpleng wika.</p>
                                <p>Halimbawa, kung tumaas ang mga ulat ng peste at sabay na bumaba ang paggamit ng isang partikular na payo, maaaring i-highlight ito ng AI at magmungkahi ng posibleng aksyon. Ito ay idinisenyo upang makatipid ka ng oras sa pagsusuri ng data at mabilis na matukoy ang mga mahahalagang isyu.</p>
                            </HelpDialog>
                        </div>
                        <CardDescription>Mga awtomatikong nabuong insight mula sa live context. Huling sync: {liveSyncLabel}.</CardDescription>
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
                    <p>Batay sa live na data, may <strong>{highRiskCount}</strong> na high-priority SMS sa kasalukuyang dataset at <strong>{riskAlerts.length}</strong> aktibong alerto sa risk center.</p>
                    <p>Ang pinakakaraniwang keyword ay <strong className="text-foreground">{topKeyword?.word ?? 'wala'}</strong> ({topKeyword?.count ?? 0} banggit), habang ang hotspot ngayon ay <strong>{topHotspot?.zone ?? 'wala'}</strong> na may {topHotspot?.issues ?? 0} ulat.</p>
                    <p>May <strong>{openAssistance}</strong> open assistance records at <strong>{scheduledFieldVisits}</strong> scheduled field visits sa parehong timeframe, kaya mas malinaw na ngayon ang intervention load sa barangay.</p>
                    <p><strong>Rekomendasyon:</strong> I-prioritize ang field action at advisory broadcast sa hotspot zone, i-monitor ang open assistance queue, at i-refresh ang stale market prices bago magbigay ng economic advice sa magsasaka.</p>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Interventions Completed</CardTitle>
                    <CardDescription>Pinagsamang tulong at field visits na natapos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{completedAssistance + completedFieldVisits}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{completedAssistance} assistance, {completedFieldVisits} field visits</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Open Follow-through</CardTitle>
                    <CardDescription>Mga tulong at visit na hindi pa sarado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{openAssistance + scheduledFieldVisits}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{openAssistance} assistance, {scheduledFieldVisits} visits</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Alert Reach</CardTitle>
                    <CardDescription>Ilang recipients ang naabot ng broadcasts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{broadcastRecipients}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{totalAlertBroadcasts} total broadcasts, {failedBroadcastRecipients} failures</p>
                </CardContent>
            </Card>
            <Card className={stalePriceCount > 0 ? 'border-destructive/40' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Price Watch Health</CardTitle>
                    <CardDescription>Freshness ng local market references.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{trackedMarketPrices}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{stalePriceCount} stale entries na kailangang i-refresh</p>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="sms" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Pagsusuri ng SMS</TabsTrigger>
                <TabsTrigger value="ai" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Performance ng AI</TabsTrigger>
                <TabsTrigger value="operations" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Operasyon at Pakikilahok</TabsTrigger>
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

export default function ReportsPage() {
    return (
      <ReportsTimeframeProvider>
        <ReportsPageContent />
      </ReportsTimeframeProvider>
    );
}
