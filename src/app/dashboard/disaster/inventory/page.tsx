
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { resources as initialResources } from '@/lib/data';
import type { Resource, ResourceCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';

type SortableKeys = keyof Omit<Resource, 'id' | 'category'>;

export default function DisasterInventoryPage() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAddResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newResource: Resource = {
      id: `RES${String(resources.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      category: formData.get('category') as ResourceCategory,
      stock: Number(formData.get('stock') as string),
      unit: formData.get('unit') as string,
      lastUpdated: new Date().toISOString(),
    };
    setResources([newResource, ...resources]);
    setAddDialogOpen(false);
    toast({ title: "Tagumpay!", description: "Matagumpay na naidagdag ang rekurso." });
  };
  
  const handleEditResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingResource) return;
    const formData = new FormData(event.currentTarget);
    const updatedResource: Resource = {
      ...editingResource,
      name: formData.get('name') as string,
      category: formData.get('category') as ResourceCategory,
      stock: Number(formData.get('stock') as string),
      unit: formData.get('unit') as string,
      lastUpdated: new Date().toISOString(),
    };
    setResources(resources.map(r => r.id === updatedResource.id ? updatedResource : r));
    setEditingResource(null);
    toast({ title: "Tagumpay!", description: "Nai-update na ang rekurso." });
  };

  const handleDeleteResource = (resourceId: string) => {
    setResources(resources.filter(r => r.id !== resourceId));
    toast({ title: "Tagumpay!", description: "Natanggal na ang rekurso sa imbentaryo.", variant: 'destructive' });
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedResources = useMemo(() => {
    let sortableItems = [...filteredResources];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredResources, sortConfig]);

  return (
    <>
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between p-4 rounded-lg bg-destructive text-destructive-foreground">
            <div className='flex items-center gap-4'>
                <AlertTriangle className="h-6 w-6" />
                 <div className="flex items-center">
                    <h1 className="text-xl font-bold tracking-tight">Imbentaryo (Disaster Mode)</h1>
                    <HelpDialog title="Disaster Inventory" tooltipText="Pamahalaan ang mga kritikal na suplay sa panahon ng sakuna.">
                        <p>Ito ay isang simplified na bersyon ng imbentaryo, na nakatuon sa mabilis na pag-access at pamamahala ng mga kritikal na suplay sa panahon ng sakuna (hal. relief goods, gamot, kagamitan sa pag-rescue).</p>
                        <p><strong>Mga Aksyon:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Magdagdag ng Rekurso:</strong> Mabilis na magdagdag ng mga bagong dating na donasyon o suplay. Punan lamang ang mga pangunahing detalye.</li>
                            <li><strong>Maghanap:</strong> Hanapin ang mga rekurso ayon sa pangalan upang mabilis na matukoy ang kanilang stock.</li>
                            <li><strong>Mag-sort:</strong> Pindutin ang mga header ng table (hal. 'Pangalan ng Rekurso', 'Kasalukuyang Stak') upang ayusin ang listahan at mabilis na makita kung ano ang pinakamarami o pinakakaunti.</li>
                            <li><strong>I-edit/Tanggalin:</strong> Mabilis na i-update ang bilang ng stock habang ipinamamahagi ang mga suplay, o tanggalin ang mga naubos na.</li>
                        </ul>
                    </HelpDialog>
                 </div>
            </div>
            <HoverTooltip text="Bumalik sa pangunahing dashboard para sa disaster response.">
                <Button asChild variant="outline" className="bg-transparent border-destructive-foreground/50 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground">
                    <Link href="/dashboard/disaster-mode">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Bumalik sa Disaster Dashboard
                    </Link>
                </Button>
            </HoverTooltip>
        </div>
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <HoverTooltip text="Mag-type dito upang mabilis na mahanap ang isang partikular na rekurso.">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                    type="search"
                    placeholder="Maghanap ng rekurso..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              </HoverTooltip>
              <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <HoverTooltip text="Magdagdag ng bagong item sa imbentaryo, tulad ng relief goods o gamot.">
                      <Button><PlusCircle /> Magdagdag ng Rekurso</Button>
                  </HoverTooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Magdagdag ng Bagong Rekurso</DialogTitle>
                    <DialogDescription>Punan ang mga detalye ng bagong rekurso sa imbentaryo.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddResource}>
                    <div className="grid gap-4 py-4">
                      <HoverTooltip text="Pangalan ng item, hal. 'Bigas', 'Sardinas'">
                          <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Pangalan</Label>
                          <Input id="name" name="name" required className="col-span-3" />
                          </div>
                      </HoverTooltip>
                      <HoverTooltip text="Piliin ang kategorya ng item.">
                          <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">Kategorya</Label>
                          <Select name="category" required>
                              <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Pumili ng kategorya" />
                              </SelectTrigger>
                              <SelectContent>
                              <SelectItem value="Pataba">Pataba</SelectItem>
                              <SelectItem value="Binhi">Binhi</SelectItem>
                              <SelectItem value="Kagamitan">Kagamitan</SelectItem>
                              <SelectItem value="Paggawa">Paggawa</SelectItem>
                              </SelectContent>
                          </Select>
                          </div>
                      </HoverTooltip>
                      <HoverTooltip text="Ilang piraso o dami ang mayroon?">
                          <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="stock" className="text-right">Stak</Label>
                          <Input id="stock" name="stock" type="number" required className="col-span-3" />
                          </div>
                      </HoverTooltip>
                      <HoverTooltip text="Paano ito binibilang? (hal. sako, lata, bote, yunit)">
                          <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="unit" className="text-right">Yunit</Label>
                          <Input id="unit" name="unit" placeholder="hal. sako, yunit, bote" required className="col-span-3" />
                          </div>
                      </HoverTooltip>
                    </div>
                    <DialogFooter>
                      <HoverTooltip text="Isara ang window na ito nang walang pagbabago."><DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose></HoverTooltip>
                      <HoverTooltip text="I-save ang bagong rekurso sa imbentaryo."><Button type="submit">I-save ang Rekurso</Button></HoverTooltip>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                        <HoverTooltip text="Pindutin upang i-sort ayon sa pangalan (A-Z o Z-A).">
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('name')}>
                                <div className="flex items-center">
                                    Pangalan ng Rekurso
                                    <div className="w-8 flex-shrink-0 flex justify-center">
                                        {sortConfig?.key === 'name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                    </div>
                                </div>
                            </TableHead>
                        </HoverTooltip>
                      <TableHead>Kategorya</TableHead>
                      <HoverTooltip text="Pindutin upang i-sort ayon sa dami (pataas o pababa).">
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('stock')}>
                                <div className="flex items-center">
                                    Kasalukuyang Stak
                                    <div className="w-8 flex-shrink-0 flex justify-center">
                                        {sortConfig?.key === 'stock' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                    </div>
                                </div>
                            </TableHead>
                        </HoverTooltip>
                        <HoverTooltip text="Pindutin upang i-sort ayon sa yunit (A-Z o Z-A).">
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('unit')}>
                                <div className="flex items-center">
                                    Yunit
                                    <div className="w-8 flex-shrink-0 flex justify-center">
                                        {sortConfig?.key === 'unit' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                    </div>
                                </div>
                            </TableHead>
                        </HoverTooltip>
                        <HoverTooltip text="Pindutin upang i-sort ayon sa petsa (bago o luma).">
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('lastUpdated')}>
                                <div className="flex items-center">
                                    Huling Na-update
                                    <div className="w-8 flex-shrink-0 flex justify-center">
                                        {sortConfig?.key === 'lastUpdated' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                                    </div>
                                </div>
                            </TableHead>
                        </HoverTooltip>
                      <TableHead className="text-right">Mga Aksyon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium break-words">{resource.name}</TableCell>
                        <TableCell><Badge variant="secondary">{resource.category}</Badge></TableCell>
                        <TableCell>{resource.stock}</TableCell>
                        <TableCell className="break-words">{resource.unit}</TableCell>
                        <TableCell className="break-words">{isClient ? new Date(resource.lastUpdated).toLocaleDateString() : ''}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <HoverTooltip text="I-edit ang mga detalye ng rekurso na ito.">
                                <Button variant="outline" size="sm" onClick={() => setEditingResource(resource)}><Edit /></Button>
                              </HoverTooltip>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <HoverTooltip text="Permanenteng tanggalin ang rekurso na ito.">
                                        <Button variant="destructive" size="sm"><Trash2 /></Button>
                                    </HoverTooltip>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Sigurado ka ba?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ang aksyon na ito ay hindi na maaaring bawiin. Permanenteng tatanggalin nito ang rekurso.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteResource(resource.id)}>Ituloy</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
      </div>

       {editingResource && (
        <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>I-edit ang Rekurso</DialogTitle>
                <DialogDescription>I-update ang mga detalye para sa {editingResource.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditResource}>
                  <div className="grid gap-4 py-4">
                     <HoverTooltip text="Baguhin ang pangalan ng item.">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">Pangalan</Label>
                        <Input id="edit-name" name="name" defaultValue={editingResource.name} required className="col-span-3" />
                        </div>
                    </HoverTooltip>
                    <HoverTooltip text="Baguhin ang kategorya ng item.">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-category" className="text-right">Kategorya</Label>
                        <Select name="category" defaultValue={editingResource.category} required>
                            <SelectTrigger className="col-span-3">
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="Pataba">Pataba</SelectItem>
                            <SelectItem value="Binhi">Binhi</SelectItem>
                            <SelectItem value="Kagamitan">Kagamitan</SelectItem>
                            <SelectItem value="Paggawa">Paggawa</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                    </HoverTooltip>
                    <HoverTooltip text="I-update ang kasalukuyang bilang o dami.">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-stock" className="text-right">Stak</Label>
                        <Input id="edit-stock" name="stock" type="number" defaultValue={editingResource.stock} required className="col-span-3" />
                        </div>
                    </HoverTooltip>
                    <HoverTooltip text="Baguhin ang yunit ng pagsukat.">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-unit" className="text-right">Yunit</Label>
                        <Input id="edit-unit" name="unit" defaultValue={editingResource.unit} required className="col-span-3" />
                        </div>
                    </HoverTooltip>
                  </div>
                  <DialogFooter>
                    <HoverTooltip text="Isara nang hindi sine-save ang mga pagbabago."><DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose></HoverTooltip>
                    <HoverTooltip text="I-save ang mga na-update na detalye."><Button type="submit">I-save</Button></HoverTooltip>
                  </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
