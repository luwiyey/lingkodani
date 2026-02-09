
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import type { Farmer } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, QrCode, Trash2, Edit, Download, Filter, MapPin, Sprout, Activity, ArrowUp, ArrowDown, ArrowUpRight, ArrowLeft, User } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type SortableKeys = keyof Farmer | 'location';

export default function FarmersPage() {
  const { farmers, setFarmers } = useData();
  const [qrCodeValue, setQrCodeValue = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFarmer, setEditingFarmer = useState(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [filters, setFilters] = useState({
    sitios: [],
    crops: [],
    statuses: [],
  });
  
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending'  null);

  const activeFarmers = farmers.filter(f => f.status === 'active' || f.status === 'inactive');
  const allSitios = [...new Set(farmers.map((f) => f.sitio))].sort();
  const allCrops = [...new Set(farmers.flatMap((f) => f.crops))];
  const allStatuses: Farmer['status'][] = ['active', 'inactive'];

  const handleFilterChange = (
    type: 'sitios' | 'crops' | 'statuses',
    value: string
  ) => {
    setFilters((prev) => {
      const newValues = prev[type].includes(value as never)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value as never];
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

  const handleExport = (format: 'JSON' | 'Excel') => {
    toast({
        title: "Inihahanda ang Export...",
        description: `Ang data ng magsasaka ay ie-export bilang ${format} file.`,
    })
  };

  const generateQr = (farmerId: string) => {
    const url = `${window.location.origin}/dashboard/farmers/${farmerId}`;
    setQrCodeValue(url);
  };
  
  const handleEditFarmer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingFarmer) return;

    const formData = new FormData(event.currentTarget);
    const updatedData: Partial = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      barangay: formData.get('barangay') as string,
      sitio: formData.get('sitio') as string,
      crops: (formData.get('crops') as string).split(',').map(c => c.trim()),
      farmSize: Number(formData.get('farm-size') as string),
    };

    setFarmers(current => current.map(f => f.id === editingFarmer.id ? { ...f, ...updatedData } : f));
    setEditingFarmer(null);
    toast({ title: "Tagumpay!", description: "Nai-update na ang datos ng magsasaka." });
  };

  const handleDeleteFarmer = (farmerId: string) => {
    setFarmers(farmers.filter(f => f.id !== farmerId));
    toast({ title: "Tagumpay!", description: "Natanggal na ang magsasaka sa database.", variant: 'destructive' });
  };

  const filteredFarmers = useMemo(() => activeFarmers.filter(farmer => {
    const searchMatch = (
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.sitio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.crops.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sitioMatch = filters.sitios.length === 0 || filters.sitios.includes(farmer.sitio);
    const cropMatch = filters.crops.length === 0 || farmer.crops.some(crop => filters.crops.includes(crop));
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(farmer.status);

    return searchMatch && sitioMatch && cropMatch && statusMatch;
  }), [activeFarmers, searchTerm, filters]);
  
  const sortedFarmers = useMemo(() => {
    let sortableItems = [...filteredFarmers];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            
            const key = sortConfig.key;

            if (key === 'location') {
                aValue = `${a.sitio}, ${a.barangay}`;
                bValue = `${b.sitio}, ${b.barangay}`;
            } else if (key === 'crops') {
                aValue = a.crops.join(', ');
                bValue = b.crops.join(', ');
            } else {
                 aValue = a[key as keyof Farmer];
                 bValue = b[key as keyof Farmer];
            }

            if (aValue  bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredFarmers, sortConfig]);

  return (
    <>
      
        
            
                
                    
                        
                    
                    
                        Database ng Magsasaka
                        Tingnan, pamahalaan, at i-update ang mga profile ng lahat ng aprubadong magsasaka.
                    
                
            
          
            I-export
              Export as JSON
              Export as Excel
            Magrehistro ng Magsasaka
          
        

        
            
                
                    
                
                
                    Maghanap ng magsasaka...
                    
                    
                
            
              Filter
                Filter by
                
                
                  
                    
                    Lokasyon (Sitio)
                  
                  
                    
                      Pumili ng Sitio
                      
                      {allSitios.map((sitio) => (
                        
                          {sitio}
                        
                      ))}
                    
                  
                

                
                  
                    
                    Pananim
                  
                  
                    
                      Pumili ng Pananim
                      
                      {allCrops.map((crop) => (
                        
                          {crop}
                        
                      ))}
                    
                  
                
                
                  
                    
                    Katayuan
                  
                  
                    
                      Pumili ng Katayuan
                      
                      {allStatuses.map((status) => (
                        
                          {status}
                        
                      ))}
                    
                  
                
                
              
            
        


          
            
              
                
                  
                    
                      
                          
                              Pangalan
                               
                                  
                                       
                                  
                              
                          
                      
                      
                          
                              Lokasyon
                              
                                  
                                       
                                  
                              
                          
                      
                      
                          
                              Mga Pananim
                              
                                  
                                       
                                  
                              
                          
                      
                      
                          
                              Katayuan
                              
                                  
                                       
                                  
                              
                          
                      
                      Mga Aksyon
                  
                
                
                  {sortedFarmers.map((farmer) => (
                    
                      
                        
                           
                                
                                    
                                        
                                    
                                
                              {farmer.name}
                            
                        
                      
                      {farmer.sitio}, {farmer.barangay}
                      {farmer.crops.join(', ')}
                      
                        {farmer.status}
                      
                      
                        
                            
                              
                                
                                    
                                
                              
                              
                                  
                                      Sigurado ka ba?
                                      Ang aksyon na ito ay hindi na maaaring bawiin. Permanenteng tatanggalin nito ang datos ng magsasaka.
                                  
                                  
                                  Kanselahin
                                  Ituloy
                                  
                              
                            
                            
                              
                                
                                    
                                
                              
                            
                        
                      
                    
                  ))}
                
              
            
          
        
      

      {qrCodeValue && (
        
          
            
              Farmer QR ID Card
              I-scan ang QR code na ito para buksan ang logbook ng magsasaka.
            
            
            
              I-print
              
                Isara
              
            
          
        
      )}

      {editingFarmer && (
        
            
              
                I-edit ang Profile ng Magsasaka
                I-update ang mga detalye para kay {editingFarmer.name}.
              
              
                
                  
                    Pangalan
                    
                  
                  
                    Telepono
                    
                  
                  
                    Barangay
                    
                  
                   
                    Sitio/Purok
                    
                        
                            {Array.from({ length: 7 }, (_, i) => i + 1).map(zone => (
                                
                                    Zone {zone}
                                
                            ))}
                        
                    
                  
                  
                    Mga Pananim
                    
                  
                  
                    Sukat (ha)
                    
                  
                
                
                    
                        
                            Buong Profile
                            
                        
                    
                    
                        Kanselahin
                    
                    I-save
                
              
            
        
      )}
    </>
  );
}

    