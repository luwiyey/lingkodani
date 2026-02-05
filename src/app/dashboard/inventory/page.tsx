
'use client';
import React, { useState } from 'react';
import { resources as initialResources } from '@/lib/data';
import type { Resource, ResourceCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, Upload, Download } from 'lucide-react';
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

export default function InventoryPage() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const { toast } = useToast();

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

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Imbentaryo ng Rekurso</h1>
            <p className="text-muted-foreground">Pamahalaan ang mga pataba, binhi, kasangkapan, at iba pang rekurso ng barangay.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Upload /> Mag-import</Button>
            <Button variant="outline"><Download /> I-export</Button>
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
           <Button variant="outline">Salain</Button>
           <Button variant="outline">Pagbukud-bukurin</Button>
        </div>


        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pangalan ng Rekurso</TableHead>
                  <TableHead>Kategorya</TableHead>
                  <TableHead>Kasalukuyang Stak</TableHead>
                  <TableHead>Yunit</TableHead>
                  <TableHead>Huling Na-update</TableHead>
                  <TableHead className="text-right">Mga Aksyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell><Badge variant="secondary">{resource.category}</Badge></TableCell>
                    <TableCell>{resource.stock}</TableCell>
                    <TableCell>{resource.unit}</TableCell>
                    <TableCell>{new Date(resource.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
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
                    <Button type="submit">I-save ang Pagbabago</Button>
                  </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    