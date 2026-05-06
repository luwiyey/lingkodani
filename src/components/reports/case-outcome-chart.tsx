"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAnalytics } from "@/hooks/use-analytics";
import { useReportsTimeframe } from "@/context/reports-timeframe-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, Download, Expand } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openPrintableReport, sanitizePrintableRows } from "@/lib/report-export";

const chartConfig = {
  value: {
    label: "Bilang",
  },
} satisfies ChartConfig;

export function CaseOutcomeChart() {
  const { caseOutcomeData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();

  const resolvedCount =
    caseOutcomeData.find((item) => item.name === "Nalutas")?.value ?? 0;
  const awaitingConfirmationCount =
    caseOutcomeData.find((item) => item.name === "Hintay kumpirmasyon")
      ?.value ?? 0;
  const unresolvedCount = caseOutcomeData
    .filter((item) => item.name !== "Nalutas")
    .reduce((total, item) => total + item.value, 0);

    const handleDownload = () => {
    const result = openPrintableReport({
      title: "Case Outcomes",
      timeframe,
      description: "Pamamahagi ng final case outcomes sa napiling timeframe.",
      rows: sanitizePrintableRows(caseOutcomeData),
    });

    if (!result.ok) {
      toast({
        title: "Hindi nabuksan ang PDF export",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={caseOutcomeData}
        layout="vertical"
        margin={{ left: 18, right: 12 }}
      >
        <XAxis type="number" dataKey="value" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={112}
        />
        <RechartsTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="value" radius={6}>
          {caseOutcomeData.map((item) => (
            <Cell key={item.name} fill={item.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Dialog>
      <Card>
        <CardHeader>
          <div className="flex justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{timeframe}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTimeframe("Ngayong Araw")}>
                  Ngayong Araw
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("Lingguhan")}>
                  Lingguhan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("Buwanan")}>
                  Buwanan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("Quarterly")}>
                  Quarterly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeframe("Taunan")}>
                  Taunan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Expand className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>I-save ang graph bilang PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid gap-0.5">
            <CardTitle>Case Outcomes</CardTitle>
            <CardDescription>
              Makikita rito kung ano na ang kasalukuyang lagay ng mga farmer
              concerns.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex h-[180px] items-center justify-center p-0">
          <div className="flex flex-col items-center gap-2">
            <p className="text-5xl font-bold text-chart-1">{resolvedCount}</p>
            <p className="text-sm text-muted-foreground">Nalutas na cases</p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Pagsusuri: {resolvedCount} ang farmer-confirmed na nalutas,{" "}
            {awaitingConfirmationCount} pa ang naghihintay ng kumpirmasyon, at{" "}
            {unresolvedCount} pa ang nasa monitoring, follow-up, referral, o
            wala pang malinaw na outcome.
          </p>
        </CardFooter>
      </Card>
      <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Case Outcomes ({timeframe})</DialogTitle>
          <DialogDescription>
            Ipinapakita ng chart na ito kung may malinaw na resulta na ba ang
            bawat farmer concern, o kung nasa monitoring, follow-up, o referral
            pa ito.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 h-[400px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            {renderChart()}
          </ChartContainer>
        </div>
        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Detalyadong Pagsusuri:</strong> Mas malalim ito kaysa
            simpleng closed status dahil nakikita rito kung ang case ay
            naghihintay pa ng kumpirmasyon mula sa farmer, nasa monitoring,
            kailangan pa ng follow-up, o naipasa na sa ibang tanggapan.
          </p>
          <p>
            <strong>Rekomendasyon:</strong> Kapag mataas ang Walang outcome,
            Hintay kumpirmasyon, o Kailangan ng follow-up, palatandaan iyon na
            kailangan pang paigtingin ang pag-record ng resulta at pagbalik sa
            magsasaka.
          </p>
        </div>
        <DialogFooter className="border-t pt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Isara
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

