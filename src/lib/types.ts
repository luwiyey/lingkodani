
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
};

export type Farmer = {
  id: string;
  name: string;
  age: number;
  gender: 'Lalaki' | 'Babae';
  phone: string;
  location: string; // Barangay
  municipality: string;
  farmSize: number; // in hectares
  crops: string[];
  riskScore: number;
  registrationDate: string;
  avatarUrl: string;
};

export type SmsMessageType = 
  | 'pagpaparehistro' 
  | 'update-sa-pananim' 
  | 'kahilingan' 
  | 'ulat-ng-peste' 
  | 'ulat-panahon'
  | 'pangkalahatan';

export type SmsMessage = {
  id: string;
  farmerId: string;
  farmerName: string;
  message: string;
  timestamp: string;
  type: SmsMessageType;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'edited' | 'actioned';
  aiAdvice: string;
  aiConfidence: number;
  knowledgeBaseId?: string;
};

export type ResourceCategory = 'Pataba' | 'Binhi' | 'Kagamitan' | 'Paggawa';

export type Resource = {
  id: string;
  name: string;
  category: ResourceCategory;
  stock: number;
  unit: string;
  lastUpdated: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  lastUpdated: string;
  author: string;
};
