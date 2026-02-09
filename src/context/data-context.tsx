
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Farmer, SmsMessage, Resource, KnowledgeArticle, LogbookEntry, AuditLog, User, KnowledgeArticleType, Voucher, VoucherStatus } from '@/lib/types';
import { 
    farmers as initialFarmers, 
    smsMessages as initialSmsMessages,
    resources as initialResources,
    knowledgeArticles as initialKnowledgeArticles,
    farmerLogbookEntries as initialLogbookEntries,
    auditLogs as initialAuditLogs,
    registeredUsers as initialUsers,
    vouchers as initialVouchers
} from '@/lib/data';
import type { FarmerRegistrationValues, UserManagementValues } from '@/lib/schemas';
import type { NewResourceData } from '@/app/dashboard/inventory/page';


export type NewKnowledgeArticleData = {
  title: string;
  summary: string;
  keywords: string[];
  type: KnowledgeArticleType;
  content: string;
};

interface DataContextType {
  farmers: Farmer[];
  setFarmers: React.Dispatch<React.SetStateAction<Farmer[]>>;
  smsMessages: SmsMessage[];
  resources: Resource[];
  addResource: (data: NewResourceData) => void;
  updateResource: (resourceId: string, data: Partial<Omit<Resource, 'id' | 'lastUpdated'>>) => void;
  deleteResource: (resourceId: string) => void;
  knowledgeArticles: KnowledgeArticle[];
  addKnowledgeArticle: (data: NewKnowledgeArticleData) => void;
  setKnowledgeArticles: React.Dispatch<React.SetStateAction<KnowledgeArticle[]>>;
  logbook: LogbookEntry[];
  setLogbook: React.Dispatch<React.SetStateAction<LogbookEntry[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  users: User[];
  addUser: (user: UserManagementValues) => void;
  updateUser: (email: string, updatedUser: User) => void;
  deleteUser: (email: string) => void;
  addPendingFarmer: (farmerData: FarmerRegistrationValues) => void;
  vouchers: Voucher[];
  addVoucher: (voucher: Omit<Voucher, 'id' | 'code' | 'status' | 'issueDate'>) => void;
  updateVoucherStatus: (voucherId: string, status: VoucherStatus) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(initialKnowledgeArticles);
  const [logbook, setLogbook] = useState<LogbookEntry[]>(initialLogbookEntries);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);

  useEffect(() => {
    try {
      const storedFarmers = localStorage.getItem('farmers');
      if (storedFarmers) setFarmers(JSON.parse(storedFarmers));

      const storedSms = localStorage.getItem('smsMessages');
      if (storedSms) setSmsMessages(JSON.parse(storedSms));

      const storedResources = localStorage.getItem('resources');
      if (storedResources) setResources(JSON.parse(storedResources));

      const storedKnowledge = localStorage.getItem('knowledgeArticles');
      if (storedKnowledge) setKnowledgeArticles(JSON.parse(storedKnowledge));
      
      const storedLogbook = localStorage.getItem('logbook');
      if (storedLogbook) setLogbook(JSON.parse(storedLogbook));

      const storedAudit = localStorage.getItem('auditLogs');
      if (storedAudit) setAuditLogs(JSON.parse(storedAudit));
      
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      
      const storedVouchers = localStorage.getItem('vouchers');
      if (storedVouchers) setVouchers(JSON.parse(storedVouchers));

    } catch (error) {
      console.error("Error loading data from localStorage", error);
    }
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem('farmers', JSON.stringify(farmers)); }, [farmers, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('smsMessages', JSON.stringify(smsMessages)); }, [smsMessages, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('resources', JSON.stringify(resources)); }, [resources, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('knowledgeArticles', JSON.stringify(knowledgeArticles)); }, [knowledgeArticles, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('logbook', JSON.stringify(logbook)); }, [logbook, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('users', JSON.stringify(users)); }, [users, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('vouchers', JSON.stringify(vouchers)); }, [vouchers, hydrated]);


  const addUser = (userData: UserManagementValues) => {
    const newUser: User = {
        email: userData.email,
        name: userData.name,
        role: userData.role,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (email: string, updatedUser: User) => {
    setUsers(prev => prev.map(u => (u.email === email ? updatedUser : u)));
  };

  const deleteUser = (email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  };
  
  const addPendingFarmer = (farmerData: FarmerRegistrationValues) => {
    const newFarmer: Farmer = {
        id: `FARM${Date.now()}`,
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
  
  const addKnowledgeArticle = (data: NewKnowledgeArticleData) => {
    const newArticle: KnowledgeArticle = {
        id: `KB${Date.now()}`,
        title: data.title,
        summary: data.summary,
        content: data.content,
        keywords: data.keywords,
        type: data.type,
        author: 'Admin',
        lastUpdated: new Date().toISOString(),
        audioUrl: data.type === 'audio' ? '/placeholder-audio.mp3' : undefined,
    };
    setKnowledgeArticles(prev => [newArticle, ...prev]);
  };
  
  const addVoucher = (voucherData: Omit<Voucher, 'id' | 'code' | 'status' | 'issueDate'>) => {
    const newVoucher: Voucher = {
      ...voucherData,
      id: `VOUCH${Date.now()}`,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'issued',
      issueDate: new Date().toISOString(),
    };
    setVouchers(prev => [newVoucher, ...prev]);
  };

  const updateVoucherStatus = (voucherId: string, status: VoucherStatus) => {
    setVouchers(prev =>
      prev.map(v =>
        v.id === voucherId
          ? { ...v, status, redemptionDate: status === 'redeemed' ? new Date().toISOString() : v.redemptionDate }
          : v
      )
    );
  };
  
  const addResource = (data: NewResourceData) => {
    const newResource: Resource = {
      ...data,
      id: `RES${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setResources(prev => [newResource, ...prev]);
  };

  const updateResource = (resourceId: string, data: Partial<Omit<Resource, 'id' | 'lastUpdated'>>) => {
    setResources(prev =>
      prev.map(r =>
        r.id === resourceId ? { ...r, ...data, lastUpdated: new Date().toISOString() } : r
      )
    );
  };
  
  const deleteResource = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
  };


  const value = {
    farmers,
    setFarmers,
    smsMessages,
    resources,
    addResource,
    updateResource,
    deleteResource,
    knowledgeArticles,
    setKnowledgeArticles,
    addKnowledgeArticle,
    logbook,
    setLogbook,
    auditLogs,
    setAuditLogs,
    users,
    addUser,
    updateUser,
    deleteUser,
    addPendingFarmer,
    vouchers,
    addVoucher,
    updateVoucherStatus,
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
