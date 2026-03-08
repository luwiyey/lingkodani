
import type { Farmer, SmsMessage, Resource, KnowledgeArticle, LogbookEntry, AuditLog, Voucher } from '@/lib/types';
import { MessageSquare, Scan, Tractor, Shield, Wind, Flame, Sprout, Droplets, ShieldAlert, Sun } from 'lucide-react';

// =================================================================================
// BASE DATA
// This is the primary source of truth for the application's mock data.
// All demo data for the current scenario is set to March 8, 2026 (5:00 AM - 2:30 PM)
// =================================================================================

export const farmers: Farmer[] = [
  {
    id: 'FARM009',
    name: 'Felipe M. Macedonio',
    age: 58,
    gender: 'Lalaki',
    phone: '+639159876543',
    barangay: 'Batakil',
    sitio: 'Zone 1',
    farmSize: 3.5,
    crops: ['Palay'],
    registrationDate: '2023-10-20T08:00:00Z',
    lastSmsActivity: '2026-03-08T14:30:00Z',
    avatarUrl: 'https://picsum.photos/seed/felipe/200/200',
    status: 'active'
  },
  {
    id: 'FARM001',
    name: 'Juan dela Cruz',
    age: 45,
    gender: 'Lalaki',
    phone: '+639171234567',
    barangay: 'Batakil',
    sitio: 'Zone 1',
    farmSize: 2.5,
    crops: ['Palay', 'Mais'],
    registrationDate: '2023-10-01T08:00:00Z',
    lastSmsActivity: '2026-03-08T09:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/101/200/200',
    status: 'active'
  },
  {
    id: 'FARM002',
    name: 'Maria Clara',
    age: 38,
    gender: 'Babae',
    phone: '+639182345678',
    barangay: 'Batakil',
    sitio: 'Zone 2',
    farmSize: 1.8,
    crops: ['Kamatis'],
    registrationDate: '2023-10-02T09:00:00Z',
    lastSmsActivity: '2026-03-08T11:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/102/200/200',
    status: 'active'
  },
  {
    id: 'FARM003',
    name: 'Jose Rizal',
    age: 52,
    gender: 'Lalaki',
    phone: '+639193456789',
    barangay: 'Batakil',
    sitio: 'Zone 3',
    farmSize: 5.0,
    crops: ['Tubo'],
    registrationDate: '2023-10-03T10:00:00Z',
    lastSmsActivity: '2026-03-08T07:00:00Z',
    status: 'active'
  },
  {
    id: 'FARM004',
    name: 'Lito Batumbakal',
    age: 41,
    gender: 'Lalaki',
    phone: '+639204567890',
    barangay: 'Batakil',
    sitio: 'Zone 4',
    farmSize: 3.2,
    crops: ['Tabako', 'Mais'],
    registrationDate: '2023-10-04T11:00:00Z',
    lastSmsActivity: '2026-03-08T05:30:00Z',
    status: 'inactive'
  },
  {
    id: 'FARM005',
    name: 'Andres Bonifacio',
    age: 29,
    gender: 'Lalaki',
    phone: '+639215678901',
    barangay: 'Batakil',
    sitio: 'Zone 5',
    farmSize: 1.0,
    crops: ['Gulay'],
    registrationDate: '2026-03-08T13:00:00Z',
    lastSmsActivity: '2026-03-08T13:00:00Z',
    status: 'pending_approval'
  },
   {
    id: 'FARM006',
    name: 'Gabriela Silang',
    age: 35,
    gender: 'Babae',
    phone: '+639226789012',
    barangay: 'Batakil',
    sitio: 'Zone 6',
    farmSize: 2.0,
    crops: ['Okra'],
    registrationDate: '2023-10-28T15:00:00Z',
    lastSmsActivity: '2023-10-28T15:00:00Z',
    status: 'pending_approval'
  },
  {
    id: 'FARM007',
    name: 'Emilio Aguinaldo',
    age: 48,
    gender: 'Lalaki',
    phone: '+639237890123',
    barangay: 'Batakil',
    sitio: 'Zone 7',
    farmSize: 4.5,
    crops: ['Palay'],
    registrationDate: '2023-10-27T16:00:00Z',
    lastSmsActivity: '2023-10-27T16:00:00Z',
    status: 'pending_approval'
  },
  {
    id: 'FARM008',
    name: 'Apolinario Mabini',
    age: 55,
    gender: 'Lalaki',
    phone: '+639248901234',
    barangay: 'Batakil',
    sitio: 'Zone 3',
    farmSize: 1.2,
    crops: ['Kamatis', 'Sili'],
    registrationDate: '2023-10-05T14:00:00Z',
    lastSmsActivity: '2026-03-08T10:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/109/200/200',
    status: 'active'
  },
];

export const smsMessages: SmsMessage[] = [
  {
    id: 'SMS008',
    farmerId: 'FARM009',
    farmerName: 'Felipe M. Macedonio',
    phone: '+639159876543',
    message: 'Maraming rice bugs sa aking palayan sa Zone 1. Nakakaalarma na ang dami nila. Kailangan ko po ng pamatay-peste o pesticide supply para hindi masira ang aking ani.',
    timestamp: '2026-03-08T14:30:00Z',
    parsedIntent: 'PEST_DISEASE',
    urgency: 'medium',
    status: 'pending_approval',
    aiAdvice: 'Base sa inyong ulat, mukhang may outbreak ng rice bugs. Inirerekomenda ang paggamit ng Malathion o katulad na pesticide. Mayroon kaming stock sa barangay hall. Maaari kayong bigyan ng voucher para dito.',
    aiConfidence: 0.94,
    safetyFlag: 'Medium',
    tone: 'Nag-aalala',
  },
  {
    id: 'SMS005',
    farmerId: 'FARM005',
    farmerName: 'Andres Bonifacio',
    phone: '+639215678901',
    message: 'REGISTER Andres Bonifacio 29 Lalaki Zone 5 Gulay 1ha',
    timestamp: '2026-03-08T13:00:00Z',
    parsedIntent: 'REGISTER',
    status: 'pending_approval',
    urgency: 'medium',
    aiAdvice: 'Salamat sa pagpaparehistro, Andres Bonifacio! Ang iyong farmer ID ay FARM005. Nakarehistro sa iyo ang Gulay sa 1 ektarya sa Zone 5. Mangyaring kumpirmahin ang pagpaparehistro.',
    aiConfidence: 0.99,
    safetyFlag: 'Low',
    tone: 'Neutral',
  },
  {
    id: 'SMS001',
    farmerId: 'FARM002',
    farmerName: 'Maria Clara',
    phone: '+639182345678',
    message: 'PEST TOMATO LEAFMINER. May dilaw na batik ang dahon ng kamatis ko. Paano ito masusugpo?',
    timestamp: '2026-03-08T11:00:00Z',
    parsedIntent: 'PEST_DISEASE',
    urgency: 'high',
    status: 'pending_approval',
    aiAdvice: 'Maaaring senyales ng leafminer ang mga dilaw na batik. Isaalang-alang ang paggamit ng neem oil spray. Alisin at sirain ang mga apektadong dahon. Tingnan ang KB012 para sa karagdagang detalye.',
    aiConfidence: 0.85,
    safetyFlag: 'Low',
    knowledgeBaseId: 'KB012',
    tone: 'Nag-aalala',
  },
  {
    id: 'SMS007',
    farmerId: 'FARM008',
    farmerName: 'Apolinario Mabini',
    phone: '+639248901234',
    message: 'may lason po ba para sa daga? dami dito sa amin',
    timestamp: '2026-03-08T10:00:00Z',
    parsedIntent: 'PEST_DISEASE',
    urgency: 'high',
    status: 'pending_approval',
    aiAdvice: 'Para sa problema sa daga, subukan ang paggamit ng rat traps o paglalagay ng mga pananim na hindi nila gusto sa paligid ng iyong bukid. Kung gagamit ng lason, mag-ingat po at sundin ang instructions.',
    aiConfidence: 0.88,
    safetyFlag: 'High',
    tone: 'Nag-aalala',
  },
  {
    id: 'SMS002',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    phone: '+639171234567',
    message: 'HARVEST PALAY 120kg. Malapit na ang anihan ng palay ko. May mga tip ba para pagkatapos ng ani?',
    timestamp: '2026-03-08T09:00:00Z',
    parsedIntent: 'HARVEST',
    urgency: 'medium',
    status: 'approved',
    aiAdvice: 'Para sa post-harvest, tiyaking maayos ang pagpapatuyo ng mga butil sa 14% na moisture content bago itago. Gumamit ng malinis na sako at mga pasilidad ng imbakan upang maiwasan ang mga peste.',
    aiConfidence: 0.95,
    safetyFlag: 'Low',
    tone: 'Neutral',
  },
  {
    id: 'SMS006',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    phone: '+639171234567',
    message: 'EMERGENCY TYPHOON DAMAGE. Nasira ng malakas na hangin ang bahagi ng aking taniman ng mais.',
    timestamp: '2026-03-08T08:00:00Z',
    parsedIntent: 'EMERGENCY',
    urgency: 'high',
    status: 'pending_approval',
    aiAdvice: 'Nakalulungkot marinig iyan. I-dokumento ang pinsala. Maaari kang mag-apply para sa tulong-pinansyal sa ilalim ng programa ng DA para sa mga nasalanta ng kalamidad. Makipag-ugnayan sa iyong lokal na tanggapan ng agrikultura.',
    aiConfidence: 0.92,
    safetyFlag: 'Medium',
    tone: 'Kritikal',
  },
  {
    id: 'SMS003',
    farmerId: 'FARM003',
    farmerName: 'Jose Rizal',
    phone: '+639193456789',
    message: 'PEST SUGARCANE BORER. Kinakain ng peste ang mga tubo ko. Mukha silang mga borer.',
    timestamp: '2026-03-08T07:00:00Z',
    parsedIntent: 'PEST_DISEASE',
    urgency: 'high',
    status: 'rejected',
    aiAdvice: 'Maaaring ito ay isang stem borer infestation. Ang paggamit ng mga pheromone trap o pagpapakilala ng mga natural na mandaragit tulad ng Trichogramma wasps ay maaaring maging epektibo.',
    aiConfidence: 0.78,
    safetyFlag: 'Medium',
    tone: 'Kritikal',
  },
  {
    id: 'SMS004',
    farmerId: 'FARM004',
    farmerName: 'Lito Batumbakal',
    phone: '+639204567890',
    message: 'Sira po ang sprayer ko, may mahihiraman po ba sa barangay?',
    timestamp: '2026-03-08T05:30:00Z',
    parsedIntent: 'REQUEST',
    urgency: 'medium',
    status: 'pending_approval',
    aiAdvice: 'Nakita po namin na kailangan ninyo ng sprayer. Mayroon pong 2 magagamit na sprayer sa barangay hall. Maaari po kayong kumuha ng voucher sa pamamagitan ng pag-apruba sa mensaheng ito.',
    aiConfidence: 0.97,
    safetyFlag: 'Low',
    tone: 'Neutral',
  },
];

export const resources: Resource[] = [
    { id: 'RES008', name: 'Pamatay-peste (Pesticide)', category: 'Pataba', stock: 15, unit: 'bote (500ml)', lastUpdated: '2026-03-08' },
    { id: 'RES001', name: 'Patabang Urea', category: 'Pataba', stock: 8, unit: 'sako (50kg)', lastUpdated: '2026-03-08' },
    { id: 'RES002', name: 'Binhi ng Hybrid na Palay (SL-8H)', category: 'Binhi', stock: 20, unit: 'sako (20kg)', lastUpdated: '2026-03-08' },
    { id: 'RES003', name: 'Hand Tractor', category: 'Kagamitan', stock: 5, unit: 'yunit', lastUpdated: '2026-03-01' },
    { id: 'RES004', name: 'Pangkat ng Manggagawa sa Komunidad', category: 'Paggawa', stock: 25, unit: 'tao', lastUpdated: '2026-03-08' },
    { id: 'RES005', name: 'Neem Oil (Organic Pesticide)', category: 'Pataba', stock: 150, unit: 'bote (1L)', lastUpdated: '2026-03-08' },
    { id: 'RES006', name: 'Sprayer', category: 'Kagamitan', stock: 2, unit: 'yunit', lastUpdated: '2026-03-08' },
    { id: 'RES007', name: 'Ammonium Phosphate (16-20-0)', category: 'Pataba', stock: 5, unit: 'sako (50kg)', lastUpdated: '2026-03-08' },
];

export const alerts = [
    {
        id: 'ALERT001',
        icon: Droplets,
        title: 'Panganib ng Baha (72 Oras)',
        description: 'Posible ang malakas na pag-ulan sa susunod na 3 araw. Aabisuhan ang 4 na magsasaka sa mga lugar na mababa.',
        severity: 'Kritikal',
        affected: 4,
    },
    {
        id: 'ALERT002',
        icon: ShieldAlert,
        title: 'Pagdami ng Peste',
        description: 'May 3 ulat ng rice leaf blight sa Zone 3. Inirerekomenda ang agarang pag-inspeksyon.',
        severity: 'Babala',
        affected: 3,
    }
];

export const knowledgeArticles: KnowledgeArticle[] = [
    {
        id: 'KB012',
        title: 'Pamamahala ng mga Peste sa Kamatis (Tomato Leafminer)',
        summary: 'Isang gabay sa pagkilala at paggamot sa mga karaniwang sakit na fungal tulad ng blight at yellow leaf spot sa mga kamatis.',
        content: '...',
        keywords: ['kamatis', 'peste', 'leafminer', 'organiko'],
        lastUpdated: '2023-09-15',
        author: 'Admin',
        type: 'article',
    },
    {
        id: 'KB015',
        title: 'Pamamahala Pagkatapos ng Pag-aani ng Palay',
        summary: 'Pinakamahusay na kasanayan para sa pagpapatuyo, pag-iimbak, at paggiling ng palay upang mapakinabangan ang kalidad at mabawasan ang pagkawala.',
        content: '...',
        keywords: ['palay', 'ani', 'imbakan', 'pagpapatuyo'],
        lastUpdated: '2023-08-22',
        author: 'Admin',
        type: 'article',
    },
    {
        id: 'KB021',
        title: 'Epektibong Paggamit ng Patabang Urea',
        summary: 'Mga pamamaraan para sa tamang aplikasyon ng Urea upang matiyak ang pinakamainam na pagsipsip ng sustansya ng halaman at mabawasan ang pag-aaksaya.',
        content: '...',
        keywords: ['urea', 'pataba', 'aplikasyon', 'sustansya'],
        lastUpdated: '2023-09-01',
        author: 'Admin',
        type: 'article',
    },
    {
        id: 'AUDIO001',
        title: 'Boses ng Magsasaka: Tagumpay ni Mang Juan sa Organic Farming',
        summary: 'Pakinggan ang kwento ni Mang Juan kung paano niya napataas ang kanyang ani sa pamamagitan ng mga organikong pamamaraan.',
        content: '...',
        keywords: ['organic', 'success story', 'palay'],
        lastUpdated: '2023-10-10',
        author: 'Boses ng Magsasaka',
        type: 'audio',
        audioUrl: '/placeholder-audio.mp3'
    }
];

export const farmerLogbookEntries: LogbookEntry[] = [
    {
        id: 'LOG001',
        timestamp: '2026-03-08T14:30:00Z',
        type: 'SMS',
        icon: MessageSquare,
        title: 'Nag-ulat ng Rice Bugs',
        description: 'Ulat ni Felipe M. Macedonio tungkol sa rice bugs sa Zone 1.',
    },
    {
        id: 'LOG002',
        timestamp: '2026-03-08T14:31:00Z',
        type: 'Payo',
        icon: Scan,
        title: 'Nagpadala ng Payo ang AI',
        description: 'Binuo ang paunang payo tungkol sa paggamit ng pesticide at voucher.',
    }
];

export const registeredUsers = [
    { email: 'brgy-admin@lingkodani.gov.ph', name: 'Brgy. Admin', role: 'barangay' as const },
    { email: 'captain@lingkodani.gov.ph', name: 'Bgy. Captain Cruz', role: 'barangay' as const },
    { email: 'secretary@lingkodani.gov.ph', name: 'Sec. Maria Clara', role: 'barangay' as const },
    { email: 'aew@lingkodani.gov.ph', name: 'AEW Jose Rizal', role: 'barangay' as const },
    { email: 'dev@lingkodani.gov.ph', name: 'Developer', role: 'developer' as const },
];

export const auditLogs: AuditLog[] = [
    { id: 'AUD006', timestamp: '2026-03-08T14:31:00Z', user: 'system', action: 'AUTO_ADVICE_GENERATED', details: 'Binuo ang paunang payo para kay Felipe M. Macedonio (FARM009) tungkol sa rice bugs.'},
    { id: 'AUD001', timestamp: '2026-03-08T14:15:00Z', user: 'AEW Jose Rizal', action: 'APPROVE_AI_REPLY', details: 'Inaprubahan ang tugon para sa SMS002 mula kay Juan dela Cruz.'},
    { id: 'AUD002', timestamp: '2026-03-08T13:45:00Z', user: 'Sec. Maria Clara', action: 'REJECT_AI_REPLY', details: 'Tinanggihan ang tugon para sa SMS003 mula kay Jose Rizal.'},
    { id: 'AUD003', timestamp: '2026-03-08T12:00:00Z', user: 'Bgy. Captain Cruz', action: 'SEND_BROADCAST', details: 'Nagpadala ng alerto sa baha sa 4 na magsasaka.'},
    { id: 'AUD004', timestamp: '2026-03-08T09:30:00Z', user: 'brgy-admin@lingkodani.gov.ph', action: 'UPDATE_FARMER', details: 'In-update ang mga pananim para kay Maria Clara (FARM002).'},
    { id: 'AUD005', timestamp: '2026-03-08T06:00:00Z', user: 'system', action: 'AUTO_ALERT_GENERATED', details: 'Bumuo ng alerto sa panganib ng baha batay sa data ng panahon.'},
];

export const vouchers: Voucher[] = [
  { id: 'VOUCH001', farmerId: 'FARM001', resourceId: 'RES001', quantity: 2, code: 'UR-1A2B3C', status: 'issued', issueDate: '2026-03-08T10:00:00Z' },
  { id: 'VOUCH002', farmerId: 'FARM002', resourceId: 'RES002', quantity: 5, code: 'SE-4D5E6F', status: 'redeemed', issueDate: '2026-03-07T11:00:00Z', redemptionDate: '2026-03-08T14:00:00Z' },
];

// =================================================================================
// CHART DATA (Derived from Base Data)
// =================================================================================

export const smsVolumeData = [
    { name: 'Lun', total: 12 }, 
    { name: 'Mar', total: 15 }, 
    { name: 'Miy', total: 18 }, 
    { name: 'Huw', total: 14 }, 
    { name: 'Biy', total: 22 }, 
    { name: 'Sab', total: 9 }, 
    { name: 'Lin', total: 25 }, // High activity on March 8
];

export const issueTrendsData = [
    { date: 'Mar 2', MgaPeste: 5, Sakit: 2, Patubig: 1 },
    { date: 'Mar 4', MgaPeste: 8, Sakit: 3, Patubig: 2 },
    { date: 'Mar 6', MgaPeste: 12, Sakit: 4, Patubig: 2 },
    { date: 'Mar 8', MgaPeste: 18, Sakit: 5, Patubig: 3 },
];

export const adviceSuccessData = [
    { status: 'Inaprubahan', value: 85, fill: 'hsl(var(--chart-1))' },
    { status: 'In-edit', value: 10, fill: 'hsl(var(--chart-2))' },
    { status: 'Tinanggihan', value: 5, fill: 'hsl(var(--destructive))' },
];

export const cropStageData = [
    { name: 'Pagtatanim', value: 15, fill: 'hsl(var(--chart-1))' },
    { name: 'Paglago', value: 45, fill: 'hsl(var(--chart-2))' },
    { name: 'Pamumulaklak', value: 25, fill: 'hsl(var(--chart-3))' },
    { name: 'Pag-aani', value: 15, fill: 'hsl(var(--chart-4))' },
];

export const topKeywordsData = [
  { word: 'peste', count: 42 },
  { word: 'pataba', count: 38 },
  { word: 'sakit', count: 32 },
  { word: 'ani', count: 28 },
  { word: 'tubo', count: 15 },
  { word: 'sprayer', count: 12 },
  { word: 'hangin', count: 10 },
  { word: 'lason', count: 8 },
  { word: 'daga', count: 7 },
];

export const languageUsageData = [
    { language: 'Tagalog', value: 65, fill: 'hsl(var(--chart-1))' },
    { language: 'Taglish', value: 35, fill: 'hsl(var(--chart-2))' }, 
];

export const smsPeakHoursData = [
  { hour: '8-10am', messages: 12 },
  { hour: '10-12pm', messages: 18 },
  { hour: '12-2pm', messages: 25 }, 
  { hour: '2-4pm', messages: 15 },
  { hour: '4-6pm', messages: 8 },
  { hour: '6-8pm', messages: 4 },
];

export const interventionSupportData = [
    { month: "Jan", visits: 12 },
    { month: "Feb", visits: 15 },
    { month: "Mar", visits: 8 }, 
    { month: "Apr", visits: 20 },
    { month: "May", visits: 25 },
];

export const validationQueueData = [
    { name: 'Nakabinbin', value: 8, fill: 'hsl(var(--chart-2))' },
    { name: 'Nalutas', value: 42, fill: 'hsl(var(--chart-1))' },
];

export const advisoryDeliveryData = [
    { name: 'Tagumpay', value: 98, fill: 'hsl(var(--chart-1))' },
    { name: 'Nabigo', value: 2, fill: 'hsl(var(--destructive))' },
];

export const followUpRateData = [
    { name: 'May Follow-up', value: 35, fill: 'hsl(var(--chart-1))' },
    { name: 'Walang Follow-up', value: 65, fill: 'hsl(var(--chart-2))' },
];

export const aiConfidenceTrendData = [
    { date: 'Feb 15', confidence: 85 },
    { date: 'Feb 22', confidence: 88 },
    { date: 'Mar 01', confidence: 92 },
    { date: 'Mar 08', confidence: 94 },
];

export const correctionLogData = [
    { type: 'Intent', count: 5 },
    { type: 'Entity', count: 12 },
    { type: 'Advice', count: 3 },
];

export const aiAgreementData = [
    { name: 'Approved As-is', value: 82, fill: 'hsl(var(--chart-1))' },
    { name: 'Revised', value: 12, fill: 'hsl(var(--chart-2))' },
    { name: 'Rejected', value: 6, fill: 'hsl(var(--destructive))' },
];

export const highRiskKeywordData = [
    { word: 'peste', count: 15 },
    { word: 'lason', count: 8 },
    { word: 'emergency', count: 5 },
    { word: 'sira', count: 12 },
    { word: 'daga', count: 7 },
];

export const outbreakAlertData = [
    { date: 'Mar 2', ulat: 2 },
    { date: 'Mar 4', ulat: 5 },
    { date: 'Mar 6', ulat: 8 },
    { date: 'Mar 8', ulat: 12 },
];

export const severityIndexData = [
    { name: 'Peste', mild: 10, moderate: 15, severe: 17 },
    { name: 'Sakit', mild: 5, moderate: 12, severe: 15 }, 
    { name: 'Panahon', mild: 2, moderate: 8, severe: 20 },
];

export const recommendationTypeData = [
    { name: 'Pag-iwas', count: 45 },
    { name: 'Paggamot', count: 38 },
    { name: 'Pagsubaybay', count: 25 },
    { name: 'Referral', count: 12 },
];

export const messageLengthData = [
    { range: '1-20', count: 15 },
    { range: '21-80', count: 65 },
    { range: '81-160', count: 20 },
];

export const clarificationNeededData = [
    { name: 'Nangailangan ng Clarification', value: 12, fill: 'hsl(var(--chart-2))' },
    { name: 'Hindi Kinailangan', value: 88, fill: 'hsl(var(--chart-1))' },
];

export const topInquiriesData = [
    { question: 'Gamot sa peste?', count: 45 },
    { question: 'Bakit dilaw ang dahon?', count: 32 },
    { question: 'Paano mag-ani?', count: 28 },
    { question: 'Sira ang gamit', count: 15 },
    { question: 'Pinsala ng bagyo', count: 12 },
];

export const seasonalTrendData = [
    { month: 'Jan', reports: 120 },
    { month: 'Feb', reports: 150 },
    { month: 'Mar', reports: 280 }, 
    { month: 'Apr', reports: 110 },
    { month: 'May', reports: 95 },
    { month: 'Jun', reports: 140 },
    { month: 'Jul', reports: 210 },
    { month: 'Aug', reports: 250 },
    { month: 'Sep', reports: 190 },
    { month: 'Oct', reports: 160 },
    { month: 'Nov', reports: 130 },
    { month: 'Dec', reports: 110 },
];

export const farmerEngagementData = [
    { type: 'First-time', count: 120 },
    { type: 'Repeat', count: 250 },
    { type: 'Frequent', count: 80 },
];

export const geographicHotspotData = [
    { zone: 'Zone 1', issues: 25 },
    { zone: 'Zone 2', issues: 18 },
    { zone: 'Zone 3', issues: 32 },
    { zone: 'Zone 4', issues: 12 },
    { zone: 'Zone 5', issues: 15 },
    { zone: 'Zone 6', issues: 8 },
    { zone: 'Zone 7', issues: 5 },
];

export const smsDeliveryStatusData = [
    { name: 'Napadala', value: 998, fill: 'hsl(var(--chart-1))' },
    { name: 'Nabigo', value: 2, fill: 'hsl(var(--destructive))' },
];

export const messageToneData = [
    { tone: 'Neutral', count: 150, fill: 'hsl(var(--chart-1))' },
    { tone: 'Nag-aalala', count: 80, fill: 'hsl(var(--chart-2))' },
    { tone: 'Kritikal', count: 35, fill: 'hsl(var(--destructive))' },
    { tone: 'Positibo', count: 45, fill: 'hsl(var(--chart-3))' },
];

export const responseTimeData = [
    { name: 'Average', time: 5.5 },
    { name: '90th Percentile', time: 15.2 },
];
