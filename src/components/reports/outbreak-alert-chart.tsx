"use client"

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { outbreakAlertData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"


const chartConfig = {
  ulat: {
    label: "Ulat",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function OutbreakAlertChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');

  const peak = outbreakAlertData.reduce((prev, current) => (prev.ulat > current.ulat) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={outbreakAlertData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <Tooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="ulat" stroke="var(--color-ulat)" strokeWidth={2} dot={true} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Dialog>
      <Card>
        <CardHeader>
          <div className="flex justify-end gap-2">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{timeframe}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setTimeframe('Ngayong Araw')}>Ngayong Araw</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Quarterly')}>Quarterly</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeframe('Taunan')}>Taunan</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                      <Expand className="h-4 w-4" />
                  </Button>
              </DialogTrigger>
            </div>
            <div className="grid gap-0.5">
                <CardTitle>Mga Alerto sa Peste</CardTitle>
                <CardDescription>Biglaang pagdami ng ulat ng parehong peste.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-destructive">{peak.ulat}</p>
                <p className="text-sm text-muted-foreground">ulat noong {peak.date}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Isang biglaang pagtaas ng ulat ng peste ang nangyari noong {peak.date}, na posibleng isang outbreak.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Alerto sa Peste ({timeframe})</DialogTitle>
            <DialogDescription>
              Sinusubaybayan ng chart na ito ang mga biglaang pagtaas sa bilang ng mga ulat tungkol sa parehong uri ng peste o sakit sa isang maikling panahon, na maaaring magpahiwatig ng isang outbreak.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig}>
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Isang malinaw na "spike" ang makikita noong {peak.date}, kung saan umabot sa {peak.ulat} na ulat ang naitala. Ang ganitong kaganapan ay isang malakas na senyales ng isang posibleng cluster o outbreak na nangangailangan ng agarang pansin.</p>
                <p><strong>Rekomendasyon:</strong> Kapag nakakita ng ganitong spike, agad na suriin ang mga kaugnay na ulat. Gamitin ang "Geographic Hotspot" chart upang makita kung ang outbreak ay puro sa isang partikular na lugar. Magpadala ng isang targeted na alerto sa mga magsasaka sa apektadong lugar na may mga tagubilin sa pag-iwas at pagkontrol.</p>
            </div>
        </div>
        <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
