
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const seekingHelp = [
    { name: 'Ricardo Dalisay', task: 'Pag-aani ng Palay (1ha)', date: 'Aug 20, 2024', location: 'San Isidro' },
    { name: 'Lito Batumbakal', task: 'Pagtatanim ng Mais (0.5ha)', date: 'Aug 25, 2024', location: 'Santa Cruz' },
];

const offeringHelp = [
    { name: 'Emilio Aguinaldo', skills: 'Pag-aani, Pagtatanim', availability: 'Weekends', location: 'Mabini' },
    { name: 'Apolinario Mabini', skills: 'Pagmamaneho ng Tractor', availability: 'Martes, Huwebes', location: 'Tondo' },
];

const activityLog = [
    { seeker: 'Ricardo Dalisay', offerer: 'Apolinario Mabini', task: 'Pag-aani ng Palay', completedDate: 'Aug 21, 2024' },
    { seeker: 'Lito Batumbakal', offerer: 'Emilio Aguinaldo', task: 'Pagtatanim ng Mais', completedDate: 'Aug 26, 2024' },
]

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
                    Mag-post ng Kahilingan
                </Button>
            </div>
            <Tabs defaultValue="seeking">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="seeking">Naghahanap ng Tulong</TabsTrigger>
                    <TabsTrigger value="offering">Nag-aalok ng Tulong</TabsTrigger>
                    <TabsTrigger value="log">Log ng Aktibidad</TabsTrigger>
                </TabsList>
                <TabsContent value="seeking">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mga Magsasakang Nangangailangan ng Tulong</CardTitle>
                            <CardDescription>Mga miyembro ng komunidad na kasalukuyang humihiling ng tulong sa paggawa.</CardDescription>
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
                                    {seekingHelp.map((request) => (
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
                 <TabsContent value="offering">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mga Miyembrong Nag-aalok ng Tulong</CardTitle>
                             <CardDescription>Mga miyembro ng komunidad na handang magbigay ng kanilang paggawa.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pangalan</TableHead>
                                        <TableHead>Mga Kasanayan</TableHead>
                                        <TableHead>Lokasyon</TableHead>
                                        <TableHead>Availability</TableHead>
                                        <TableHead className="text-right">Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {offeringHelp.map((offer) => (
                                        <TableRow key={offer.name}>
                                            <TableCell className="font-medium">{offer.name}</TableCell>
                                            <TableCell>{offer.skills}</TableCell>
                                            <TableCell>{offer.location}</TableCell>
                                            <TableCell>{offer.availability}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline">Makipag-ugnayan</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="log">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log ng Aktibidad ng Turnohan</CardTitle>
                            <CardDescription>Kasaysayan ng mga nakumpletong palitan ng trabaho sa komunidad.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Humiling</TableHead>
                                        <TableHead>Nag-alok</TableHead>
                                        <TableHead>Gawain</TableHead>
                                        <TableHead>Petsa ng Pagtatapos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityLog.map((log, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{log.seeker}</TableCell>
                                            <TableCell>{log.offerer}</TableCell>
                                            <TableCell>{log.task}</TableCell>
                                            <TableCell>{log.completedDate}</TableCell>
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
