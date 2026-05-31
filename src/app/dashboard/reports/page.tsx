
'use client';
import Link from 'next/link';
import { Bot, Calendar as CalendarIcon, CalendarRange, ArrowDownToLine, AlertTriangle } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import { ReportsTimeframeProvider, useReportsTimeframe } from '@/context/reports-timeframe-context';
import { ExportCenterPanel } from '@/components/reports/export-center-panel';
import { buildSummaryMetricsCsv } from '@/lib/report-export-center';

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
import { CaseOutcomeChart } from '@/components/reports/case-outcome-chart';
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function DemographicBarCard({
  title,
  description,
  data,
  xKey,
  yKey,
}: {
  title: string;
  description: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[240px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Wala pang sapat na farmer records sa napiling scope.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 12 }}>
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey={yKey} radius={6}>
                {data.map((entry, index) => (
                  <Cell key={`${title}-${index}`} fill={String(entry.fill ?? 'hsl(var(--chart-1))')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function DemographicPieCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; value: number; fill: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="h-[220px]">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Wala pang sapat na farmer records sa napiling scope.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={84} paddingAngle={3}>
                  {data.map((entry) => (
                    <Cell key={`${title}-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Wala pang entries para sa demographic snapshot na ito.</p>
          ) : (
            data.map((entry) => (
              <div key={`${title}-${entry.name}`} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{entry.name}</span>
                  <span className="font-semibold">{entry.value}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsPageContent() {
    const {
      setTimeframe,
      customRangeStart,
      customRangeEnd,
      setCustomRangeStart,
      setCustomRangeEnd,
      applyCustomRange,
      clearCustomRange,
      isCustomRangeActive,
      activeLabel,
      activeFileLabel,
      resolvedWindow,
    } = useReportsTimeframe();
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const {
      topKeywordsData,
      geographicHotspotData,
      riskAlerts,
      liveContextUpdatedAt,
      highRiskCount,
      aiDraftedCases,
      humanReviewedCases,
      farmerConfirmedResolutionCount,
      awaitingFarmerConfirmationCount,
      averageOperationalConfidence,
      trustedCaseCount,
      lowTrustCaseCount,
      weightedResolvedCount,
      outbreakClusters,
      outbreakWatchSummary,
      interventionEffectivenessData,
      topInterventionEffectiveness,
      reportingReadyCases,
      reportingPartialCases,
      reportingLowConfidenceCases,
      exceptionCases,
      criticalExceptionCases,
      supervisorReviewCases,
      caseExceptionData,
      completedFieldVisits,
      scheduledFieldVisits,
      completedAssistance,
      openAssistance,
      totalAlertBroadcasts,
      broadcastRecipients,
      failedBroadcastRecipients,
      trackedMarketPrices,
      stalePriceCount,
      totalDemographicFarmers,
      newRegisteredFarmers,
      averageFarmerAge,
      averageFarmSizeHectares,
      dominantGenderLabel,
      dominantGenderCount,
      topFarmerLocationLabel,
      topFarmerLocationCount,
      topCropProfile,
      genderDistributionData,
      farmerAgeGroupData,
      farmSizeDistributionData,
      farmerCropProfileData,
    } = useAnalytics();
    const topKeyword = topKeywordsData[0];
    const topHotspot = geographicHotspotData[0];
    const topOutbreakCluster = outbreakClusters[0];
    const hasTopKeyword = Boolean(topKeyword && topKeyword.count > 0);
    const hasTopHotspot = Boolean(topHotspot && topHotspot.issues > 0);
    const liveSyncLabel = `${liveContextUpdatedAt.slice(0, 19).replace('T', ' ')} UTC`;

    const buildSummaryMetrics = () => [
      { metric: 'Reporting scope', value: activeLabel, notes: 'Active analytics scope on the reports dashboard.' },
      { metric: 'Live context updated at', value: liveContextUpdatedAt, notes: 'Latest synchronized analytics timestamp.' },
      { metric: 'Farmers in demographic scope', value: String(totalDemographicFarmers), notes: 'Active farmers touched by recent activity or registration in the selected scope.' },
      { metric: 'New registrations in scope', value: String(newRegisteredFarmers), notes: 'Farmer registrations whose registration date falls inside the selected scope.' },
      { metric: 'Average farmer age', value: averageFarmerAge > 0 ? String(averageFarmerAge) : 'N/A', notes: 'Average age of farmers represented in the scope-aware demographic snapshot.' },
      { metric: 'Average farm size', value: averageFarmSizeHectares > 0 ? `${averageFarmSizeHectares} ha` : 'N/A', notes: 'Average declared farm size of farmers included in the demographic snapshot.' },
      { metric: 'Dominant gender segment', value: dominantGenderCount > 0 ? `${dominantGenderLabel} (${dominantGenderCount})` : 'N/A', notes: 'Largest gender group among farmers represented in the current demographic scope.' },
      { metric: 'Top farmer location', value: topFarmerLocationCount > 0 ? `${topFarmerLocationLabel} (${topFarmerLocationCount})` : 'N/A', notes: 'Sitio with the highest number of farmers in the current demographic snapshot.' },
      { metric: 'Top crop profile', value: topCropProfile ? `${topCropProfile.crop} (${topCropProfile.count})` : 'N/A', notes: 'Most common crop declared by farmers in the current demographic snapshot.' },
      { metric: 'High-priority SMS', value: String(highRiskCount), notes: 'Urgent cases needing faster barangay action.' },
      { metric: 'AI-drafted cases', value: String(aiDraftedCases), notes: 'Cases that already passed through AI-assisted first-pass analysis.' },
      { metric: 'Human-reviewed cases', value: String(humanReviewedCases), notes: 'Cases that already received staff review.' },
      { metric: 'Reporting-ready cases', value: String(reportingReadyCases), notes: 'Cases with enough structured closeout for stronger analytics use.' },
      { metric: 'Partial reporting cases', value: String(reportingPartialCases), notes: 'Cases with incomplete reporting details.' },
      { metric: 'Low-confidence reporting cases', value: String(reportingLowConfidenceCases), notes: 'Cases that still need quality review before strong reporting use.' },
      { metric: 'Operational exceptions', value: String(exceptionCases), notes: 'Cases with hidden process or operational risk.' },
      { metric: 'Critical exceptions', value: String(criticalExceptionCases), notes: 'High-severity exceptions that should be reviewed by supervisor-level staff.' },
      { metric: 'Supervisor review candidates', value: String(supervisorReviewCases), notes: 'Cases most suitable for higher-level review.' },
      { metric: 'Farmer-confirmed resolutions', value: String(farmerConfirmedResolutionCount), notes: 'Closures confirmed directly by farmers.' },
      { metric: 'Awaiting farmer confirmation', value: String(awaitingFarmerConfirmationCount), notes: 'Cases marked closed but still waiting for farmer confirmation.' },
      { metric: 'Average operational confidence', value: `${(averageOperationalConfidence * 100).toFixed(0)}%`, notes: 'Combined quality and confidence score for operational reporting.' },
      { metric: 'Trusted cases', value: String(trustedCaseCount), notes: 'Higher-confidence cases suitable for stronger analytics use.' },
      { metric: 'Low-trust cases', value: String(lowTrustCaseCount), notes: 'Cases that should be reviewed before strategic use.' },
      { metric: 'Weighted resolved count', value: String(weightedResolvedCount), notes: 'Resolution total adjusted by trust and completeness.' },
      { metric: 'Outbreak clusters', value: String(outbreakWatchSummary.totalClusters), notes: 'Clustered signals across zone, crop, and symptom combinations.' },
      { metric: 'Confirmed outbreak signals', value: String(outbreakWatchSummary.confirmedClusters), notes: 'Clusters already confirmed during review.' },
      { metric: 'Unreviewed outbreak signals', value: String(outbreakWatchSummary.unreviewedClusters), notes: 'Clusters that still need validation.' },
      { metric: 'Rising outbreak signals', value: String(outbreakWatchSummary.risingClusters), notes: 'Clusters showing an increasing trend.' },
      { metric: 'Risk alerts', value: String(riskAlerts.length), notes: 'Current risk-center alerts visible for the selected timeframe.' },
      { metric: 'Alert broadcasts sent', value: String(totalAlertBroadcasts), notes: 'Broadcast jobs created for farmers or official alerts.' },
      { metric: 'Broadcast recipients reached', value: String(broadcastRecipients), notes: 'Recipients successfully targeted in alert broadcasts.' },
      { metric: 'Broadcast failures', value: String(failedBroadcastRecipients), notes: 'Failed or incomplete alert recipients.' },
      { metric: 'Open assistance records', value: String(openAssistance), notes: 'Assistance items still awaiting completion.' },
      { metric: 'Completed assistance records', value: String(completedAssistance), notes: 'Assistance items marked fulfilled.' },
      { metric: 'Scheduled field visits', value: String(scheduledFieldVisits), notes: 'Field visits still on the schedule.' },
      { metric: 'Completed field visits', value: String(completedFieldVisits), notes: 'Field visits already finished.' },
      { metric: 'Tracked market prices', value: String(trackedMarketPrices), notes: 'Price watch records included in the dashboard.' },
      { metric: 'Stale market prices', value: String(stalePriceCount), notes: 'Price entries that should be refreshed before advisory use.' },
      { metric: 'Top keyword', value: hasTopKeyword ? `${topKeyword?.word} (${topKeyword?.count})` : 'N/A', notes: 'Most repeated normalized keyword from filtered SMS text.' },
      { metric: 'Top hotspot', value: hasTopHotspot ? `${topHotspot?.zone} (${topHotspot?.issues} reports)` : 'N/A', notes: 'Zone with the highest visible concern concentration.' },
      {
        metric: 'Top outbreak cluster',
        value: topOutbreakCluster
          ? `${topOutbreakCluster.zone} / ${topOutbreakCluster.crop} / ${topOutbreakCluster.signal}`
          : 'N/A',
        notes: topOutbreakCluster
          ? `${topOutbreakCluster.reportCount} linked reports; ${topOutbreakCluster.validationState}; ${topOutbreakCluster.trendDirection}.`
          : 'No strong clustered signal yet.',
      },
      {
        metric: 'Best intervention pattern',
        value: topInterventionEffectiveness ? topInterventionEffectiveness.type : 'N/A',
        notes: topInterventionEffectiveness
          ? `${topInterventionEffectiveness.confirmedRate}% farmer-confirmed rate.`
          : 'Kulang pa ang resolved intervention data.',
      },
    ];

    const buildSummaryLines = () => [
          `Lingkod-Ani Report Summary`,
          `Reporting Scope: ${activeLabel}`,
          `Live Context Updated At: ${liveContextUpdatedAt}`,
          ``,
          `Farmers in demographic scope: ${totalDemographicFarmers}`,
          `New registrations in scope: ${newRegisteredFarmers}`,
          `Average farmer age: ${averageFarmerAge > 0 ? averageFarmerAge : 'N/A'}`,
          `Average farm size: ${averageFarmSizeHectares > 0 ? `${averageFarmSizeHectares} ha` : 'N/A'}`,
          `Dominant gender segment: ${dominantGenderCount > 0 ? `${dominantGenderLabel} (${dominantGenderCount})` : 'N/A'}`,
          `Top farmer location: ${topFarmerLocationCount > 0 ? `${topFarmerLocationLabel} (${topFarmerLocationCount})` : 'N/A'}`,
          `Top crop profile: ${topCropProfile ? `${topCropProfile.crop} (${topCropProfile.count})` : 'N/A'}`,
          ``,
          `High-priority SMS: ${highRiskCount}`,
          `AI-drafted cases: ${aiDraftedCases}`,
          `Human-reviewed cases: ${humanReviewedCases}`,
          `Reporting-ready cases: ${reportingReadyCases}`,
          `Partial reporting cases: ${reportingPartialCases}`,
          `Low-confidence reporting cases: ${reportingLowConfidenceCases}`,
          `Cases with operational exceptions: ${exceptionCases}`,
          `Critical exception cases: ${criticalExceptionCases}`,
          `Supervisor review candidates: ${supervisorReviewCases}`,
          `Farmer-confirmed resolutions: ${farmerConfirmedResolutionCount}`,
          `Awaiting farmer confirmation: ${awaitingFarmerConfirmationCount}`,
          `Average operational confidence: ${(averageOperationalConfidence * 100).toFixed(0)}%`,
          `Trusted cases: ${trustedCaseCount}`,
          `Low-trust cases: ${lowTrustCaseCount}`,
          `Weighted resolved count: ${weightedResolvedCount}`,
          `Outbreak clusters: ${outbreakWatchSummary.totalClusters}`,
          `Confirmed outbreak signals: ${outbreakWatchSummary.confirmedClusters}`,
          `Unreviewed outbreak signals: ${outbreakWatchSummary.unreviewedClusters}`,
          `Rising outbreak signals: ${outbreakWatchSummary.risingClusters}`,
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
          `Top keyword: ${hasTopKeyword ? `${topKeyword?.word} (${topKeyword?.count})` : 'Kulangan pa ng live SMS text data'}`,
          `Top hotspot: ${hasTopHotspot ? `${topHotspot?.zone} (${topHotspot?.issues} ulat)` : 'Kulangan pa ng live location-linked reports'}`,
          `Top outbreak cluster: ${topOutbreakCluster ? `${topOutbreakCluster.zone} / ${topOutbreakCluster.crop} / ${topOutbreakCluster.signal} (${topOutbreakCluster.reportCount} ulat, ${topOutbreakCluster.validationState}, ${topOutbreakCluster.trendDirection})` : 'Wala pang malinaw na clustered signal'}`,
          `Best intervention pattern: ${topInterventionEffectiveness ? `${topInterventionEffectiveness.type} (${topInterventionEffectiveness.confirmedRate}% confirmed)` : 'Kulangan pa ng resolved intervention data'}`,
          ``,
          `Recommendations:`,
          totalDemographicFarmers > 0
            ? `- I-match ang advisory scheduling sa demographic snapshot, lalo na sa dominant gender segment at top farmer location.`
            : `- Palakasin muna ang farmer registration at recent activity logging para lumabas ang mas useful na demographic view.`,
          hasTopHotspot
            ? `- I-prioritize ang hotspot zone para sa field action.`
            : `- Hikayatin ang mas kumpletong farmer/location encoding para lumabas ang hotspot analysis.`,
          hasTopKeyword
            ? `- Maghanda ng advisory content para sa top keyword concern.`
            : `- Maghintay ng mas maraming live SMS records bago gumamit ng keyword-based content planning.`,
        ];

    const handleExportSummaryCsv = () => {
        const csv = buildSummaryMetricsCsv(
          'Lingkod-Ani Report Summary',
          'Dashboard summary metrics for the selected reporting scope.',
          buildSummaryMetrics()
        );

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lingkod-ani-report-summary-${activeFileLabel}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
            title: "Na-export ang ulat",
            description: `Na-download ang buod para sa "${activeLabel}" bilang CSV file.`,
        });
    };

    const openPrintSummary = () => {
        const summaryLines = buildSummaryLines();
        const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');

        if (!printWindow) {
          toast({
            title: 'Hindi nabuksan ang PDF export',
            description: 'Pinagbawalan ng browser ang bagong window. Payagan muna ang pop-ups para sa site na ito.',
            variant: 'destructive',
          });
          return;
        }

        const renderedSummary = summaryLines.map((line) => escapeHtml(line)).join('<br />');

        printWindow.document.write(`
          <!doctype html>
          <html>
            <head>
              <title>Lingkod-Ani Report Summary</title>
              <style>
                body {
                  font-family: "Times New Roman", serif;
                  padding: 32px;
                  color: #111827;
                  line-height: 1.6;
                }
                h1 {
                  font-size: 24px;
                  margin-bottom: 16px;
                }
                .meta {
                  margin-bottom: 24px;
                  color: #4b5563;
                  font-size: 14px;
                }
                .report {
                  white-space: normal;
                  font-size: 14px;
                }
                @media print {
                  body {
                    padding: 24px;
                  }
                }
              </style>
            </head>
            <body>
              <h1>Lingkod-Ani Report Summary</h1>
              <div class="meta">Reporting Scope: ${escapeHtml(activeLabel)}</div>
              <div class="report">${renderedSummary}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
    };

    const handleExportSummaryPdf = async () => {
        try {
          const idToken = currentUser ? await currentUser.getIdToken() : null;
          const response = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              type: 'report-summary',
              timeframe: activeLabel,
              generatedAt: liveContextUpdatedAt,
              summaryLines: buildSummaryLines(),
            }),
          });

          if (!response.ok) {
            throw new Error(`PDF export failed with HTTP ${response.status}.`);
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `lingkod-ani-report-summary-${activeFileLabel}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: 'Na-export ang PDF',
            description: `Na-download ang "${activeLabel}" report summary bilang PDF.`,
          });
        } catch (error) {
          console.error('Falling back to print summary PDF flow.', error);
          openPrintSummary();
        }
    };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Mga Ulat at Pagsusuri</h1>
            <HelpDialog title="Mga Ulat at Pagsusuri" tooltipText="I-visualize ang data at makakuha ng mga insight.">
                <p>Ang pahinang ito ay ang iyong sentro para sa pagsusuri ng data. Dito mo makikita ang mga visual na representasyon ng mga trend at pattern na nangyayari sa iyong komunidad ng magsasaka, na nagbibigay-daan sa iyo na gumawa ng mga desisyon na batay sa datos.</p>
                <p><strong>Awtomatikong Buod:</strong> Isang mabilis na buod na binuo mula sa live metrics sa napiling reporting scope. Maaari kang magpalit ng preset scope o mag-apply ng custom date range upang makita ang mga insight para sa eksaktong panahon na gusto mo.</p>
                <p><strong>Mga Tab:</strong> Ang mga ulat ay naka-grupo sa apat na pangunahing kategorya: "Pagsusuri ng SMS", "Performance ng AI", "Operasyon at Pakikilahok", at "Demograpiko ng Magsasaka".</p>
                <p><strong>Mga Chart:</strong> Bawat card ay isang interactive na chart. Maaari mong i-click ang expand button (isang box icon) sa kanang itaas ng bawat card upang makita ang mas malaki at mas detalyadong view ng chart. Sa expanded view, makakakita ka ng mas malalim na pagsusuri at mga konkretong rekomendasyon batay sa data.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">I-visualize ang mga trend, suriin ang data, at makakuha ng mga insight para sa paggawa ng desisyon.</p>
          <p className="text-xs text-muted-foreground">Live context sync: {liveSyncLabel} / Active scope: {activeLabel}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <HoverTooltip text="Piliin ang specific date o custom date range para sa downloadable records sa ibaba.">
            <Button variant="outline" asChild>
              <Link href="#report-export-options">
                <CalendarRange className="mr-2 h-4 w-4" />
                Choose Dates &amp; Ranges
              </Link>
            </Button>
          </HoverTooltip>
          <HoverTooltip text="I-download ang awtomatikong buod bilang CSV file.">
            <Button variant="outline" onClick={handleExportSummaryCsv}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Download Summary CSV
            </Button>
          </HoverTooltip>
          <HoverTooltip text="I-download ang awtomatikong buod bilang PDF. Para sa exact-date records, gamitin ang Flexible Report Export section sa ibaba.">
            <Button onClick={handleExportSummaryPdf}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Download Summary PDF
            </Button>
          </HoverTooltip>
          <HoverTooltip text="Buksan ang browser print view ng kasalukuyang report summary.">
            <Button variant="outline" onClick={openPrintSummary}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Print Summary
            </Button>
          </HoverTooltip>
        </div>
      </div>

      <Card className="border-sky-200 bg-sky-50/70">
        <CardContent className="flex flex-col gap-3 px-6 py-5 text-sm text-sky-950 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="font-semibold">Need an exact date or custom range?</p>
            <p className="text-sky-900/85">
              Ang Lingguhan, Monthly, Quarterly, at Yearly selector ay para sa analytics summary at charts.
              Para sa downloadable records by specific date or custom range, gamitin ang Flexible Report Export controls sa ibaba.
            </p>
          </div>
          <Button variant="outline" className="border-sky-300 bg-white text-sky-950 hover:bg-sky-100" asChild>
            <Link href="#report-export-options">
              <CalendarRange className="mr-2 h-4 w-4" />
              Open Date Filters
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Analytics Scope</CardTitle>
          <CardDescription>
            Ang charts, demographic snapshot, at awtomatikong buod sa pahinang ito ay kasalukuyang nakatali sa <strong>{activeLabel}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr,1fr,auto] lg:items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Custom Start Date</p>
            <Input type="date" value={customRangeStart} onChange={(event) => setCustomRangeStart(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Custom End Date</p>
            <Input type="date" value={customRangeEnd} onChange={(event) => setCustomRangeEnd(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={applyCustomRange}>Apply Custom Range</Button>
            <Button variant="outline" onClick={clearCustomRange} disabled={!isCustomRangeActive}>
              Back to Presets
            </Button>
          </div>
          <div className="lg:col-span-3">
            <p className="text-xs text-muted-foreground">
              Ang custom analytics range ay naka-apply mula {resolvedWindow.start.toLocaleDateString('en-PH')} hanggang {resolvedWindow.end.toLocaleDateString('en-PH')}.
            </p>
          </div>
        </CardContent>
      </Card>

      <ExportCenterPanel embedded showOpenPageLink sectionId="report-export-options" />
      
       <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center">
                            <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Awtomatikong Buod</CardTitle>
                            <HelpDialog title="Awtomatikong Buod" tooltipText="Basahin ang awtomatikong buod para sa napiling reporting scope.">
                                <p>Ito ay isang system-generated summary mula sa live metrics sa mga chart sa ibaba para sa napiling reporting scope. Hindi ito direktang generative-AI narrative.</p>
                                <p>Kapag kulang ang live data, magiging mas maingat din ang wording ng buod upang hindi ito magmukhang sigurado sa insight na wala pa naman sa dataset.</p>
                            </HelpDialog>
                        </div>
                        <CardDescription>Mga awtomatikong insight mula sa live context para sa {activeLabel}. Huling sync: {liveSyncLabel}.</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <HoverTooltip text="Baguhin ang sakop na oras para sa buod at mga ulat.">
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {activeLabel}
                            </Button>
                          </HoverTooltip>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setTimeframe('Ngayong Araw')}>Ngayong Araw</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Monthly')}>Monthly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Quarterly')}>Quarterly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe('Yearly')}>Yearly</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Sa demographic layer, may <strong>{totalDemographicFarmers}</strong> aktibong farmer profiles na may activity o registration sa scope na ito, may average na edad na <strong>{averageFarmerAge > 0 ? averageFarmerAge : 'N/A'}</strong>, at average farm size na <strong>{averageFarmSizeHectares > 0 ? `${averageFarmSizeHectares} ha` : 'N/A'}</strong>.</p>
                    <p>
                      {dominantGenderCount > 0
                        ? <>Pinakamalaking gender segment ngayon ang <strong>{dominantGenderLabel}</strong> ({dominantGenderCount}), habang ang top farmer location sa active scope ay <strong>{topFarmerLocationLabel}</strong>{topFarmerLocationCount > 0 ? ` na may ${topFarmerLocationCount} farmers` : ''}.</>
                        : <>Wala pang sapat na farmer demographic entries para sa malinaw na gender at location profile sa scope na ito.</>}
                    </p>
                    <p>
                      {topCropProfile
                        ? <>Sa crop profile, pinakakaraniwang deklaradong pananim ang <strong>{topCropProfile.crop}</strong> ({topCropProfile.count} farmers), kaya dapat tumugma rito ang seasonal advisories, price watch interpretation, at follow-up materials.</>
                        : <>Wala pang sapat na crop profile entries para sa demographic crop summary sa scope na ito.</>}
                    </p>
                    <p>Batay sa live na data, may <strong>{highRiskCount}</strong> na high-priority SMS sa kasalukuyang dataset at <strong>{riskAlerts.length}</strong> aktibong alerto sa risk center.</p>
                    <p>Sa kasalukuyang timeframe, <strong>{aiDraftedCases}</strong> ang AI-assisted case drafts, <strong>{humanReviewedCases}</strong> ang umabot na sa human review, at <strong>{awaitingFarmerConfirmationCount}</strong> pa ang naghihintay ng kumpirmasyon mula sa magsasaka bago tuluyang ituring na sarado.</p>
                    <p>Sa reporting quality, <strong>{reportingReadyCases}</strong> pa lamang ang kumpleto ang structured closeout para masama sa mas mapagkakatiwalaang analytics, habang <strong>{reportingPartialCases}</strong> ang partial at <strong>{reportingLowConfidenceCases}</strong> ang low-confidence pa ang pagkaka-encode.</p>
                    <p>Sa trust layer, nasa <strong>{(averageOperationalConfidence * 100).toFixed(0)}%</strong> ang average operational confidence. May <strong>{trustedCaseCount}</strong> trusted cases pero may <strong>{lowTrustCaseCount}</strong> pa ring low-trust records na dapat i-review bago gamitin sa high-confidence reporting.</p>
                    <p>May <strong>{exceptionCases}</strong> cases na may operational exceptions ngayon, at <strong>{criticalExceptionCases}</strong> dito ang may high-severity risk tulad ng urgent na walang aksyon, failed follow-through, o kulang na closeout evidence. <strong>{supervisorReviewCases}</strong> ang dapat makita sa supervisor review queue.</p>
                    <p>
                      {topOutbreakCluster
                        ? <>Ang pinakamalakas na outbreak signal ngayon ay nasa <strong>{topOutbreakCluster.zone}</strong> para sa <strong>{topOutbreakCluster.crop}</strong> na may pattern na <strong>{topOutbreakCluster.signal}</strong>, na may {topOutbreakCluster.reportCount} magkakaugnay na ulat, status na <strong>{topOutbreakCluster.validationState}</strong>, at trend na <strong>{topOutbreakCluster.trendDirection}</strong>.</>
                        : <>Wala pang sapat na magkakaugnay na reports para sa malinaw na outbreak cluster sa timeframe na ito.</>}
                    </p>
                    <p>
                      Sa outbreak watch summary, may <strong>{outbreakWatchSummary.confirmedClusters}</strong> kumpirmadong cluster, <strong>{outbreakWatchSummary.unreviewedClusters}</strong> hindi pa nare-review, at <strong>{outbreakWatchSummary.risingClusters}</strong> tumitinding signal na dapat unahin sa hotspot review.
                    </p>
                    <p>
                      {topInterventionEffectiveness
                        ? <>Pinakamalakas sa kasalukuyang data ang <strong>{topInterventionEffectiveness.type}</strong> na may {topInterventionEffectiveness.confirmedRate}% farmer-confirmed rate.</>
                        : <>Kulangan pa ang resolved intervention data para makabuo ng maaasahang effectiveness comparison.</>}
                    </p>
                    <p>
                      {hasTopKeyword
                        ? <>Ang pinakakaraniwang keyword ay <strong className="text-foreground">{topKeyword?.word}</strong> ({topKeyword?.count} banggit).</>
                        : <>Wala pang sapat na live SMS text para sa keyword summary sa reporting scope na ito.</>}
                      {' '}
                      {hasTopHotspot
                        ? <>Ang hotspot ngayon ay <strong>{topHotspot?.zone}</strong> na may {topHotspot?.issues} ulat.</>
                        : <>Wala pang sapat na location-linked reports para tukuyin ang hotspot zone.</>}
                    </p>
                    <p>May <strong>{openAssistance}</strong> open assistance records at <strong>{scheduledFieldVisits}</strong> scheduled field visits sa parehong scope, kaya mas malinaw na ngayon ang intervention load sa barangay.</p>
                    <p>
                      <strong>Rekomendasyon:</strong>{' '}
                      {hasTopHotspot
                        ? 'I-prioritize ang field action at advisory broadcast sa hotspot zone, '
                        : 'Palakasin muna ang live reporting at farmer location tagging, '}
                      i-monitor ang open assistance queue, i-block ang mahihinang closeout bago mapasama sa reports, at i-refresh ang stale market prices bago magbigay ng economic advice sa magsasaka.
                    </p>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Human Review Progress</CardTitle>
                    <CardDescription>AI-assisted vs human-reviewed na mga concern.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{humanReviewedCases}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{aiDraftedCases} AI-assisted, {Math.max(aiDraftedCases - humanReviewedCases, 0)} naghihintay pa ng tao</p>
                </CardContent>
            </Card>
            <Card className={reportingLowConfidenceCases > 0 ? 'border-amber-300/60' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Reporting Readiness</CardTitle>
                    <CardDescription>Hindi lahat ng closed case ay kumpleto para sa analytics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{reportingReadyCases}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{reportingPartialCases} partial, {reportingLowConfidenceCases} low-confidence na case records</p>
                </CardContent>
            </Card>
            <Card className={lowTrustCaseCount > 0 ? 'border-amber-300/60' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Operational Trust</CardTitle>
                    <CardDescription>Confidence decay at structured evidence combined.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{(averageOperationalConfidence * 100).toFixed(0)}%</p>
                    <p className="mt-2 text-xs text-muted-foreground">{trustedCaseCount} trusted cases, {lowTrustCaseCount} low-trust cases</p>
                </CardContent>
            </Card>
            <Card className={outbreakClusters.length > 0 ? 'border-red-300/60' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Outbreak Signal</CardTitle>
                    <CardDescription>Clustered zone + crop + symptom signals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{outbreakClusters.length}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {topOutbreakCluster
                        ? `${topOutbreakCluster.zone} / ${topOutbreakCluster.crop} / ${topOutbreakCluster.signal}`
                        : 'Wala pang strong cluster ngayon'}
                    </p>
                </CardContent>
            </Card>
            <Card className={outbreakWatchSummary.risingClusters > 0 ? 'border-amber-300/60' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Outbreak Validation</CardTitle>
                    <CardDescription>Alin ang kumpirmado, tumitindi, o kailangan pang i-review.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{outbreakWatchSummary.confirmedClusters}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {outbreakWatchSummary.risingClusters} rising, {outbreakWatchSummary.unreviewedClusters} unreviewed, {outbreakWatchSummary.dismissedClusters} dismissed
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Farmer Confirmation</CardTitle>
                    <CardDescription>Actual na kumpirmasyon bago tuluyang isara.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{farmerConfirmedResolutionCount}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{awaitingFarmerConfirmationCount} cases pa ang naghihintay ng farmer confirmation</p>
                </CardContent>
            </Card>
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
            <Card className={criticalExceptionCases > 0 ? 'border-destructive/40' : exceptionCases > 0 ? 'border-amber-300/60' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Supervisor Exceptions</CardTitle>
                    <CardDescription>Mga kasong may hidden operational risk o kulang na process evidence.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{exceptionCases}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{criticalExceptionCases} critical, {supervisorReviewCases} dapat i-review ng supervisor</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Trust-Weighted Outcomes</CardTitle>
                    <CardDescription>Mas truthful na resolved count kaysa raw closure volume.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">{weightedResolvedCount}</strong> ang trust-weighted resolved count sa kasalukuyang timeframe.</p>
                    <p>Pinaghahalo nito ang operational confidence at reporting completeness para hindi magmukhang pantay ang weak at well-documented closures.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Intervention Effectiveness</CardTitle>
                    <CardDescription>Aling intervention pattern ang may mas malinaw na follow-through.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {interventionEffectivenessData.slice(0, 3).map((entry) => (
                        <div key={entry.type} className="rounded-lg border bg-muted/20 p-3">
                            <p className="font-medium text-foreground">{entry.type}</p>
                            <p className="mt-1">Cases: {entry.totalCases} / Resolved rate: {entry.resolvedRate}% / Confirmed rate: {entry.confirmedRate}%</p>
                            <p className="mt-1">Reopened: {entry.reopenedCases} / Avg confidence: {(entry.avgConfidence * 100).toFixed(0)}%</p>
                        </div>
                    ))}
                    {interventionEffectivenessData.length === 0 ? (
                        <p>Wala pang sapat na intervention history para sa effectiveness comparison.</p>
                    ) : null}
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
            <Card className={criticalExceptionCases > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-amber-300/50 bg-amber-50/30'}>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <CardTitle className="text-base">Operational Exceptions Watch</CardTitle>
                    </div>
                    <CardDescription>Hindi dapat tahimik na nalulusot sa reports ang mga kasong may kulang na process quality.</CardDescription>
                </CardHeader>
                <CardContent>
                    {caseExceptionData.length > 0 ? (
                        <div className="space-y-2 text-sm">
                            {caseExceptionData.map((entry) => (
                                <div key={entry.title} className="flex items-start justify-between gap-4 rounded-md border border-border/60 bg-background/70 px-3 py-2">
                                    <div>
                                        <p className="font-medium text-foreground">{entry.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.severity === 'high' ? 'High-severity operational risk' : entry.severity === 'medium' ? 'Medium-severity process gap' : 'Low-severity data hygiene issue'}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold">{entry.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Wala pang natukoy na supervisor exceptions sa napiling timeframe.</p>
                    )}
                </CardContent>
            </Card>
            <Card className={failedBroadcastRecipients > 0 || stalePriceCount > 0 ? 'border-sky-300/50 bg-sky-50/30' : 'border-primary/20 bg-primary/5'}>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ArrowDownToLine className="h-4 w-4 text-sky-700" />
                        <CardTitle className="text-base">Follow-up at Delivery Watch</CardTitle>
                    </div>
                    <CardDescription>Kasamang bantayan sa desktop ang follow-through load, failed deliveries, at economic data freshness.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="rounded-md border border-border/60 bg-background/70 px-3 py-2">
                        <p className="font-medium text-foreground">Naghihintay ng kumpirmasyon</p>
                        <p className="mt-1 text-muted-foreground">{awaitingFarmerConfirmationCount} case ang hindi pa kinukumpirma ng magsasaka.</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/70 px-3 py-2">
                        <p className="font-medium text-foreground">Open follow-through workload</p>
                        <p className="mt-1 text-muted-foreground">{openAssistance} assistance at {scheduledFieldVisits} field visit ang aktibo pa sa timeframe na ito.</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/70 px-3 py-2">
                        <p className="font-medium text-foreground">Delivery at price freshness</p>
                        <p className="mt-1 text-muted-foreground">{failedBroadcastRecipients} failed alert recipients at {stalePriceCount} stale market prices ang dapat i-check bago magpadala ng bagong advisory.</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="sms" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Pagsusuri ng SMS</TabsTrigger>
                <TabsTrigger value="ai" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Performance ng AI</TabsTrigger>
                <TabsTrigger value="operations" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Operasyon at Pakikilahok</TabsTrigger>
                <TabsTrigger value="demographics" className="relative h-auto min-h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-normal">Demograpiko ng Magsasaka</TabsTrigger>
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
                    <CaseOutcomeChart />
                    <AdvisoryDeliveryChart />
                    <FollowUpRateChart />
                    <FarmerEngagementChart />
                    <ResponseTimeChart />
                </div>
            </TabsContent>
            <TabsContent value="demographics" className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Farmers in Scope</CardTitle>
                            <CardDescription>Active farmer profiles reflected in the selected reporting scope.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{totalDemographicFarmers}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{newRegisteredFarmers} new registrations within {activeLabel}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Average Farmer Age</CardTitle>
                            <CardDescription>Age profile of farmers currently represented in reports.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{averageFarmerAge > 0 ? averageFarmerAge : 'N/A'}</p>
                            <p className="mt-2 text-xs text-muted-foreground">Reflects farmers with activity or registration inside the active scope.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Average Farm Size</CardTitle>
                            <CardDescription>Declared farm-size average of the visible farmer set.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{averageFarmSizeHectares > 0 ? `${averageFarmSizeHectares} ha` : 'N/A'}</p>
                            <p className="mt-2 text-xs text-muted-foreground">Useful for support targeting and realistic intervention planning.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Top Location and Crop</CardTitle>
                            <CardDescription>Fast view of where and what the current farmer scope looks like.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p><strong className="text-foreground">Location:</strong> {topFarmerLocationCount > 0 ? `${topFarmerLocationLabel} (${topFarmerLocationCount})` : 'N/A'}</p>
                            <p><strong className="text-foreground">Crop:</strong> {topCropProfile ? `${topCropProfile.crop} (${topCropProfile.count})` : 'N/A'}</p>
                            <p><strong className="text-foreground">Gender:</strong> {dominantGenderCount > 0 ? `${dominantGenderLabel} (${dominantGenderCount})` : 'N/A'}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <DemographicPieCard
                      title="Gender Distribution"
                      description={`Gender mix of farmers reflected in ${activeLabel}.`}
                      data={genderDistributionData}
                    />
                    <DemographicBarCard
                      title="Age Group Distribution"
                      description="Shows which farmer age bands are most represented in the current report scope."
                      data={farmerAgeGroupData}
                      xKey="group"
                      yKey="count"
                    />
                    <DemographicBarCard
                      title="Farm Size Distribution"
                      description="Helps align support planning with declared farm-size bands."
                      data={farmSizeDistributionData}
                      xKey="band"
                      yKey="count"
                    />
                    <DemographicBarCard
                      title="Top Crop Profiles"
                      description="Most common declared crops among the farmers represented in the active scope."
                      data={farmerCropProfileData}
                      xKey="crop"
                      yKey="count"
                    />
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



