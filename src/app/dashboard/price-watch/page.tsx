'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowRight, ArrowUp, Pencil, PlusCircle, Trash2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpDialog } from '@/components/ui/help-dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { countStaleMarketPrices, getLatestMarketPriceTimestamp, getMarketPriceTrendLabel, isMarketPriceStale, sortMarketPricesByUpdatedAt } from '@/lib/services/price-watch-service';
import type { MarketPriceEntry } from '@/lib/types';

type PriceFormState = {
  crop: string;
  price: string;
  unit: string;
  source: string;
  trend: MarketPriceEntry['trend'];
};

const DEFAULT_FORM: PriceFormState = {
  crop: '',
  price: '',
  unit: 'kilo',
  source: 'Batakil Bagsakan',
  trend: 'steady',
};

function formatPeso(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function TrendIcon({ trend }: { trend: MarketPriceEntry['trend'] }) {
  if (trend === 'up') {
    return <ArrowUp className="h-3 w-3 text-emerald-600" />;
  }

  if (trend === 'down') {
    return <ArrowDown className="h-3 w-3 text-destructive" />;
  }

  return <ArrowRight className="h-3 w-3 text-amber-600" />;
}

function PriceWatchPageContent() {
  const searchParams = useSearchParams();
  const highlightedPriceId = searchParams.get('price');
  const { marketPrices, addMarketPriceEntry, updateMarketPriceEntry, deleteMarketPriceEntry } = useData();
  const { toast } = useToast();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<PriceFormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!highlightedPriceId) {
      return;
    }

    document.getElementById(`price-${highlightedPriceId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [highlightedPriceId]);

  const sortedEntries = useMemo(() => sortMarketPricesByUpdatedAt(marketPrices), [marketPrices]);
  const latestTimestamp = getLatestMarketPriceTimestamp(sortedEntries);
  const referenceDate = latestTimestamp ? new Date(latestTimestamp) : new Date();
  const trackedCropsCount = new Set(sortedEntries.map((entry) => entry.crop.toLowerCase())).size;
  const updatedTodayCount = sortedEntries.filter((entry) => (
    referenceDate.getTime() - new Date(entry.updatedAt).getTime() <= 24 * 60 * 60 * 1000
  )).length;
  const staleCount = countStaleMarketPrices(sortedEntries, referenceDate);

  const handleChange = <K extends keyof PriceFormState>(key: K, value: PriceFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingEntryId(null);
  };

  const handleSubmit = () => {
    const parsedPrice = Number(form.price);

    if (!form.crop.trim() || !form.unit.trim() || !form.source.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast({
        title: 'Kulang ang detalye',
        description: 'Punan ang crop, presyo, unit, at source bago mag-save.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      crop: form.crop.trim(),
      price: parsedPrice,
      unit: form.unit.trim(),
      source: form.source.trim(),
      trend: form.trend,
    };

    if (editingEntryId) {
      updateMarketPriceEntry(editingEntryId, payload);
      toast({
        title: 'Na-update ang presyo',
        description: `${payload.crop} ay naisama na sa pinakahuling barangay price watch.`,
      });
    } else {
      addMarketPriceEntry(payload);
      toast({
        title: 'Nadagdag ang presyo',
        description: `${payload.crop} ay pwede nang gamiting reference sa PRICE_CHECK replies.`,
      });
    }

    resetForm();
  };

  const handleEdit = (entry: MarketPriceEntry) => {
    setEditingEntryId(entry.id);
    setForm({
      crop: entry.crop,
      price: String(entry.price),
      unit: entry.unit,
      source: entry.source,
      trend: entry.trend,
    });
  };

  const handleDelete = (entry: MarketPriceEntry) => {
    deleteMarketPriceEntry(entry.id);
    if (editingEntryId === entry.id) {
      resetForm();
    }
    toast({
      title: 'Natanggal ang entry',
      description: `${entry.crop} price record ay inalis sa board.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">Barangay Price Watch</h1>
          <HelpDialog title="Barangay Price Watch" tooltipText="Presyo ng ani na ginagamit sa farmer support at SMS replies.">
            <p>Dito mino-monitor ng barangay ang kasalukuyang presyo ng mga pangunahing ani sa inyong lugar.</p>
            <p>Ang board na ito ang pwedeng gamiting basehan kapag may magsasakang nagtatanong ng presyo sa SMS at kapag nag-a-assist kayo sa harvest planning.</p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">Lokal na market references para sa barangay. Ang updates dito ay puwedeng gamitin sa `PRICE_CHECK` workflow ng demo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mga Ani na Tinututukan</CardTitle>
            <CardDescription>Ilang crop ang may active price record.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{trackedCropsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Na-update Kamakailan</CardTitle>
            <CardDescription>Mga entry na na-refresh sa loob ng 24 oras mula sa latest board update.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{updatedTodayCount}</p>
          </CardContent>
        </Card>
        <Card className={staleCount > 0 ? 'border-destructive/40' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kailangang I-refresh</CardTitle>
            <CardDescription>Mga presyong lampas sa 3 araw ang huling update.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{staleCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingEntryId ? 'I-edit ang Price Entry' : 'Magdagdag ng Price Entry'}</CardTitle>
          <CardDescription>Panatilihing updated ang presyo para mas kapaki-pakinabang ang advisories at SMS support.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-6">
          <Input placeholder="Crop" value={form.crop} onChange={(event) => handleChange('crop', event.target.value)} />
          <Input placeholder="Presyo" type="number" min="0" step="0.01" value={form.price} onChange={(event) => handleChange('price', event.target.value)} />
          <Input placeholder="Unit" value={form.unit} onChange={(event) => handleChange('unit', event.target.value)} />
          <Input placeholder="Source" value={form.source} onChange={(event) => handleChange('source', event.target.value)} />
          <Select value={form.trend} onValueChange={(value) => handleChange('trend', value as MarketPriceEntry['trend'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="up">Tumataas</SelectItem>
              <SelectItem value="steady">Steady</SelectItem>
              <SelectItem value="down">Bumababa</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              <PlusCircle className="mr-2 h-4 w-4" />
              {editingEntryId ? 'I-save' : 'Idagdag'}
            </Button>
            {editingEntryId ? (
              <Button variant="outline" onClick={resetForm}>
                Kansela
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Board</CardTitle>
          <CardDescription>
            {sortedEntries.length > 0
              ? `Latest board refresh: ${new Date(latestTimestamp as string).toLocaleString()}`
              : 'Wala pang naisusulat na presyo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Presyo</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Update Status</TableHead>
                <TableHead className="text-right">Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => {
                const stale = isMarketPriceStale(entry, referenceDate);
                const isHighlighted = highlightedPriceId === entry.id;

                return (
                  <TableRow id={`price-${entry.id}`} key={entry.id} className={isHighlighted ? 'bg-primary/5 ring-1 ring-primary/30' : ''}>
                    <TableCell className="font-medium">{entry.crop}</TableCell>
                    <TableCell>{formatPeso(entry.price)} / {entry.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <TrendIcon trend={entry.trend} />
                        {getMarketPriceTrendLabel(entry.trend)}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={stale ? 'destructive' : 'secondary'} className="w-fit">
                          {stale ? 'Needs refresh' : 'Fresh'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Wala pang barangay price watch entries.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PriceWatchPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-6" />}>
      <PriceWatchPageContent />
    </Suspense>
  );
}
