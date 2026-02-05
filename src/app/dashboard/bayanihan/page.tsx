
'use client';
import { PlusCircle, HandCoins, Tractor, Users, Truck, Sparkles, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const toolRegistry = [
    { name: 'Hand Tractor', owner: 'Mang Jose', status: 'Magagamit', contact: '0917-xxx-xxxx' },
    { name: 'Thresher', owner: 'Brgy. San Isidro', status: 'Ginagamit', contact: 'Brgy. Hall' },
    { name: 'Water Pump', owner: 'Aling Maria', status: 'Magagamit', contact: '0918-xxx-xxxx' },
];

const laborExchange = [
    { name: 'Ricardo Dalisay', task: 'Pag-aani ng Palay (1ha)', date: 'Aug 20, 2024', location: 'San Isidro', status: 'Bukas' },
    { name: 'Lito Batumbakal', task: 'Pagtatanim ng Mais (0.5ha)', date: 'Aug 25, 2024', location: 'Santa Cruz', status: 'Puno na' },
];

const truckingScheduler = [
    { driver: 'Cardo Dalisay', date: 'Sept 5, 2024', route: 'Brgy. San Isidro hanggang Municipal Bagsakan', capacity: '50 sako', status: 'Naka-iskedyul' },
    { driver: 'Benny', date: 'Sept 7, 2024', route: 'Brgy. Santa Cruz hanggang Provincial Trading Post', capacity: '70 sako', status: 'Magagamit' },
]

const volunteers = [
    { name: 'Alyssa Valdez', skill: 'First Aid', availability: 'Weekends', status: 'Handa' },
    { name: 'Juan Gomez de Liaño', skill: 'Pagmamaneho ng Truck', availability: 'Kahit kailan', status: 'Na-deploy' },
]

export default function BayanihanPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Bayanihan &amp; Logistics Hub</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        I-coordinate ang pagbabahaginan ng rekurso, paggawa, transportasyon, at tulong sa emergency sa loob ng komunidad.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Magdagdag ng Entry
                </Button>
            </div>
            <Tabs defaultValue="labor">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="labor"><Users className="mr-2"/>Turnohan (Palitan ng Paggawa)</TabsTrigger>
                    <TabsTrigger value="tools"><Tractor className="mr-2"/>Rehistro ng Kagamitan</TabsTrigger>
                    <TabsTrigger value="logistics"><Truck className="mr-2"/>Iskedyul ng Biyahe</TabsTrigger>
                    <TabsTrigger value="volunteers"><Sparkles className="mr-2"/>Pagtutugma ng Boluntaryo</TabsTrigger>
                </TabsList>
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
                                        <TableHead>Katayuan</TableHead>
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
                                            <TableCell>
                                                <Badge variant={request.status === 'Bukas' ? 'secondary' : 'default'}>{request.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" disabled={request.status !== 'Bukas'}>Mag-alok ng Tulong</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="tools">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rehistro ng mga Kagamitan</CardTitle>
                             <CardDescription>Listahan ng mga kagamitang maaaring hiramin o ibahagi sa komunidad.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kagamitan</TableHead>
                                        <TableHead>May-ari</TableHead>
                                        <TableHead>Katayuan</TableHead>
                                        <TableHead>Kontak</TableHead>
                                        <TableHead className="text-right">Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {toolRegistry.map((log) => (
                                        <TableRow key={log.name}>
                                            <TableCell className="font-medium">{log.name}</TableCell>
                                            <TableCell>{log.owner}</TableCell>
                                            <TableCell>
                                                 <Badge variant={log.status === 'Magagamit' ? 'default' : 'secondary'}>{log.status}</Badge>
                                            </TableCell>
                                            <TableCell>{log.contact}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" disabled={log.status !== 'Magagamit'}>Hilingin na Hiramin</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="logistics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Iskedyul ng Biyahe</CardTitle>
                            <CardDescription>I-coordinate ang shared logistics para sa pagdadala ng mga produkto sa bagsakan.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Ruta</TableHead>
                                        <TableHead>Petsa</TableHead>
                                        <TableHead>Kapasidad</TableHead>
                                        <TableHead>Katayuan</TableHead>
                                        <TableHead className="text-right">Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {truckingScheduler.map((request) => (
                                        <TableRow key={request.driver}>
                                            <TableCell className="font-medium">{request.driver}</TableCell>
                                            <TableCell>{request.route}</TableCell>
                                            <TableCell>{request.date}</TableCell>
                                             <TableCell>{request.capacity}</TableCell>
                                            <TableCell>
                                                <Badge variant={request.status === 'Magagamit' ? 'default' : 'secondary'}>{request.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" disabled={request.status !== 'Magagamit'}>Sumali sa Biyahe</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="volunteers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pagtutugma ng Boluntaryo para sa Kalamidad</CardTitle>
                            <CardDescription>Maghanap at mag-deploy ng mga boluntaryo na may tamang kasanayan sa panahon ng emergency.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pangalan</TableHead>
                                        <TableHead>Kasanayan</TableHead>
                                        <TableHead>Availability</TableHead>
                                        <TableHead>Katayuan</TableHead>
                                        <TableHead className="text-right">Aksyon</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {volunteers.map((v) => (
                                        <TableRow key={v.name}>
                                            <TableCell className="font-medium">{v.name}</TableCell>
                                            <TableCell>{v.skill}</TableCell>
                                            <TableCell>{v.availability}</TableCell>
                                            <TableCell>
                                                <Badge variant={v.status === 'Handa' ? 'default' : 'secondary'}>{v.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" disabled={v.status !== 'Handa'}>I-deploy</Button>
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

    