
"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { validationQueueData } from "@/lib/data"
import { ChartConfig, ChartContainer } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  value: {
    label: "Mensahe",
  },
} satisfies ChartConfig

export function ValidationQueueChart() {
  const [timeframe, setTimeframe] = useState('Kasalukuyan');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Validation Queue</CardTitle>
                <CardDescription className="text-xs">Bilang ng mga mensaheng nakabinbin vs. nalutas.</CardDescription>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{timeframe}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeframe('Kasalukuyan')}>Kasalukuyan</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
                data={validationQueueData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
            >
                <YAxis dataKey="name" type="category" ticks={[]} tickLine={false} axisLine={false} />
                <XAxis dataKey="value" type="number" hide />
                <Bar dataKey="value" layout="vertical" stackId="a" radius={5}>
                     {validationQueueData.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan sa mga mensahe (175) ay nalutas na, at kaunti na lamang (25) ang nakabinbin para sa validation.</p>
      </CardFooter>
    </Card>
  )
}
