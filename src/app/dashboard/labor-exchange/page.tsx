
import { PlusCircle, HandCoins, Tractor, Seedling } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const inputRequests = [
    { farmer: 'Maria Clara', request: 'Binhi ng Kamatis (5 sako)', date: 'Aug 28, 2024', status: 'Nakabinbin' },
    { farmer: 'Juan dela Cruz', request: 'Urea na Pataba (2 sako)', date: 'Aug 27, 2024', status: 'Aprubado' },
];

const distributionLog = [
    { farmer: 'Gabriela Silang', item: 'Binhi ng Mais (10kg)', date: 'Aug 26, 2024', distributedBy: 'Admin' },
    { farmer: 'Jose Rizal', item: 'Pesticide (1L)', date: 'Aug 25, 2024', distributedBy: 'Admin' },
]

const laborExchange = [
    { name: 'Ricardo Dalisay', task: 'Pag-aani ng Palay (1ha)', date: 'Aug 20, 2024', location: 'San Isidro' },
    { name: 'Lito Batumbakal', task: 'Pagtatanim ng Mais (0.5ha)', date: 'Aug 25, 2024', location: 'Santa Cruz' },
];


export default function AssistancePage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng Tulong</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Pamahalaan ang mga kahilingan sa input, subaybayan ang pamamahagi, at i-coordinate ang pagpapalitan ng paggawa.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Mag-log ng Tulong
                </Button>
            </div>
            <Tabs defaultValue="requests">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="requests"><Seedling className="mr-2"/>Mga Kahilingan sa Input</TabsTrigger>
                    <TabsTrigger value="distribution"><HandCoins className="mr-2"/>Log ng Pamamahagi</TabsTrigger>
                    <TabsTrigger value="labor"><Tractor className="mr-2"/>Palitan ng Paggawa</TabsTrigger>
                </TabsList>
                <TabsContent value="requests">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mga Nakabinbing Kahilingan sa Input</CardTitle>
                            <CardDescription>Mga kahilingan ng magsasaka para sa mga binhi, pataba, at kagamitan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Magsasaka</TableHead>
                                        <TableHead>Kahilingan</TableHead>
                                        <TableHead>Petsa</TableHead>
                                        <TableHead>Katayuan</TableHead>
                                        <TableHead className="text-right">Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inputRequests.map((request) => (
                                        <TableRow key={request.farmer}>
                                            <TableCell className="font-medium">{request.farmer}</TableCell>
                                            <TableCell>{request.request}</TableCell>
                                            <TableCell>{request.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={request.status === 'Nakabinbin' ? 'secondary' : 'default'}>{request.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline">Aprubahan</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="distribution">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log ng Pamamahagi ng Tulong</CardTitle>
                             <CardDescription>Kasaysayan ng lahat ng tulong na ipinamahagi sa mga magsasaka.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Magsasaka</TableHead>
                                        <TableHead>Bagay na Ipinamahagi</TableHead>
                                        <TableHead>Ibinigay ni</TableHead>
                                        <TableHead>Petsa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {distributionLog.map((log) => (
                                        <TableRow key={log.farmer}>
                                            <TableCell className="font-medium">{log.farmer}</TableCell>
                                            <TableCell>{log.item}</TableCell>
                                            <TableCell>{log.distributedBy}</TableCell>
                                            <TableCell>{log.date}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="labor">
                    <Card>
                        <CardHeader>
                            <CardTitle>Palitan ng Paggawa (Turnohan)</CardTitle>
                            <CardDescription>I-coordinate ang pagbabahaginan ng paggawa sa komunidad para sa mga gawain sa bukid.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Magsasaka</TableHead>
                                        <TableHead>Gawain</TableHead>
                                        <TableHead>Lokasyon</TableHead>
                                        <TableHead>Petsa na Kailangan</TableHead>
                                        <TableHead className="text-right">Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {laborExchange.map((request) => (
                                        <TableRow key={request.name}>
                                            <TableCell className="font-medium">{request.name}</TableCell>
                                            <TableCell>{request.task}</TableCell>
                                            <TableCell>{request.location}</TableCell>
                                            <TableCell>{request.date}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline">Mag-alok ng Tulong</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
