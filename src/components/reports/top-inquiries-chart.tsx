"use client"

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { topInquiriesData } from "@/lib/data";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function TopInquiriesChart() {
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
            <CardTitle>Pinakakaraniwang Uri ng Tanong</CardTitle>
            <CardDescription className="text-xs">Mga pinakamadalas na tanong ng mga magsasaka.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInquiriesData} layout="vertical" margin={{ left: 20, right: 20 }}>
                     <XAxis type="number" hide />
                     <YAxis 
                        dataKey="question" 
                        type="category" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        width={120}
                     />
                     <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                     <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Ang tanong na "Gamot sa peste?" (88) ang pinakamadalas, na nagpapakita ng pangunahing pangangailangan para sa solusyon sa peste.</p>
      </CardFooter>
    </Card>
  )
}
