
import type { Farmer, SmsMessage, Resource, KnowledgeArticle, LogbookEntry, AuditLog } from '@/lib/types';
import { MessageSquare, Scan, Tractor, Shield, Wind, Flame, Sprout, Droplets, ShieldAlert, Sun } from 'lucide-react';

// =================================================================================
// BASE DATA
// This is the primary source of truth for the application's mock data.
// All other data sets below (for charts, etc.) are derived from this base data.
// =================================================================================

export const farmers: Farmer[] = [
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
    lastSmsActivity: '2023-10-28T14:30:00Z',
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
    lastSmsActivity: '2023-10-29T11:00:00Z',
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
    lastSmsActivity: '2023-10-27T18:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/103/200/200',
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
    lastSmsActivity: '2023-10-26T12:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/106/200/200',
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
    registrationDate: '2023-10-29T13:00:00Z',
    lastSmsActivity: '2023-10-29T13:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/105/200/200',
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
    avatarUrl: 'https://picsum.photos/seed/107/200/200',
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
    avatarUrl: 'https://picsum.photos/seed/108/200/200',
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
    lastSmsActivity: '2023-10-25T09:00:00Z',
    avatarUrl: 'https://picsum.photos/seed/109/200/200',
    status: 'active'
  },
];

export const smsMessages: SmsMessage[] = [
  {
    id: 'SMS001',
    farmerId: 'FARM002',
    farmerName: 'Maria Clara',
    phone: '+639182345678',
    message: 'PEST TOMATO LEAFMINER. May dilaw na batik ang dahon ng kamatis ko. Paano ito masusugpo?',
    timestamp: '2023-10-29T11:00:00Z',
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
    id: 'SMS002',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    phone: '+639171234567',
    message: 'HARVEST PALAY 120kg. Malapit na ang anihan ng palay ko. May mga tip ba para pagkatapos ng ani?',
    timestamp: '2023-10-28T14:30:00Z',
    parsedIntent: 'HARVEST',
    urgency: 'medium',
    status: 'approved',
    aiAdvice: 'Para sa post-harvest, tiyaking maayos ang pagpapatuyo ng mga butil sa 14% na moisture content bago itago. Gumamit ng malinis na sako at mga pasilidad ng imbakan upang maiwasan ang mga peste.',
    aiConfidence: 0.95,
    safetyFlag: 'Low',
    tone: 'Neutral',
  },
  {
    id: 'SMS003',
    farmerId: 'FARM003',
    farmerName: 'Jose Rizal',
    phone: '+639193456789',
    message: 'PEST SUGARCANE BORER. Kinakain ng peste ang mga tubo ko. Mukha silang mga borer.',
    timestamp: '2023-10-27T18:00:00Z',
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
    timestamp: '2023-10-26T12:00:00Z',
    parsedIntent: 'REQUEST',
    urgency: 'medium',
    status: 'pending_approval',
    aiAdvice: 'Nakita po namin na kailangan ninyo ng sprayer. Mayroon pong 2 magagamit na sprayer sa barangay hall. Maaari po kayong kumuha ng voucher sa pamamagitan ng pag-apruba sa mensaheng ito.',
    aiConfidence: 0.97,
    safetyFlag: 'Low',
    tone: 'Neutral',
  },
  {
    id: 'SMS005',
    farmerId: 'FARM005',
    farmerName: 'Andres Bonifacio',
    phone: '+639215678901',
    message: 'REGISTER Andres Bonifacio 29 Lalaki Zone 5 Gulay 1ha',
    timestamp: '2023-10-29T13:00:00Z',
    parsedIntent: 'REGISTER',
    status: 'pending_approval',
    urgency: 'medium',
    aiAdvice: 'Salamat sa pagpaparehistro, Andres Bonifacio! Ang iyong farmer ID ay FARM005. Nakarehistro sa iyo ang Gulay sa 1 ektarya sa Zone 5. Mangyaring kumpirmahin ang pagpaparehistro.',
    aiConfidence: 0.99,
    safetyFlag: 'Low',
    tone: 'Neutral',
  },
  {
    id: 'SMS006',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    phone: '+639171234567',
    message: 'EMERGENCY TYPHOON DAMAGE. Nasira ng malakas na hangin ang bahagi ng aking taniman ng mais.',
    timestamp: '2023-10-24T09:00:00Z',
    parsedIntent: 'EMERGENCY',
    urgency: 'high',
    status: 'pending_approval',
    aiAdvice: 'Nakalulungkot marinig iyan. I-dokumento ang pinsala. Maaari kang mag-apply para sa tulong-pinansyal sa ilalim ng programa ng DA para sa mga nasalanta ng kalamidad. Makipag-ugnayan sa iyong lokal na tanggapan ng agrikultura.',
    aiConfidence: 0.92,
    safetyFlag: 'Medium',
    tone: 'Kritikal',
  },
   {
    id: 'SMS007',
    farmerId: 'FARM008',
    farmerName: 'Apolinario Mabini',
    phone: '+639248901234',
    message: 'may lason po ba para sa daga? dami dito sa amin',
    timestamp: '2023-10-25T10:00:00Z',
    parsedIntent: 'PEST_DISEASE',
    urgency: 'high',
    status: 'pending_approval',
    aiAdvice: 'Para sa problema sa daga, subukan ang paggamit ng rat traps o paglalagay ng mga pananim na hindi nila gusto sa paligid ng iyong bukid. Kung gagamit ng lason, mag-ingat po at sundin ang instructions.',
    aiConfidence: 0.88,
    safetyFlag: 'High',
    tone: 'Nag-aalala',
  },
];

export const resources: Resource[] = [
    { id: 'RES001', name: 'Patabang Urea', category: 'Pataba', stock: 8, unit: 'sako (50kg)', lastUpdated: '2023-10-26' },
    { id: 'RES002', name: 'Binhi ng Hybrid na Palay (SL-8H)', category: 'Binhi', stock: 20, unit: 'sako (20kg)', lastUpdated: '2023-10-25' },
    { id: 'RES003', name: 'Hand Tractor', category: 'Kagamitan', stock: 5, unit: 'yunit', lastUpdated: '2023-10-20' },
    { id: 'RES004', name: 'Pangkat ng Manggagawa sa Komunidad', category: 'Paggawa', stock: 25, unit: 'tao', lastUpdated: '2023-10-27' },
    { id: 'RES005', name: 'Neem Oil (Organic Pesticide)', category: 'Pataba', stock: 150, unit: 'bote (1L)', lastUpdated: '2023-10-28' },
    { id: 'RES006', name: 'Sprayer', category: 'Kagamitan', stock: 2, unit: 'yunit', lastUpdated: '2023-10-28' },
    { id: 'RES007', name: 'Ammonium Phosphate (16-20-0)', category: 'Pataba', stock: 5, unit: 'sako (50kg)', lastUpdated: '2023-10-22' },
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
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'SMS',
        icon: MessageSquare,
        title: 'Nag-ulat ng Peste sa Kamatis',
        description: 'PEST TOMATO LEAFMINER. May dilaw na batik ang dahon ng kamatis ko. Paano ito masusugpo?',
    },
    {
        id: 'LOG002',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        type: 'Payo',
        icon: Scan,
        title: 'Nagpadala ng Payo ang AI',
        description: 'Maaaring senyales ng leafminer ang mga dilaw na batik. Isaalang-alang ang paggamit ng neem oil spray. Alisin at sirain ang mga apektadong dahon.',
    },
     {
        id: 'LOG003',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'Tala sa Bukid',
        icon: Sprout,
        title: 'Pagbisita sa Bukid ni AEW',
        description: 'Kinumpirma ang pagkakaroon ng leafminer. Nagbigay ng sample ng neem oil at nagturo ng tamang pag-spray.',
    },
    {
        id: 'LOG004',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Tulong',
        icon: Tractor,
        title: 'Nakatanggap ng Tulong',
        description: 'Nakatanggap ng 2 sako ng Urea na pataba bilang bahagi ng municipal aid program.',
    }
];

export const registeredUsers = [
    { email: 'brgy-admin@lingkodani.gov.ph', name: 'Brgy. Admin', role: 'barangay' },
    { email: 'captain@lingkodani.gov.ph', name: 'Bgy. Captain Cruz', role: 'barangay' },
    { email: 'secretary@lingkodani.gov.ph', name: 'Sec. Maria Clara', role: 'barangay' },
    { email: 'aew@lingkodani.gov.ph', name: 'AEW Jose Rizal', role: 'barangay' },
    { email: 'dev@lingkodani.gov.ph', name: 'Developer', role: 'developer' },
];

export const auditLogs: AuditLog[] = [
    { id: 'AUD001', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), user: 'AEW Jose Rizal', action: 'APPROVE_AI_REPLY', details: 'Inaprubahan ang tugon para sa SMS002 mula kay Juan dela Cruz.'},
    { id: 'AUD002', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), user: 'Sec. Maria Clara', action: 'REJECT_AI_REPLY', details: 'Tinanggihan ang tugon para sa SMS003 mula kay Jose Rizal.'},
    { id: 'AUD003', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: 'Bgy. Captain Cruz', action: 'SEND_BROADCAST', details: 'Nagpadala ng alerto sa baha sa 4 na magsasaka.'},
    { id: 'AUD004', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), user: 'brgy-admin@lingkodani.gov.ph', action: 'UPDATE_FARMER', details: 'In-update ang mga pananim para kay Maria Clara (FARM002).'},
    { id: 'AUD005', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), user: 'system', action: 'AUTO_ALERT_GENERATED', details: 'Bumuo ng alerto sa panganib ng baha batay sa data ng panahon.'},
];


// =================================================================================
// CHART DATA (Derived from Base Data)
// To keep components clean, data transformation for charts is pre-processed here.
// In a real application, this would be done on the server or client-side.
// =================================================================================

// Derived from `smsMessages`
export const issueTrendsData = [
    { date: 'Oct 1', MgaPeste: 0, Sakit: 0, Patubig: 0 },
    { date: 'Oct 8', MgaPeste: 0, Sakit: 0, Patubig: 0 },
    { date: 'Oct 15', MgaPeste: 0, Sakit: 0, Patubig: 0 },
    { date: 'Oct 22', MgaPeste: 1, Sakit: 0, Patubig: 0 },
    { date: 'Oct 29', MgaPeste: 2, Sakit: 0, Patubig: 0 },
];

// Derived from `smsMessages` (last 7 days)
export const smsVolumeData = [
    { name: 'Lun', total: 0 }, // 23
    { name: 'Mar', total: 1 }, // 24
    { name: 'Miy', total: 1 }, // 25
    { name: 'Huw', total: 1 }, // 26
    { name: 'Biy', total: 2 }, // 27
    { name: 'Sab', total: 1 }, // 28
    { name: 'Lin', total: 2 }, // 29
];

// Derived from `smsMessages`
export const adviceSuccessData = [
    { status: 'Inaprubahan', value: 1, fill: 'hsl(var(--chart-1))' }, // SMS002
    { status: 'In-edit', value: 0, fill: 'hsl(var(--chart-2))' },
    { status: 'Tinanggihan', value: 1, fill: 'hsl(var(--destructive))' }, // SMS003
];

// This is a snapshot, not derived from current time-series data.
export const cropStageData = [
    { name: 'Pagtatanim', value: 2, fill: 'hsl(var(--chart-1))' }, // Hypothetical
    { name: 'Paglago', value: 3, fill: 'hsl(var(--chart-2))' }, // Hypothetical
    { name: 'Pamumulaklak', value: 1, fill: 'hsl(var(--chart-3))' }, // Hypothetical
    { name: 'Pag-aani', value: 2, fill: 'hsl(var(--chart-4))' }, // Hypothetical
];

// Derived from `smsMessages`
export const topKeywordsData = [
  { word: 'peste', count: 3 },
  { word: 'dahon', count: 1 },
  { word: 'kamatis', count: 1 },
  { word: 'ani', count: 1 },
  { word: 'tubo', count: 1 },
  { word: 'sprayer', count: 1 },
  { word: 'hangin', count: 1 },
  { word: 'lason', count: 1 },
  { word: 'daga', count: 1 },
];

// Derived from `smsMessages` message content (approximated)
export const languageUsageData = [
    { language: 'Tagalog', value: 57, fill: 'hsl(var(--chart-1))' }, // 4/7 messages are mostly tagalog
    { language: 'Taglish', value: 43, fill: 'hsl(var(--chart-2))' }, // 3/7 messages
    { language: 'Ilocano', value: 0, fill: 'hsl(var(--chart-3))' },
    { language: 'English', value: 0, fill: 'hsl(var(--chart-4))' },
];

// Derived from `smsMessages` timestamps
export const smsPeakHoursData = [
  { hour: '8-10am', messages: 2 },
  { hour: '10-12pm', messages: 1 },
  { hour: '12-2pm', messages: 2 },
  { hour: '2-4pm', messages: 1 },
  { hour: '4-6pm', messages: 1 },
  { hour: '6-8pm', messages: 1 },
];

// This is hypothetical as it requires AEW interaction data
export const interventionSupportData = [
    { month: "Jan", visits: 0 },
    { month: "Feb", visits: 0 },
    { month: "Mar", visits: 0 },
    { month: "Apr", visits: 0 },
    { month: "May", visits: 1 },
];

// Derived from `smsMessages` statuses
export const validationQueueData = [
    { name: 'Nakabinbin', value: 4, fill: 'hsl(var(--chart-2))' },
    { name: 'Nalutas', value: 3, fill: 'hsl(var(--chart-1))' }, // approved + rejected
];

// Hypothetical data
export const advisoryDeliveryData = [
    { name: 'Tagumpay', value: 98, fill: 'hsl(var(--chart-1))' },
    { name: 'Nabigo', value: 2, fill: 'hsl(var(--destructive))' },
];

// Hypothetical data
export const followUpRateData = [
    { name: 'May Follow-up', value: 35, fill: 'hsl(var(--chart-1))' },
    { name: 'Walang Follow-up', value: 65, fill: 'hsl(var(--chart-2))' },
];

// Derived from `smsMessages` aiConfidence
export const aiConfidenceTrendData = [
    { date: 'Oct 23', confidence: 92 },
    { date: 'Oct 25', confidence: 88 },
    { date: 'Oct 26', confidence: 97 },
    { date: 'Oct 27', confidence: 78 },
    { date: 'Oct 28', confidence: 95 },
    { date: 'Oct 29', confidence: 92 }, // avg of 85 and 99
];

// Hypothetical data
export const correctionLogData = [
    { type: 'Intent', count: 1 },
    { type: 'Entity', count: 2 },
    { type: 'Advice', count: 1 },
];

// Derived from `smsMessages` status
export const aiAgreementData = [
    { name: 'Approved As-is', value: 1, fill: 'hsl(var(--chart-1))' }, // SMS002
    { name: 'Revised', value: 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Rejected', value: 1, fill: 'hsl(var(--destructive))' }, // SMS003
];

// Derived from `smsMessages` safetyFlag
export const highRiskKeywordData = [
    { word: 'peste', count: 3 },
    { word: 'lason', count: 1 },
    { word: 'emergency', count: 1 },
    { word: 'sira', count: 1 },
    { word: 'daga', count: 1 },
];

// Hypothetical
export const outbreakAlertData = [
    { date: 'Oct 1', ulat: 0 },
    { date: 'Oct 8', ulat: 0 },
    { date: 'Oct 15', ulat: 0 },
    { date: 'Oct 22', ulat: 1 },
    { date: 'Oct 29', ulat: 2 },
];

// Hypothetical
export const severityIndexData = [
    { name: 'Peste', mild: 1, moderate: 1, severe: 2 }, // Peste, Daga, Borer
    { name: 'Sakit', mild: 0, moderate: 1, severe: 0 }, // Dahon
    { name: 'Panahon', mild: 0, moderate: 0, severe: 1 }, // Typhoon
];

// Hypothetical
export const recommendationTypeData = [
    { name: 'Pag-iwas', count: 2 },
    { name: 'Paggamot', count: 3 },
    { name: 'Pagsubaybay', count: 1 },
    { name: 'Referral', count: 1 },
];

// Derived from `smsMessages`
export const messageLengthData = [
    { range: '1-20', count: 0 },
    { range: '21-80', count: 7 },
    { range: '81-160', count: 0 },
];

// Derived from `smsMessages` aiConfidence
export const clarificationNeededData = [
    { name: 'Nangailangan ng Clarification', value: 29, fill: 'hsl(var(--chart-2))' }, // 2/7 are below 90%
    { name: 'Hindi Kinailangan', value: 71, fill: 'hsl(var(--chart-1))' },
];

// Derived from `smsMessages` message content (approximated)
export const topInquiriesData = [
    { question: 'Gamot sa peste?', count: 3 },
    { question: 'Bakit dilaw ang dahon?', count: 1 },
    { question: 'Paano mag-ani?', count: 1 },
    { question: 'Sira ang gamit', count: 1 },
    { question: 'Pinsala ng bagyo', count: 1 },
];

// Hypothetical
export const seasonalTrendData = [
    { month: 'Jan', reports: 1 },
    { month: 'Feb', reports: 0 },
    { month: 'Mar', reports: 0 },
    { month: 'Apr', reports: 0 },
    { month: 'May', reports: 0 },
    { month: 'Jun', reports: 0 },
    { month: 'Jul', reports: 0 },
    { month: 'Aug', reports: 0 },
    { month: 'Sep', reports: 0 },
    { month: 'Oct', reports: 7 },
    { month: 'Nov', reports: 0 },
    { month: 'Dec', reports: 0 },
];

// Hypothetical
export const farmerEngagementData = [
    { type: 'First-time', count: 3 },
    { type: 'Repeat', count: 2 },
    { type: 'Frequent', count: 1 },
];

// Derived from `smsMessages` and `farmers`
export const geographicHotspotData = [
    { zone: 'Zone 1', issues: 2 }, // FARM001 (2 SMS)
    { zone: 'Zone 2', issues: 1 }, // FARM002
    { zone: 'Zone 3', issues: 2 }, // FARM003, FARM008
    { zone: 'Zone 4', issues: 1 }, // FARM004
    { zone: 'Zone 5', issues: 1 }, // FARM005
    { zone: 'Zone 6', issues: 0 },
    { zone: 'Zone 7', issues: 0 },
];

// Hypothetical
export const smsDeliveryStatusData = [
    { name: 'Napadala', value: 998, fill: 'hsl(var(--chart-1))' },
    { name: 'Nabigo', value: 2, fill: 'hsl(var(--destructive))' },
];

// Derived from `smsMessages` tone
export const messageToneData = [
    { tone: 'Neutral', count: 3, fill: 'hsl(var(--chart-1))' },
    { tone: 'Nag-aalala', count: 2, fill: 'hsl(var(--chart-2))' },
    { tone: 'Kritikal', count: 2, fill: 'hsl(var(--destructive))' },
    { tone: 'Positibo', count: 0, fill: 'hsl(var(--chart-3))' },
];

// Hypothetical
export const responseTimeData = [
    { name: 'Average', time: 5.5 },
    { name: '90th Percentile', time: 15.2 },
];
