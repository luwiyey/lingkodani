'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  Resource,
  ResourceCategory,
  ResourceInventoryGroup,
  ResourceInventoryUse,
} from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Download,
  Edit,
  Filter,
  PlusCircle,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useData } from '@/context/data-context';
import {
  extractResourcesFromJson,
  formatResourcesAsCsv,
  parseResourcesCsv,
} from '@/lib/data-portability';
import {
  enrichResource,
  inferResourceMetadata,
  RESOURCE_CATEGORY_OPTIONS,
  RESOURCE_GROUP_OPTIONS,
  RESOURCE_SUBCATEGORY_OPTIONS,
  RESOURCE_USE_OPTIONS,
} from '@/lib/resource-taxonomy';
import { isSpreadsheetExtension, readSpreadsheetAsCsv } from '@/lib/spreadsheet-import';
import { cn } from '@/lib/utils';

type SortableKeys = 'name' | 'stock' | 'unit' | 'lastUpdated';
type DateWindow = 'all' | 'today' | '7days' | '30days' | '90days';
type StockStatusFilter = 'all' | 'available' | 'low' | 'out';
type FilterValue<T extends string> = T | 'all';

type ResourceDraft = {
  name: string;
  category: ResourceCategory;
  inventoryGroup: ResourceInventoryGroup;
  subcategory: string;
  intendedUse: ResourceInventoryUse;
  stock: string;
  unit: string;
};

type ResourceUpsertData = {
  name: string;
  category: ResourceCategory;
  inventoryGroup?: ResourceInventoryGroup;
  subcategory?: string;
  intendedUse?: ResourceInventoryUse;
  stock: number;
  unit: string;
};

const DEFAULT_RESOURCE_DRAFT: ResourceDraft = {
  name: '',
  category: 'Pataba',
  inventoryGroup: 'Para sa Pananim',
  subcategory: 'Pataba',
  intendedUse: 'Pagpapalago at Pagpapataba',
  stock: '',
  unit: '',
};

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function normalizeResourceKey(name: string, category: ResourceCategory) {
  return `${category}:${name.trim().toLowerCase()}`;
}

function formatDateForInput(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function formatResourceDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Walang petsa';
  }

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getResourceStockState(resource: Resource) {
  if (resource.stock <= 0) {
    return 'out';
  }

  if (resource.category === 'Kagamitan') {
    return resource.stock <= 2 ? 'low' : 'available';
  }

  if (resource.category === 'Paggawa') {
    return resource.stock <= 5 ? 'low' : 'available';
  }

  return resource.stock <= 10 ? 'low' : 'available';
}

function getStockBadgeCopy(resource: Resource) {
  const stockState = getResourceStockState(resource);

  if (stockState === 'out') {
    return {
      label: 'Ubos',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  if (stockState === 'low') {
    return {
      label: 'Mababa',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'May stock',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
}

function matchesDateWindow(resourceDate: string, dateWindow: DateWindow) {
  if (dateWindow === 'all') {
    return true;
  }

  const date = new Date(resourceDate);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateWindow === 'today') {
    return date >= startOfToday;
  }

  const dayCount = dateWindow === '7days' ? 7 : dateWindow === '30days' ? 30 : 90;
  const threshold = new Date(startOfToday);
  threshold.setDate(threshold.getDate() - dayCount);
  return date >= threshold;
}

function createResourceDraft(resource?: Resource): ResourceDraft {
  const enriched = resource ? enrichResource(resource) : null;

  if (!enriched) {
    return DEFAULT_RESOURCE_DRAFT;
  }

  return {
    name: enriched.name,
    category: enriched.category,
    inventoryGroup: enriched.inventoryGroup ?? DEFAULT_RESOURCE_DRAFT.inventoryGroup,
    subcategory: enriched.subcategory ?? DEFAULT_RESOURCE_DRAFT.subcategory,
    intendedUse: enriched.intendedUse ?? DEFAULT_RESOURCE_DRAFT.intendedUse,
    stock: String(enriched.stock),
    unit: enriched.unit,
  };
}

function buildDraftFromCategory(currentDraft: ResourceDraft, category: ResourceCategory): ResourceDraft {
  const inferred = inferResourceMetadata({
    name: currentDraft.name,
    category,
    inventoryGroup: undefined,
    subcategory: undefined,
    intendedUse: undefined,
  });

  return {
    ...currentDraft,
    category,
    inventoryGroup: inferred.inventoryGroup ?? currentDraft.inventoryGroup,
    subcategory: inferred.subcategory ?? currentDraft.subcategory,
    intendedUse: inferred.intendedUse ?? currentDraft.intendedUse,
  };
}

function buildDraftFromGroup(currentDraft: ResourceDraft, inventoryGroup: ResourceInventoryGroup): ResourceDraft {
  const fallbackSubcategory = RESOURCE_SUBCATEGORY_OPTIONS[inventoryGroup][0] ?? currentDraft.subcategory;

  return {
    ...currentDraft,
    inventoryGroup,
    subcategory: RESOURCE_SUBCATEGORY_OPTIONS[inventoryGroup].includes(currentDraft.subcategory)
      ? currentDraft.subcategory
      : fallbackSubcategory,
  };
}

function parseResourceDraft(draft: ResourceDraft): ResourceUpsertData | null {
  const stock = Number(draft.stock);

  if (!draft.name.trim() || !draft.unit.trim() || !draft.subcategory.trim() || !Number.isFinite(stock)) {
    return null;
  }

  return {
    name: draft.name.trim(),
    category: draft.category,
    inventoryGroup: draft.inventoryGroup,
    subcategory: draft.subcategory.trim(),
    intendedUse: draft.intendedUse,
    stock,
    unit: draft.unit.trim(),
  };
}

type ResourceFormFieldsProps = {
  draft: ResourceDraft;
  onDraftChange: React.Dispatch<React.SetStateAction<ResourceDraft>>;
  prefix: string;
};

function ResourceFormFields({ draft, onDraftChange, prefix }: ResourceFormFieldsProps) {
  const subcategoryOptions = RESOURCE_SUBCATEGORY_OPTIONS[draft.inventoryGroup] ?? [];

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-name`} className="text-right">Pangalan</Label>
        <Input
          id={`${prefix}-name`}
          value={draft.name}
          onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))}
          required
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-category`} className="text-right">Base category</Label>
        <Select
          value={draft.category}
          onValueChange={(value) => onDraftChange((current) => buildDraftFromCategory(current, value as ResourceCategory))}
        >
          <SelectTrigger id={`${prefix}-category`} className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_CATEGORY_OPTIONS.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-group`} className="text-right">Pangkat</Label>
        <Select
          value={draft.inventoryGroup}
          onValueChange={(value) => onDraftChange((current) => buildDraftFromGroup(current, value as ResourceInventoryGroup))}
        >
          <SelectTrigger id={`${prefix}-group`} className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_GROUP_OPTIONS.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-subcategory`} className="text-right">Mas tukoy na uri</Label>
        <Select
          value={draft.subcategory}
          onValueChange={(value) => onDraftChange((current) => ({ ...current, subcategory: value }))}
        >
          <SelectTrigger id={`${prefix}-subcategory`} className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subcategoryOptions.map((subcategory) => (
              <SelectItem key={subcategory} value={subcategory}>
                {subcategory}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-use`} className="text-right">Para saan</Label>
        <Select
          value={draft.intendedUse}
          onValueChange={(value) => onDraftChange((current) => ({ ...current, intendedUse: value as ResourceInventoryUse }))}
        >
          <SelectTrigger id={`${prefix}-use`} className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_USE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-stock`} className="text-right">Stak</Label>
        <Input
          id={`${prefix}-stock`}
          type="number"
          min="0"
          value={draft.stock}
          onChange={(event) => onDraftChange((current) => ({ ...current, stock: event.target.value }))}
          required
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-unit`} className="text-right">Yunit</Label>
        <Input
          id={`${prefix}-unit`}
          value={draft.unit}
          onChange={(event) => onDraftChange((current) => ({ ...current, unit: event.target.value }))}
          placeholder="hal. sako, yunit, bote, tao"
          required
          className="col-span-3"
        />
      </div>
    </div>
  );
}

function InventoryPageContent() {
  const { resources, addResource, updateResource, deleteResource } = useData();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const importRef = React.useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<FilterValue<ResourceInventoryGroup>>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedUse, setSelectedUse] = useState<FilterValue<ResourceInventoryUse>>('all');
  const [selectedDateWindow, setSelectedDateWindow] = useState<DateWindow>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stockFilter, setStockFilter] = useState<StockStatusFilter>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({
    key: 'name',
    direction: 'ascending',
  });
  const [addDraft, setAddDraft] = useState<ResourceDraft>(DEFAULT_RESOURCE_DRAFT);
  const [editDraft, setEditDraft] = useState<ResourceDraft>(DEFAULT_RESOURCE_DRAFT);

  const focusedResourceId = searchParams.get('resource');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!focusedResourceId) {
      return;
    }

    const target = document.getElementById(`resource-row-${focusedResourceId}`);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusedResourceId, resources.length]);

  useEffect(() => {
    if (editingResource) {
      setEditDraft(createResourceDraft(editingResource));
    }
  }, [editingResource]);

  const enrichedResources = useMemo(() => resources.map((resource) => enrichResource(resource)), [resources]);

  const availableSubcategories = useMemo(() => {
    const presetSubcategories = selectedGroup === 'all'
      ? Object.values(RESOURCE_SUBCATEGORY_OPTIONS).flat()
      : RESOURCE_SUBCATEGORY_OPTIONS[selectedGroup] ?? [];

    const dataSubcategories = enrichedResources
      .filter((resource) => selectedGroup === 'all' || resource.inventoryGroup === selectedGroup)
      .map((resource) => resource.subcategory)
      .filter((subcategory): subcategory is string => Boolean(subcategory));

    return [...new Set([...presetSubcategories, ...dataSubcategories])].sort((left, right) => left.localeCompare(right));
  }, [enrichedResources, selectedGroup]);

  const handleImportSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const extension = getFileExtension(file.name);
      const text = isSpreadsheetExtension(extension)
        ? await readSpreadsheetAsCsv(file)
        : await file.text();
      const importedResources = extension === 'csv'
        ? parseResourcesCsv(text)
        : isSpreadsheetExtension(extension)
          ? parseResourcesCsv(text)
        : extension === 'json'
          ? extractResourcesFromJson(JSON.parse(text))
          : [];

      if (importedResources.length === 0) {
        throw new Error('Walang valid na resource records sa napiling file. Gumamit ng JSON, CSV, o Excel export mula sa Lingkod-Ani.');
      }

      const normalizedImports = importedResources.map((resource) => ({
        ...resource,
        ...inferResourceMetadata({
          name: resource.name,
          category: resource.category,
          inventoryGroup: resource.inventoryGroup,
          subcategory: resource.subcategory,
          intendedUse: resource.intendedUse,
        }),
      }));

      const knownKeys = new Set(resources.map((resource) => normalizeResourceKey(resource.name, resource.category)));
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const importedResource of normalizedImports) {
        const resourceKey = normalizeResourceKey(importedResource.name, importedResource.category);
        const existingResource = resources.find((resource) => (
          normalizeResourceKey(resource.name, resource.category) === resourceKey
        ));

        if (existingResource) {
          updateResource(existingResource.id, importedResource);
          updatedCount += 1;
          continue;
        }

        if (knownKeys.has(resourceKey)) {
          skippedCount += 1;
          continue;
        }

        addResource(importedResource);
        createdCount += 1;
        knownKeys.add(resourceKey);
      }

      toast({
        title: 'Na-import ang imbentaryo',
        description: `${createdCount} bagong rekurso at ${updatedCount} update ang na-process mula sa "${file.name}".${skippedCount > 0 ? ` ${skippedCount} duplicate rows ang nilaktawan.` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Hindi ma-import ang imbentaryo',
        description: error instanceof Error ? error.message : 'Hindi mabasa ang import file.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  const filteredResources = useMemo(() => {
    return enrichedResources.filter((resource) => {
      const searchableText = [
        resource.name,
        resource.category,
        resource.inventoryGroup,
        resource.subcategory,
        resource.intendedUse,
        resource.unit,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const searchMatch = searchableText.includes(searchTerm.trim().toLowerCase());
      const groupMatch = selectedGroup === 'all' || resource.inventoryGroup === selectedGroup;
      const subcategoryMatch = selectedSubcategory === 'all' || resource.subcategory === selectedSubcategory;
      const useMatch = selectedUse === 'all' || resource.intendedUse === selectedUse;
      const stockState = getResourceStockState(resource);
      const stockMatch =
        stockFilter === 'all' ||
        (stockFilter === 'available' && stockState === 'available') ||
        (stockFilter === 'low' && stockState === 'low') ||
        (stockFilter === 'out' && stockState === 'out');

      const dateWindowMatch = matchesDateWindow(resource.lastUpdated, selectedDateWindow);
      const resourceDate = new Date(resource.lastUpdated);
      const fromMatch = !dateFrom || (!Number.isNaN(resourceDate.getTime()) && resourceDate >= new Date(`${dateFrom}T00:00:00`));
      const toMatch = !dateTo || (!Number.isNaN(resourceDate.getTime()) && resourceDate <= new Date(`${dateTo}T23:59:59.999`));

      return searchMatch && groupMatch && subcategoryMatch && useMatch && stockMatch && dateWindowMatch && fromMatch && toMatch;
    });
  }, [dateFrom, dateTo, enrichedResources, searchTerm, selectedDateWindow, selectedGroup, selectedSubcategory, selectedUse, stockFilter]);

  const sortedResources = useMemo(() => {
    const sortableItems = [...filteredResources];

    if (!sortConfig) {
      return sortableItems;
    }

    sortableItems.sort((left, right) => {
      const leftValue = sortConfig.key === 'lastUpdated'
        ? new Date(left.lastUpdated).getTime()
        : left[sortConfig.key];
      const rightValue = sortConfig.key === 'lastUpdated'
        ? new Date(right.lastUpdated).getTime()
        : right[sortConfig.key];

      if (leftValue < rightValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }

      return 0;
    });

    return sortableItems;
  }, [filteredResources, sortConfig]);

  const activeFilterBadges = useMemo(() => {
    const items = [
      selectedGroup !== 'all' ? selectedGroup : null,
      selectedSubcategory !== 'all' ? selectedSubcategory : null,
      selectedUse !== 'all' ? selectedUse : null,
      selectedDateWindow !== 'all'
        ? selectedDateWindow === 'today'
          ? 'Na-update ngayon'
          : selectedDateWindow === '7days'
            ? 'Na-update nitong 7 araw'
            : selectedDateWindow === '30days'
              ? 'Na-update nitong 30 araw'
              : 'Na-update nitong 90 araw'
        : null,
      stockFilter !== 'all'
        ? stockFilter === 'available'
          ? 'May stock'
          : stockFilter === 'low'
            ? 'Mababang stock'
            : 'Ubos'
        : null,
      dateFrom ? `Mula ${formatDateForInput(dateFrom)}` : null,
      dateTo ? `Hanggang ${formatDateForInput(dateTo)}` : null,
    ].filter((item): item is string => Boolean(item));

    return items;
  }, [dateFrom, dateTo, selectedDateWindow, selectedGroup, selectedSubcategory, selectedUse, stockFilter]);

  const inventorySummary = useMemo(() => {
    const lowStockCount = enrichedResources.filter((resource) => getResourceStockState(resource) === 'low').length;
    const outOfStockCount = enrichedResources.filter((resource) => getResourceStockState(resource) === 'out').length;

    return {
      total: enrichedResources.length,
      lowStockCount,
      outOfStockCount,
    };
  }, [enrichedResources]);

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'json') {
      downloadFile(
        `lingkod-ani-inventory-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(sortedResources, null, 2),
        'application/json'
      );
    } else {
      downloadFile(
        `lingkod-ani-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
        formatResourcesAsCsv(sortedResources),
        'text/csv;charset=utf-8'
      );
    }

    toast({
      title: 'Na-export ang imbentaryo',
      description: `${sortedResources.length} resource records ang naisama sa ${format.toUpperCase()} file.`,
    });
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';

    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSelectedGroup('all');
    setSelectedSubcategory('all');
    setSelectedUse('all');
    setSelectedDateWindow('all');
    setDateFrom('');
    setDateTo('');
    setStockFilter('all');
    setSearchTerm('');
  };

  const handleAddResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedDraft = parseResourceDraft(addDraft);

    if (!parsedDraft) {
      toast({
        title: 'Hindi ma-save ang rekurso',
        description: 'Kumpletuhin muna ang pangalan, uri, yunit, at wastong bilang ng stak.',
        variant: 'destructive',
      });
      return;
    }

    addResource(parsedDraft);
    setAddDraft(DEFAULT_RESOURCE_DRAFT);
    setAddDialogOpen(false);
    toast({ title: 'Tagumpay!', description: 'Matagumpay na naidagdag ang rekurso.' });
  };

  const handleEditResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingResource) {
      return;
    }

    const parsedDraft = parseResourceDraft(editDraft);

    if (!parsedDraft) {
      toast({
        title: 'Hindi ma-save ang pagbabago',
        description: 'Kumpletuhin muna ang pangalan, uri, yunit, at wastong bilang ng stak.',
        variant: 'destructive',
      });
      return;
    }

    updateResource(editingResource.id, parsedDraft);
    setEditingResource(null);
    toast({ title: 'Tagumpay!', description: 'Nai-update na ang rekurso.' });
  };

  const handleDeleteResource = (resourceId: string) => {
    deleteResource(resourceId);
    toast({ title: 'Tagumpay!', description: 'Natanggal na ang rekurso sa imbentaryo.', variant: 'destructive' });
  };

  return (
    <>
      <Input
        type="file"
        ref={importRef}
        className="hidden"
        onChange={handleImportSelect}
        accept=".json,.csv,.xls,.xlsx,application/json,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Imbentaryo ng Rekurso</h1>
            <p className="text-muted-foreground">
              Pamahalaan ang mga input, kagamitan, serbisyo, at suportang kailangan sa bukid gamit ang mas malinaw na kategorya at petsa ng update.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => importRef.current?.click()}><Upload /> Mag-import</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download /> I-export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>Export JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) {
                  setAddDraft(DEFAULT_RESOURCE_DRAFT);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button><PlusCircle /> Magdagdag ng Rekurso</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Magdagdag ng Bagong Rekurso</DialogTitle>
                  <DialogDescription>
                    Iayos ang rekurso ayon sa pangkat, mas tukoy na uri, at gamit nito para mas madaling salain sa imbentaryo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddResource}>
                  <ResourceFormFields draft={addDraft} onDraftChange={setAddDraft} prefix="add-resource" />
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setAddDialogOpen(false)}>Kanselahin</Button>
                    <Button type="submit">I-save ang Rekurso</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <section className="rounded-[calc(var(--radius)+6px)] border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Mas malinaw na filter ng imbentaryo</p>
              <p className="text-sm text-muted-foreground">
                Salain ayon sa pangkat ng rekurso, tiyak na uri, gamit sa bukid, at huling update sa kalendaryo. Tumanggap din ito ng CSV, JSON, at Excel import.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {inventorySummary.total} kabuuang rekurso
              </Badge>
              <Badge variant="secondary" className="border-amber-200 bg-amber-50 text-amber-700">
                {inventorySummary.lowStockCount} mababa ang stock
              </Badge>
              <Badge variant="secondary" className="border-red-200 bg-red-50 text-red-700">
                {inventorySummary.outOfStockCount} ubos
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.3fr),repeat(4,minmax(160px,1fr)),auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Maghanap ng rekurso, gamit, o uri..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select value={selectedGroup} onValueChange={(value) => {
              setSelectedGroup(value as FilterValue<ResourceInventoryGroup>);
              setSelectedSubcategory('all');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Pangkat ng rekurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lahat ng pangkat</SelectItem>
                {RESOURCE_GROUP_OPTIONS.map((group) => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="Mas tukoy na uri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lahat ng uri</SelectItem>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUse} onValueChange={(value) => setSelectedUse(value as FilterValue<ResourceInventoryUse>)}>
              <SelectTrigger>
                <SelectValue placeholder="Gamit sa bukid" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lahat ng gamit</SelectItem>
                {RESOURCE_USE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockStatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Katayuan ng stak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lahat ng stak</SelectItem>
                <SelectItem value="available">May stock</SelectItem>
                <SelectItem value="low">Mababang stock</SelectItem>
                <SelectItem value="out">Ubos</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" variant="outline" onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" />
              I-reset
            </Button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(180px,220px),minmax(160px,1fr),minmax(160px,1fr)]">
            <Select value={selectedDateWindow} onValueChange={(value) => setSelectedDateWindow(value as DateWindow)}>
              <SelectTrigger>
                <SelectValue placeholder="Na-update kailan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lahat ng petsa</SelectItem>
                <SelectItem value="today">Na-update ngayon</SelectItem>
                <SelectItem value="7days">Huling 7 araw</SelectItem>
                <SelectItem value="30days">Huling 30 araw</SelectItem>
                <SelectItem value="90days">Huling 90 araw</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <CalendarDays className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="pl-8" />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="pl-8" />
            </div>
          </div>

          {activeFilterBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilterBadges.map((filterLabel) => (
                <Badge key={filterLabel} variant="outline" className="bg-background text-muted-foreground">
                  <Filter className="mr-1 h-3 w-3" />
                  {filterLabel}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {sortedResources.length} rekurso ang tumutugma sa kasalukuyang filter.
            </p>
          </div>

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
                <TableHead>Grupo / Uri</TableHead>
                <TableHead>Para saan</TableHead>
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
              {sortedResources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Walang tumugmang rekurso. Subukang alisin ang ilang filter o magdagdag ng bagong item.
                  </TableCell>
                </TableRow>
              )}

              {sortedResources.map((resource) => {
                const stockBadge = getStockBadgeCopy(resource);

                return (
                  <TableRow
                    key={resource.id}
                    id={`resource-row-${resource.id}`}
                    className={cn(
                      focusedResourceId === resource.id && 'bg-primary/5 outline outline-2 outline-primary/40',
                    )}
                  >
                    <TableCell className="font-medium break-words">
                      <div className="space-y-1">
                        <p>{resource.name}</p>
                        <p className="text-xs text-muted-foreground">Base category: {resource.category}</p>
                      </div>
                    </TableCell>
                    <TableCell className="break-words">
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="w-fit">
                          {resource.inventoryGroup}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{resource.subcategory}</span>
                      </div>
                    </TableCell>
                    <TableCell className="break-words">
                      <span className="text-sm text-foreground">{resource.intendedUse}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{resource.stock}</span>
                        <Badge variant="outline" className={cn('w-fit', stockBadge.className)}>
                          {stockBadge.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="break-words">{resource.unit}</TableCell>
                    <TableCell className="break-words">
                      {isClient ? formatResourceDate(resource.lastUpdated) : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingResource(resource)}>
                          <Edit />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 />
                            </Button>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {editingResource && (
        <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>I-edit ang Rekurso</DialogTitle>
              <DialogDescription>
                I-update ang pangkat, mas tukoy na uri, at gamit sa bukid para sa {editingResource.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditResource}>
              <ResourceFormFields draft={editDraft} onDraftChange={setEditDraft} prefix="edit-resource" />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditingResource(null)}>Kanselahin</Button>
                <Button type="submit">I-save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-6" />}>
      <InventoryPageContent />
    </Suspense>
  );
}
