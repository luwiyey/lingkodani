"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowDownToLine, CalendarRange, FileSpreadsheet, Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { useToast } from "@/hooks/use-toast";
import { isDemoRuntimeActive } from "@/lib/runtime-mode";
import {
  buildAiAnalyticsExportTable,
  buildFarmerDemographicsExportTable,
  buildFarmerRegistrationsExportTable,
  buildInventoryUpdatesExportTable,
  buildPriceWatchExportTable,
  buildSmsCasesExportTable,
  buildStructuredReportPrintHtml,
  buildVoucherTransactionsExportTable,
  createDefaultReportExportFilter,
  downloadBlobFile,
  downloadTextFile,
  filterItemsByReportWindow,
  resolveReportExportWindow,
  serializeExportTableToCsv,
  type ExportTable,
  type ReportExportFilter,
} from "@/lib/report-export-center";

type ExportCenterPanelProps = {
  embedded?: boolean;
  showOpenPageLink?: boolean;
  sectionId?: string;
};

export function ExportCenterPanel({
  embedded = false,
  showOpenPageLink = false,
  sectionId,
}: ExportCenterPanelProps) {
  const { currentUser, currentUserProfile } = useAuth();
  const { toast } = useToast();
  const { smsMessages, farmers, vouchers, resources, marketPrices } = useData();
  const [filter, setFilter] = React.useState<ReportExportFilter>(() => createDefaultReportExportFilter());
  const [exportingKey, setExportingKey] = React.useState<string | null>(null);
  const demoDateInitialized = React.useRef(false);
  const usingDemoSandbox = isDemoRuntimeActive({ currentUser, currentUserProfile });

  React.useEffect(() => {
    if (!usingDemoSandbox || demoDateInitialized.current || smsMessages.length === 0) {
      return;
    }

    const latestSmsTimestamp = smsMessages
      .map((message) => new Date(message.timestamp).getTime())
      .filter((value) => !Number.isNaN(value))
      .sort((left, right) => right - left)[0];

    if (latestSmsTimestamp) {
      setFilter({
        ...createDefaultReportExportFilter(new Date(latestSmsTimestamp)),
        mode: "specific_date",
      });
      demoDateInitialized.current = true;
    }
  }, [smsMessages, usingDemoSandbox]);

  const windowInfo = React.useMemo(() => resolveReportExportWindow(filter), [filter]);
  const filteredSms = React.useMemo(
    () => filterItemsByReportWindow(smsMessages, (message) => message.timestamp, filter),
    [filter, smsMessages]
  );
  const filteredFarmers = React.useMemo(
    () => filterItemsByReportWindow(farmers, (farmer) => farmer.registrationDate, filter),
    [farmers, filter]
  );
  const filteredVouchers = React.useMemo(
    () => filterItemsByReportWindow(vouchers, (voucher) => voucher.issueDate, filter),
    [filter, vouchers]
  );
  const filteredInventoryUpdates = React.useMemo(
    () => filterItemsByReportWindow(resources, (resource) => resource.lastUpdated, filter),
    [filter, resources]
  );
  const filteredPriceWatch = React.useMemo(
    () => filterItemsByReportWindow(marketPrices, (entry) => entry.updatedAt, filter),
    [filter, marketPrices]
  );

  const exportTables = React.useMemo(
    () => [
      {
        key: "sms-cases",
        fileSlug: "sms-cases",
        statsLabel: `${filteredSms.length} SMS concern sa napiling petsa`,
        table: buildSmsCasesExportTable(filteredSms),
      },
      {
        key: "farmer-registrations",
        fileSlug: "farmer-registrations",
        statsLabel: `${filteredFarmers.length} rehistrasyon ng magsasaka`,
        table: buildFarmerRegistrationsExportTable(filteredFarmers),
      },
      {
        key: "farmer-demographics",
        fileSlug: "farmer-demographics",
        statsLabel: `${filteredFarmers.length} demographic record ng magsasaka`,
        table: buildFarmerDemographicsExportTable(filteredFarmers),
      },
      {
        key: "voucher-transactions",
        fileSlug: "voucher-transactions",
        statsLabel: `${filteredVouchers.length} transaksyon ng voucher`,
        table: buildVoucherTransactionsExportTable(filteredVouchers, farmers, resources),
      },
      {
        key: "inventory-updates",
        fileSlug: "inventory-updates",
        statsLabel: `${filteredInventoryUpdates.length} update sa imbentaryo`,
        table: buildInventoryUpdatesExportTable(filteredInventoryUpdates),
      },
      {
        key: "price-watch",
        fileSlug: "price-watch",
        statsLabel: `${filteredPriceWatch.length} update sa presyo`,
        table: buildPriceWatchExportTable(filteredPriceWatch),
      },
      {
        key: "ai-analytics",
        fileSlug: "ai-analytics",
        statsLabel: `${filteredSms.length} SMS concern sa buod ng pagsusuri`,
        table: buildAiAnalyticsExportTable(filteredSms),
      },
    ],
    [farmers, filteredFarmers, filteredInventoryUpdates, filteredPriceWatch, filteredSms, filteredVouchers, resources]
  );

  const handleCsvExport = (dataset: { fileSlug: string; table: ExportTable; statsLabel: string }) => {
    downloadTextFile(
      `lingkod-ani-${dataset.fileSlug}-${windowInfo.fileLabel}.csv`,
      serializeExportTableToCsv(dataset.table),
      "text/csv;charset=utf-8"
    );

    toast({
      title: "Na-download ang CSV",
      description: `${dataset.statsLabel} para sa ${windowInfo.label}.`,
    });
  };

  const handlePdfExport = async (dataset: { key: string; fileSlug: string; table: ExportTable; statsLabel: string }) => {
    setExportingKey(dataset.key);

    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: "structured-report",
          title: dataset.table.title,
          description: dataset.table.description,
          timeframe: windowInfo.label,
          generatedAt: new Date().toISOString(),
          columns: dataset.table.columns,
          rows: dataset.table.rows,
        }),
      });

      if (!response.ok) {
        throw new Error(`Structured PDF export failed with HTTP ${response.status}.`);
      }

      const blob = await response.blob();
      downloadBlobFile(`lingkod-ani-${dataset.fileSlug}-${windowInfo.fileLabel}.pdf`, blob);
      toast({
        title: "Na-download ang PDF",
        description: `${dataset.table.title} para sa ${windowInfo.label}.`,
      });
    } catch (error) {
      console.error("Falling back to print preview for structured export.", error);
      const opened = (() => {
        const popup = window.open("", "_blank", "noopener,noreferrer,width=1024,height=720");
        if (!popup) {
          return false;
        }

        popup.document.write(buildStructuredReportPrintHtml(dataset.table, windowInfo.label));
        popup.document.close();
        popup.focus();
        setTimeout(() => {
          popup.print();
        }, 250);
        return true;
      })();

      if (opened) {
        toast({
          title: "Print fallback ang ginamit",
          description: "Hindi nakabuo ng downloadable PDF kaya browser print view ang binuksan bilang fallback.",
        });
      } else {
        toast({
          title: "Hindi na-export ang PDF",
          description: error instanceof Error ? error.message : "May problema sa pagbuo ng PDF export.",
          variant: "destructive",
        });
      }
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <Card id={sectionId} className={embedded ? "border-primary/15 bg-primary/5" : ""}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              Pag-download ng Ulat ayon sa Petsa
            </CardTitle>
            <CardDescription>
              Piliin ang preset, specific date, o custom date range bago i-download ang mga summary at records.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{windowInfo.label}</Badge>
            {showOpenPageLink ? (
              <Button variant="outline" asChild>
                <Link href="/dashboard/export-center">Buksan ang Download Center</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 lg:grid-cols-[1.5fr,1fr]">
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Mabilisang Pili</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Piliin ang araw na ito, linggong ito, o buwang ito. Gamitin ang mga kahon sa ibaba para sa eksaktong petsa.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant={filter.mode === "preset" && filter.preset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter((current) => ({ ...current, mode: "preset", preset: "today" }))}
              >
                Ngayong Araw
              </Button>
              <Button
                variant={filter.mode === "preset" && filter.preset === "this_week" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter((current) => ({ ...current, mode: "preset", preset: "this_week" }))}
              >
                Linggong Ito
              </Button>
              <Button
                variant={filter.mode === "preset" && filter.preset === "this_month" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter((current) => ({ ...current, mode: "preset", preset: "this_month" }))}
              >
                Buwang Ito
              </Button>
              <Button
                variant={filter.mode === "date_range" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter((current) => ({ ...current, mode: "date_range", preset: "custom" }))}
              >
                Sariling Saklaw
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Laman ng Napiling Saklaw</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{filteredSms.length} SMS</Badge>
              <Badge variant="secondary">{filteredFarmers.length} magsasaka</Badge>
              <Badge variant="secondary">{filteredFarmers.length} demograpiko</Badge>
              <Badge variant="secondary">{filteredVouchers.length} voucher</Badge>
              <Badge variant="secondary">{filteredInventoryUpdates.length} update sa imbentaryo</Badge>
              <Badge variant="secondary">{filteredPriceWatch.length} update sa presyo</Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Ang parehong filter na ito ang gagamitin ng CSV at PDF exports sa ibaba.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-background/80 p-4">
            <Label htmlFor={`${sectionId ?? "export"}-specific-date`}>Isang Petsa</Label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                id={`${sectionId ?? "export"}-specific-date`}
                type="date"
                value={filter.specificDate}
                onChange={(event) =>
                  setFilter((current) => ({
                    ...current,
                    specificDate: event.target.value,
                  }))
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  setFilter((current) => ({
                    ...current,
                    mode: "specific_date",
                  }))
                }
              >
                Gamitin ang Petsa
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">Saklaw ng Petsa</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
              <div className="space-y-2">
                <Label htmlFor={`${sectionId ?? "export"}-range-start`}>Mula</Label>
                <Input
                  id={`${sectionId ?? "export"}-range-start`}
                  type="date"
                  value={filter.rangeStart}
                  onChange={(event) =>
                    setFilter((current) => ({
                      ...current,
                      rangeStart: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${sectionId ?? "export"}-range-end`}>Hanggang</Label>
                <Input
                  id={`${sectionId ?? "export"}-range-end`}
                  type="date"
                  value={filter.rangeEnd}
                  onChange={(event) =>
                    setFilter((current) => ({
                      ...current,
                      rangeEnd: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setFilter((current) => ({
                    ...current,
                    mode: "date_range",
                    preset: "custom",
                  }))
                }
              >
                Gamitin ang Saklaw
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exportTables.map((dataset) => (
            <Card key={dataset.key} className="border-muted/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{dataset.table.title}</CardTitle>
                <CardDescription>{dataset.table.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{dataset.statsLabel}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCsvExport(dataset)}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    I-download ang CSV
                  </Button>
                  <Button size="sm" onClick={() => void handlePdfExport(dataset)} disabled={exportingKey === dataset.key}>
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    {exportingKey === dataset.key ? "Inihahanda ang PDF..." : "I-download ang PDF"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!embedded ? (
          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Paalala sa Pag-download</p>
            <p className="mt-2">
              Ang CSV ay para sa spreadsheet at karagdagang pagsusuri. Ang PDF ay pormal na kopya para sa dokumentasyon.
              Sa demo o preview mode, maaaring magbukas ang print view kapag walang live authenticated session.
            </p>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/export-center">
                <Printer className="mr-2 h-4 w-4" />
                Buksan ang buong Download Center
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
