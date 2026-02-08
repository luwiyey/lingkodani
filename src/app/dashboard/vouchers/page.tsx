
'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Search, Ticket, Check, RefreshCw, X } from 'lucide-react';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import type { Voucher, VoucherStatus } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const statusVariant: Record<VoucherStatus, string> = {
  issued: 'bg-blue-500/10 text-blue-500',
  redeemed: 'bg-green-500/10 text-green-500',
  expired: 'bg-yellow-500/10 text-yellow-500',
  voided: 'bg-red-500/10 text-red-500',
};

export default function VouchersPage() {
  const { vouchers, farmers, resources, addVoucher, updateVoucherStatus } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isIssueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleIssueVoucher = () => {
    if (!selectedFarmer || !selectedResource) {
      toast({ title: 'Kulang ang Impormasyon', description: 'Pumili ng magsasaka at rekurso.', variant: 'destructive' });
      return;
    }
    
    addVoucher({ farmerId: selectedFarmer, resourceId: selectedResource, quantity });
    
    toast({ title: 'Tagumpay!', description: 'Naisyu na ang voucher at ipinadala sa magsasaka.' });
    setIssueDialogOpen(false);
    setSelectedFarmer('');
    setSelectedResource('');
    setQuantity(1);
  };
  
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(voucher => {
      const farmer = farmers.find(f => f.id === voucher.farmerId);
      const resource = resources.find(r => r.id === voucher.resourceId);
      const search = searchTerm.toLowerCase();

      return (
        farmer?.name.toLowerCase().includes(search) ||
        resource?.name.toLowerCase().includes(search) ||
        voucher.code.toLowerCase().includes(search) ||
        voucher.status.toLowerCase().includes(search)
      );
    });
  }, [vouchers, farmers, resources, searchTerm]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng Voucher</h1>
             <HelpDialog title="Pamamahala ng Voucher" tooltipText="Mag-isyu at subaybayan ang mga SMS voucher.">
                <p>Ito ang sentro para sa pamamahagi ng tulong tulad ng binhi o pataba sa pamamagitan ng mga SMS voucher. Tinitiyak nito na ang mga rekurso ay naibibigay sa tamang tao sa isang organisadong paraan.</p>
                <p><strong>Daloy ng Trabaho:</strong></p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Mag-isyu ng Voucher:</strong> Pindutin ang button para pumili ng magsasaka, rekurso, at dami. Pagka-isyu, isang SMS na may unique code ang ipapadala sa magsasaka.</li>
                    <li><strong>Pag-redeem:</strong> Kapag ipinakita ng magsasaka ang SMS sa barangay hall, hanapin ang kanilang voucher sa listahan at pindutin ang "Mark as Redeemed" na button.</li>
                    <li><strong>Subaybayan:</strong> Subaybayan ang status ng lahat ng voucher—kung nagamit na, nag-expire, o kinansela.</li>
                </ol>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">Mag-isyu at subaybayan ang mga SMS voucher para sa pamamahagi ng rekurso.</p>
        </div>
        <Dialog open={isIssueDialogOpen} onOpenChange={setIssueDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle /> Mag-isyu ng Bagong Voucher</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mag-isyu ng Bagong Voucher</DialogTitle>
                    <DialogDescription>Pumili ng magsasaka at rekurso upang padalhan ng SMS voucher.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Magsasaka</Label>
                        <Select onValueChange={setSelectedFarmer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pumili ng magsasaka..." />
                            </SelectTrigger>
                            <SelectContent>
                                {farmers.filter(f => f.status === 'active').map(farmer => (
                                    <SelectItem key={farmer.id} value={farmer.id}>{farmer.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Rekurso</Label>
                        <Select onValueChange={setSelectedResource}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pumili ng rekurso..." />
                            </SelectTrigger>
                            <SelectContent>
                                {resources.map(resource => (
                                    <SelectItem key={resource.id} value={resource.id} disabled={resource.stock <= 0}>
                                        {resource.name} ({resource.stock} {resource.unit} available)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Dami</Label>
                        <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} min="1"/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Kanselahin</Button></DialogClose>
                    <Button onClick={handleIssueVoucher}>I-isyu ang Voucher</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

       <div className="relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Maghanap ng voucher ayon sa pangalan, rekurso, code..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pangalan ng Magsasaka</TableHead>
                <TableHead>Rekurso</TableHead>
                <TableHead>Voucher Code</TableHead>
                <TableHead>Katayuan</TableHead>
                <TableHead>Petsa ng Pag-isyu</TableHead>
                <TableHead className="text-right">Mga Aksyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map((voucher) => {
                const farmer = farmers.find(f => f.id === voucher.farmerId);
                const resource = resources.find(r => r.id === voucher.resourceId);
                return (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{farmer?.name || 'Unknown Farmer'}</TableCell>
                    <TableCell>{resource?.name || 'Unknown Resource'} ({voucher.quantity} {resource?.unit})</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono">{voucher.code}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusVariant[voucher.status]}>
                        {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(voucher.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                        {voucher.status === 'issued' && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm"><Check className="mr-2"/> Mark as Redeemed</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Kumpirmahin ang Pag-redeem</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Sigurado ka bang na-redeem na ni {farmer?.name} ang voucher na ito?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => {
                                            updateVoucherStatus(voucher.id, 'redeemed');
                                            toast({title: 'Tagumpay!', description: 'Nakatatak na bilang "redeemed" ang voucher.'});
                                        }}>Ituloy</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {voucher.status === 'issued' && (
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive" size="sm"><X className="mr-2"/> Void</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Kanselahin ang Voucher?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Ang aksyon na ito ay gagawing 'voided' ang voucher at hindi na ito maaaring gamitin.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Bumalik</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => {
                                            updateVoucherStatus(voucher.id, 'voided');
                                            toast({title: 'Tagumpay!', description: 'Nakatatak na bilang "voided" ang voucher.', variant: 'destructive'});
                                        }}>Kanselahin</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                         {voucher.status !== 'issued' && (
                           <span className="text-xs text-muted-foreground">Walang aksyon</span>
                        )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Walang mahanap na voucher.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
