"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { recommendationTypeData } from "@/lib/data"
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
} from "@/components/ui/dialog"


const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function RecommendationTypeChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
  const mostCommonType = recommendationTypeData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={recommendationTypeData} accessibilityLayer>
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
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
                <CardTitle>Uri ng Mga Inirekomendang Payo</CardTitle>
                <CardDescription>Ano ang mga pinakamadalas na uri ng payo ng AI.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-3">{mostCommonType.count}</p>
                <p className="text-sm text-muted-foreground">Payo sa {mostCommonType.name}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: "{mostCommonType.name}" ang pinakamadalas na uri ng payo, na nagpapakita ng pokus sa proaktibong pagsasaka.</p>
        </CardFooter>
      </Card>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>Uri ng Mga Inirekomendang Payo ({timeframe})</DialogTitle>
            <DialogDescription>
              Kinakategorya ng ulat na ito ang mga payo na ibinibigay ng sistema. Ang pag-unawa kung anong uri ng tulong ang pinakamadalas na ibinibigay ay nakakatulong na matukoy ang mga pangunahing tungkulin ng sistema.
            </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
                {renderChart()}
            </ChartContainer>
        </div>
        <DialogFooter className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang "Pag-iwas" ay ang pinakamadalas na uri ng rekomendasyon, na nagpapahiwatig na ang sistema ay epektibong nagbibigay ng proaktibong payo bago pa man lumala ang mga problema. Ang "Paggamot" ay pangalawa, na nagpapakita ng kakayahan ng sistema na magbigay ng mga solusyon sa mga umiiral na isyu. Ang "Referral" ay nagpapahiwatig ng mga kumplikadong kaso na nangangailangan ng atensyon ng tao.</p>
                <p><strong>Rekomendasyon:</strong> Palakasin ang mga payo sa "Pag-iwas" sa pamamagitan ng pag-broadcast ng mga seasonal na tip. Para sa mga "Referral", pag-aralan ang mga kasong ito upang makita kung may mga umuulit na tema na maaaring matutunan ng AI, upang mabawasan ang bilang ng mga referral sa hinaharap.</p>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
