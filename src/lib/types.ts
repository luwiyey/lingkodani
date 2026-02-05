
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
  phone: string;
  location: string;
  farmSize: number; // in hectares
  crops: string[];
  riskScore: number;
  registrationDate: string;
  avatarUrl: string;
};

export type SmsMessage = {
  id: string;
  farmerId: string;
  farmerName: string;
  message: string;
  timestamp: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  aiAdvice: string;
  aiConfidence: number;
  knowledgeBaseId?: string;
};

export type ResourceCategory = 'Mga Pataba' | 'Mga Binhi' | 'Mga Kasangkapan' | 'Paggawa';

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
