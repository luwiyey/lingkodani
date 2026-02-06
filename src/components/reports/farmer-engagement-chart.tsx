"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { farmerEngagementData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand, Download } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const chartConfig = {
  count: {
    label: "Bilang ng Magsasaka",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function FarmerEngagementChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
  const totalFarmers = farmerEngagementData.reduce((acc, item) => acc + item.count, 0);

  const renderChart = () => (
     <ResponsiveContainer width="100%" height="100%">
        <BarChart data={farmerEngagementData} accessibilityLayer>
          <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
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
                  <CardTitle>Antas ng Pakikilahok ng Magsasaka</CardTitle>
                  <CardDescription>Pamamahagi batay sa dalas ng pag-uulat.</CardDescription>
              </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{totalFarmers}</p>
                <p className="text-sm text-muted-foreground">Aktibong Magsasaka</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan sa mga magsasaka ay "Repeat" reporters, na nagpapakita ng tuluy-tuloy na paggamit ng sistema.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Antas ng Pakikilahok ng Magsasaka ({timeframe})</DialogTitle>
            <DialogDescription>
              Kinakategorya nito ang mga magsasaka batay sa kung gaano sila kadalas nakikipag-ugnayan sa sistema. Ang pag-unawa sa engagement ay tumutulong na sukatin ang pagiging kapaki-pakinabang at pag-ampon ng platform.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang pagkakaroon ng malaking bilang ng "Repeat" (150) at "Frequent" (80) na mga taga-ulat ay isang magandang senyales ng kalusugan ng sistema. Ipinapakita nito na nakikita ng mga magsasaka ang halaga sa regular na paggamit nito. Ang bilang ng "First-time" (50) na gumagamit ay nagpapakita ng patuloy na pag-abot at pag-ampon ng mga bagong user.</p>
                <p><strong>Rekomendasyon:</strong> Mag-isip ng mga paraan upang hikayatin ang mga "First-time" na gumagamit na maging "Repeat" reporters. Maaaring ito ay sa pamamagitan ng mga follow-up na mensahe na nagtatanong kung naging kapaki-pakinabang ang payo o pagpapadala ng mga pangkalahatang tip. Kilalanin o bigyan ng insentibo ang mga "Frequent" reporters para sa kanilang patuloy na kontribusyon sa data ng komunidad.</p>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
