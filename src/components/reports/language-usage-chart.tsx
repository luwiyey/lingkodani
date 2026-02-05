"use client"

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { languageUsageData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
    Tagalog: { label: "Tagalog", color: "hsl(var(--chart-1))" },
    Taglish: { label: "Taglish", color: "hsl(var(--chart-2))" },
    Ilocano: { label: "Ilocano", color: "hsl(var(--chart-3))" },
    English: { label: "English", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function LanguageUsageChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
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
            <CardTitle>Paggamit ng Wika</CardTitle>
            <CardDescription>Pamamahagi ng mga wikang ginagamit sa mga SMS.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="language" />} />
                    <Legend content={<ChartLegendContent nameKey="language"/>} />
                    <Pie data={languageUsageData} dataKey="value" nameKey="language" innerRadius="50%" outerRadius="80%">
                         {languageUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: 65% ng mga mensahe ay nasa purong Tagalog, na ginagawa itong pangunahing wika para sa komunikasyon.</p>
      </CardFooter>
    </Card>
  )
}
