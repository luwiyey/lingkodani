
"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { clarificationNeededData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  "Nangailangan ng Clarification": { label: "Nangailangan ng Clarification", color: "hsl(var(--chart-2))" },
  "Hindi Kinailangan": { label: "Hindi Kinailangan", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ClarificationNeededChart() {
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
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="grid gap-0.5">
            <CardTitle>Mga Mensaheng Kailangan ng Paglilinaw</CardTitle>
            <CardDescription className="text-xs">Mga kaso kung saan mababa ang kumpiyansa ng AI.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={clarificationNeededData} dataKey="value" nameKey="name" innerRadius="60%">
              {clarificationNeededData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: 18% lamang ng mga mensahe ang nangailangan ng paglilinaw, na nagpapakita na nauunawaan ng AI ang karamihan sa mga mensahe sa unang subok.</p>
      </CardFooter>
    </Card>
  )
}
