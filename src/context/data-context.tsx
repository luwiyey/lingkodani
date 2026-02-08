
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Farmer, SmsMessage, Resource, KnowledgeArticle, LogbookEntry, AuditLog, User } from '@/lib/types';
import { 
    farmers as initialFarmers, 
    smsMessages as initialSmsMessages,
    resources as initialResources,
    knowledgeArticles as initialKnowledgeArticles,
    farmerLogbookEntries as initialLogbookEntries,
    auditLogs as initialAuditLogs,
    registeredUsers as initialUsers
} from '@/lib/data';
import type { FarmerRegistrationValues } from '@/lib/schemas';

interface DataContextType {
  farmers: Farmer[];
  setFarmers: React.Dispatch<React.SetStateAction<Farmer[]>>;
  smsMessages: SmsMessage[];
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  knowledgeArticles: KnowledgeArticle[];
  setKnowledgeArticles: React.Dispatch<React.SetStateAction<KnowledgeArticle[]>>;
  logbook: LogbookEntry[];
  setLogbook: React.Dispatch<React.SetStateAction<LogbookEntry[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  users: User[];
  addUser: (user: User) => void;
  updateUser: (email: string, updatedUser: User) => void;
  deleteUser: (email: string) => void;
  addPendingFarmer: (farmerData: FarmerRegistrationValues) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(initialKnowledgeArticles);
  const [logbook, setLogbook] = useState<LogbookEntry[]>(initialLogbookEntries);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const updateUser = (email: string, updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.email === email ? updatedUser : u)));
  };

  const deleteUser = (email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  };
  
  const addPendingFarmer = (farmerData: FarmerRegistrationValues) => {
    const newFarmer: Farmer = {
        id: `FARM${String(farmers.length + 10).padStart(3, '0')}`,
        name: farmerData.name,
        phone: farmerData.phone,
        barangay: farmerData.barangay,
        sitio: farmerData.sitio,
        crops: farmerData.crops ? farmerData.crops.split(',').map(c => c.trim()) : [],
        farmSize: farmerData.farmSize || 0,
        age: farmerData.age || 0,
        gender: farmerData.gender || 'Hindi natukoy',
        registrationDate: new Date().toISOString(),
        lastSmsActivity: new Date().toISOString(),
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
        status: 'pending_approval'
    };
    setFarmers(prev => [...prev, newFarmer]);
  };

  const value = {
    farmers,
    setFarmers,
    smsMessages,
    resources,
    setResources,
    knowledgeArticles,
    setKnowledgeArticles,
    logbook,
    setLogbook,
    auditLogs,
    setAuditLogs,
    users,
    addUser,
    updateUser,
    deleteUser,
    addPendingFarmer,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
