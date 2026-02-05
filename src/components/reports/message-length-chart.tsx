"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { messageLengthData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  count: {
    label: "Bilang ng Mensahe",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function MessageLengthChart() {
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
            <CardTitle>Haba ng Mensahe</CardTitle>
            <CardDescription className="text-xs">Pamamahagi ng haba ng mga mensahe.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={messageLengthData} accessibilityLayer>
              <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan sa mga mensahe (250) ay may haba na 21-80 characters, na mainam para sa SMS.</p>
      </CardFooter>
    </Card>
  )
}
