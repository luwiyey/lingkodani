"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { messageToneData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  Neutral: { label: "Neutral", color: "hsl(var(--chart-1))" },
  'Nag-aalala': { label: "Nag-aalala", color: "hsl(var(--chart-2))" },
  Kritikal: { label: "Kritikal", color: "hsl(var(--destructive))" },
  Positibo: { label: "Positibo", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function MessageToneChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-end">
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
        </div>
        <div className="grid gap-0.5">
            <CardTitle>Tono ng Mensahe</CardTitle>
            <CardDescription className="text-xs">Pamamahagi ng emosyonal na tono sa mga mensahe.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="tone" />} />
            <Legend content={<ChartLegendContent nameKey="tone" />} />
            <Pie data={messageToneData} dataKey="count" nameKey="tone" innerRadius="60%">
              {messageToneData.map((entry) => (
                <Cell key={entry.tone} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan ng mensahe ay "Neutral" (250), ngunit marami rin ang "Nag-aalala" (120), na nagpapakita ng mga alalahanin ng magsasaka.</p>
      </CardFooter>
    </Card>
  )
}
