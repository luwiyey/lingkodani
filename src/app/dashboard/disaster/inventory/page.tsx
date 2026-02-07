
'use client';

import React, { useState, useMemo } from 'react';
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

type SortableKeys = keyof Omit<Resource, 'id' | 'category'>;

function DisasterInventory() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const { toast } = useToast();

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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Imbentaryo (Disaster Mode)</h1>
            <p className="text-muted-foreground">Pamahalaan ang mga kritikal na rekurso habang may sakuna.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><PlusCircle /> Magdagdag ng Rekurso</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Magdagdag ng Bagong Rekurso</DialogTitle>
                  <DialogDescription>Punan ang mga detalye ng bagong rekurso sa imbentaryo.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddResource}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Pangalan</Label>
                      <Input id="name" name="name" required className="col-span-3" />
                    </div>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stock" className="text-right">Stak</Label>
                      <Input id="stock" name="stock" type="number" required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unit" className="text-right">Yunit</Label>
                      <Input id="unit" name="unit" placeholder="hal. sako, yunit, bote" required className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                    <Button type="submit">I-save ang Rekurso</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Maghanap ng rekurso..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('name')}>
                     <div className="flex items-center">
                        Pangalan ng Rekurso
                        <div className="w-8 flex-shrink-0 flex justify-center">
                            {sortConfig?.key === 'name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                    </div>
                  </TableHead>
                  <TableHead>Kategorya</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('stock')}>
                    <div className="flex items-center">
                        Kasalukuyang Stak
                        <div className="w-8 flex-shrink-0 flex justify-center">
                            {sortConfig?.key === 'stock' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('unit')}>
                    <div className="flex items-center">
                        Yunit
                        <div className="w-8 flex-shrink-0 flex justify-center">
                            {sortConfig?.key === 'unit' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('lastUpdated')}>
                    <div className="flex items-center">
                        Huling Na-update
                        <div className="w-8 flex-shrink-0 flex justify-center">
                            {sortConfig?.key === 'lastUpdated' && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        </div>
                    </div>
                  </TableHead>
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
                    <TableCell className="break-words">{new Date(resource.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                           <Button variant="outline" size="sm" onClick={() => setEditingResource(resource)}><Edit /></Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 /></Button></AlertDialogTrigger>
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

       {editingResource && (
        <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>I-edit ang Rekurso</DialogTitle>
                <DialogDescription>I-update ang mga detalye para sa {editingResource.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditResource}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-name" className="text-right">Pangalan</Label>
                      <Input id="edit-name" name="name" defaultValue={editingResource.name} required className="col-span-3" />
                    </div>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-stock" className="text-right">Stak</Label>
                      <Input id="edit-stock" name="stock" type="number" defaultValue={editingResource.stock} required className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-unit" className="text-right">Yunit</Label>
                      <Input id="edit-unit" name="unit" defaultValue={editingResource.unit} required className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                    <Button type="submit">I-save</Button>
                  </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}


export default function DisasterInventoryPage() {
    return (
         <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive text-destructive-foreground">
                <div className='flex items-center gap-4'>
                    <AlertTriangle className="h-6 w-6" />
                    <h1 className="text-xl font-bold tracking-tight">Disaster Inventory Management</h1>
                </div>
                <Button asChild variant="outline" className="bg-transparent border-destructive-foreground/50 text-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground">
                    <Link href="/dashboard/disaster-mode">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Bumalik sa Disaster Dashboard
                    </Link>
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <DisasterInventory />
            </div>
        </div>
    );
}
