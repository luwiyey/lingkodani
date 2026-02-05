import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const seekingHelp = [
    { name: 'Ricardo Dalisay', task: 'Pag-aani ng Palay (1ha)', date: 'Aug 20, 2024' },
    { name: 'Lito Batumbakal', task: 'Pagtatanim ng Mais (0.5ha)', date: 'Aug 25, 2024' },
];

export default function LaborExchangePage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Palitan ng Trabaho (Turnohan)</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        I-coordinate ang pagbabahaginan ng paggawa sa komunidad para sa mga gawain tulad ng pagtatanim at pag-aani.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Mag-post ng Hiling
                </Button>
            </div>
            <Tabs defaultValue="seeking">
                <TabsList>
                    <TabsTrigger value="seeking">Naghahanap ng Tulong</TabsTrigger>
                    <TabsTrigger value="offering">Nag-aalok ng Tulong</TabsTrigger>
                    <TabsTrigger value="log">Log ng Aktibidad</TabsTrigger>
                </TabsList>
                <TabsContent value="seeking">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mga Magsasakang Naghahanap ng Tulong</CardTitle>
                            <CardDescription>Mga miyembro ng komunidad na humiling ng tulong.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Magsasaka</TableHead>
                                        <TableHead>Gawain</TableHead>
                                        <TableHead>Petsa na Kailangan</TableHead>
                                        <TableHead>Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {seekingHelp.map((request) => (
                                        <TableRow key={request.name}>
                                            <TableCell className="font-medium">{request.name}</TableCell>
                                            <TableCell>{request.task}</TableCell>
                                            <TableCell>{request.date}</TableCell>
                                            <TableCell>
                                                <Button variant="outline">Mag-alok ng Tulong</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="offering">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mga Miyembrong Nag-aalok ng Tulong</CardTitle>
                             <CardDescription>Mga miyembro ng komunidad na handang tumulong.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Malapit na.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="log">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log ng Aktibidad</CardTitle>
                            <CardDescription>Kasaysayan ng mga nakumpletong palitan ng trabaho.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Malapit na.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
