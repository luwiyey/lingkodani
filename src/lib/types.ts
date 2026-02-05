
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  role?: 'barangay';
};

export type UserRole = 'barangay';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  barangayId: string;
  municipalityId: string;
};

export type FarmerStatus = 'pending_approval' | 'active' | 'inactive' | 'rejected';

export type Farmer = {
  id: string; // Corresponds to farmerId
  name: string;
  age: number;
  gender: string;
  phone: string;
  barangay: string;
  sitio: string;
  farmSize: number; // in hectares
  crops: string[];
  registrationDate: string;
  lastSmsActivity: string;
  avatarUrl: string;
  status: FarmerStatus;
};

export type SmsIntent = 
  | 'REGISTER' 
  | 'CROP_UPDATE' 
  | 'HARVEST'
  | 'REQUEST'
  | 'PEST_DISEASE'
  | 'WEATHER_HELP'
  | 'PRICE_CHECK'
  | 'EMERGENCY'
  | 'UNKNOWN';

export type SafetyFlag = 'Low' | 'Medium' | 'High';

export type SmsMessageStatus = 'pending_approval' | 'approved' | 'replied' | 'rejected';

export type SmsMessage = {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  message: string;
  timestamp: string;
  parsedIntent: SmsIntent;
  urgency: 'low' | 'medium' | 'high';
  status: SmsMessageStatus;
  aiAdvice: string;
  aiConfidence: number;
  safetyFlag: SafetyFlag;
  knowledgeBaseId?: string;
  tone?: 'Neutral' | 'Nag-aalala' | 'Kritikal' | 'Positibo';
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

export type KnowledgeArticleType = 'article' | 'audio' | 'tip' | 'myth-buster';

export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  lastUpdated: string;
  author: string;
  type: KnowledgeArticleType;
  audioUrl?: string;
};

export type LogbookEntryType = 'SMS' | 'Payo' | 'Tala sa Bukid' | 'Insidente' | 'Tulong';

export type LogbookEntry = {
    id: string;
    timestamp: string;
    type: LogbookEntryType;
    title: string;
    description: string;
    icon: LucideIcon;
    data?: any;
};

export type AuditLog = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
}
