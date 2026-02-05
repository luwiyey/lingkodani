import { File, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueTrendsChart } from '@/components/reports/issue-trends-chart';
import { SmsVolumeChart } from '@/components/reports/sms-volume-chart';
import { AdviceSuccessChart } from '@/components/reports/advice-success-chart';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Visualize trends, analyze data, and gain insights.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter Date
            </Button>
            <Button>
                <File className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SmsVolumeChart />
          <AdviceSuccessChart />
          <Card>
            <CardHeader>
                <CardTitle>AI Weekly Summary</CardTitle>
                <CardDescription>AI-generated insights from this week's data.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>This week saw a <strong>25% increase</strong> in reports related to <strong className="text-foreground">pests</strong>, particularly stem borers in sugarcane and yellow spots on tomatoes.</p>
                    <p>Irrigation concerns remain steady, while requests for post-harvest advice for rice have decreased, indicating the end of the harvest season for many.</p>
                    <p><strong>Recommendation:</strong> Consider releasing a knowledge base article on organic pest control for common vegetables.</p>
                </div>
            </CardContent>
          </Card>
      </div>
      <div className="grid grid-cols-1">
        <IssueTrendsChart />
      </div>
    </div>
  );
}
