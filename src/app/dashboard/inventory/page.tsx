
'use client';
import React, { useState, useMemo } from 'react';
import { resources as initialResources } from '@/lib/data';
import type { Resource, ResourceCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, Upload, Download, ArrowUp, ArrowDown, Filter, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
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
import { Calendar } from "@/components/ui/calendar";

type SortableKeys = keyof Omit<Resource, 'id' | 'category'>;

export default function InventoryPage() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<{
    categories: ResourceCategory[];
    kagamitan: string[];
  }>({
    categories: [],
    kagamitan: [],
  });

  const [stockFilter, setStockFilter] = useState<number | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [tempStock, setTempStock] = useState<string>("");
  const [tempUnit, setTempUnit] = useState<string>("");

  const [isStockDialogOpen, setStockDialogOpen] = useState(false);
  const [isUnitDialogOpen, setUnitDialogOpen] = useState(false);
  const [isDateDialogOpen, setDateDialogOpen] = useState(false);

  const allKagamitan = [...new Set(resources.filter(r => r.category === 'Kagamitan').map(r => r.name))];


  const handleFilterChange = (
    type: 'categories' | 'kagamitan',
    value: string
    ) => {
    setFilters(prev => {
        const currentValues = prev[type];
        const newValues = currentValues.includes(value as never)
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value as never];
        return { ...prev, [type]: newValues };
    });
  };

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

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
        const searchMatch = resource.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const hasCategoryFilters = filters.categories.length > 0;
        const hasKagamitanFilters = filters.kagamitan.length > 0;

        const filterMatch = (() => {
            if (!hasCategoryFilters && !hasKagamitanFilters) return true;

            const categoryMatch = hasCategoryFilters && filters.categories.includes(resource.category);
            const kagamitanMatch = hasKagamitanFilters && resource.category === 'Kagamitan' && filters.kagamitan.includes(resource.name);
            
            return categoryMatch || kagamitanMatch;
        })();

        const stockMatch = stockFilter === null || resource.stock >= stockFilter;
        const unitMatch = unitFilter === '' || resource.unit.toLowerCase().includes(unitFilter.toLowerCase());
        const dateMatch = !dateFilter || new Date(resource.lastUpdated) >= dateFilter;

        return searchMatch && filterMatch && stockMatch && unitMatch && dateMatch;
    });
  }, [resources, searchTerm, filters, stockFilter, unitFilter, dateFilter]);


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
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Mga Opsyon sa Filter</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Para sa Pananim</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuCheckboxItem checked={filters.categories.includes('Pataba')} onCheckedChange={() => handleFilterChange('categories', 'Pataba')}>
                        Pataba
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={filters.categories.includes('Binhi')} onCheckedChange={() => handleFilterChange('categories', 'Binhi')}>
                        Binhi
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <span>Kagamitan</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {allKagamitan.map((item) => (
                                <DropdownMenuCheckboxItem
                                    key={item}
                                    checked={filters.kagamitan.includes(item)}
                                    onCheckedChange={() => handleFilterChange('kagamitan', item)}
                                >
                                    {item}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuCheckboxItem
                    checked={filters.categories.includes('Paggawa')}
                    onCheckedChange={() => handleFilterChange('categories', 'Paggawa')}
                >
                    Paggawa
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => setStockDialogOpen(true)}>
                  Salain ayon sa Stak
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setUnitDialogOpen(true)}>
                  Salain ayon sa Yunit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDateDialogOpen(true)}>
                  Salain ayon sa Petsa
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
        </div>


        <Card>
          <CardContent className="p-0">
            <Table>
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
                    <TableCell>{resource.unit}</TableCell>
                    <TableCell>{new Date(resource.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
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

      <Dialog open={isStockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Salain ayon sa Minimum na Stak</DialogTitle>
            </DialogHeader>
            <Input type="number" placeholder="Ilagay ang minimum na stak" value={tempStock} onChange={(e) => setTempStock(e.target.value)} />
            <DialogFooter>
                <Button variant="secondary" onClick={() => { setStockFilter(null); setTempStock(""); setStockDialogOpen(false); }}>Alisin</Button>
                <Button onClick={() => { setStockFilter(Number(tempStock)); setStockDialogOpen(false); }}>Itakda ang Filter</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUnitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Salain ayon sa Yunit</DialogTitle>
            </DialogHeader>
            <Input placeholder="Ilagay ang yunit" value={tempUnit} onChange={(e) => setTempUnit(e.target.value)} />
            <DialogFooter>
                <Button variant="secondary" onClick={() => { setUnitFilter(""); setTempUnit(""); setUnitDialogOpen(false); }}>Alisin</Button>
                <Button onClick={() => { setUnitFilter(tempUnit); setUnitDialogOpen(false); }}>Itakda ang Filter</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Salain ayon sa Petsa</DialogTitle>
                <DialogDescription>Ipakita ang mga rekurso na na-update sa o pagkatapos ng petsang ito.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  defaultMonth={new Date(2026, 0)}
                  className="rounded-md border"
              />
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => { setDateFilter(undefined); setDateDialogOpen(false); }}>Alisin</Button>
                <Button onClick={() => setDateDialogOpen(false)}>Itakda ang Filter</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    