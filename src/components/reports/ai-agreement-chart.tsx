
"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { aiAgreementData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  "Approved As-is": { label: "Inaprubahan (Walang Edit)", color: "hsl(var(--chart-1))" },
  Revised: { label: "Binago", color: "hsl(var(--chart-2))" },
  Rejected: { label: "Tinanggihan", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AIAgreementChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pagkakatugma ng AI at Expert</CardTitle>
            <CardDescription className="text-xs">Porsyento ng mga payo ng AI na inaprubahan nang walang pag-edit.</CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={aiAgreementData} dataKey="value" nameKey="name" innerRadius="60%">
              {aiAgreementData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: 75% ng mga output ng AI ay inaprubahan ng mga eksperto nang walang pag-edit, na nagpapakita ng malakas na pagkakasundo.</p>
      </CardFooter>
    </Card>
  )
}
