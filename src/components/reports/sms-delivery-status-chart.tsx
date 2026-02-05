
"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { smsDeliveryStatusData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  Napadala: { label: "Napadala", color: "hsl(var(--chart-1))" },
  Nabigo: { label: "Nabigo", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SmsDeliveryStatusChart() {
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
            <CardTitle>Katayuan ng Pagpapadala ng SMS</CardTitle>
            <CardDescription className="text-xs">Rate ng tagumpay sa pagpapadala ng mga mensahe.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={smsDeliveryStatusData} dataKey="value" nameKey="name" innerRadius="60%">
              {smsDeliveryStatusData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: 99.5% ng mga mensahe ay matagumpay na naipadala, na nagpapahiwatig ng mataas na pagiging maaasahan ng sistema.</p>
      </CardFooter>
    </Card>
  )
}
