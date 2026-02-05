
import type { Farmer, SmsMessage, Resource, KnowledgeArticle, LogbookEntry, AuditLog } from '@/lib/types';
import { MessageSquare, Scan, Tractor, Shield, Wind, Flame, Sprout } from 'lucide-react';

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
    registrationDate: '2023-01-15',
    lastSmsActivity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
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
    registrationDate: '2023-02-20',
    lastSmsActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
    registrationDate: '2023-03-10',
    lastSmsActivity: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
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
    registrationDate: '2023-04-05',
    lastSmsActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    registrationDate: '2023-05-12',
    lastSmsActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
    registrationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastSmsActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    registrationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastSmsActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://picsum.photos/seed/108/200/200',
    status: 'pending_approval'
  }
];

export const smsMessages: SmsMessage[] = [
  {
    id: 'SMS001',
    farmerId: 'FARM002',
    farmerName: 'Maria Clara',
    phone: '+639182345678',
    message: 'PEST TOMATO LEAFMINER. May dilaw na batik ang dahon ng kamatis ko. Paano ito masusugpo?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    message: 'REGISTER Andres Bonifacio 29 Lalaki Tondo Gulay 1ha',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    parsedIntent: 'REGISTER',
    status: 'pending_approval',
    urgency: 'medium',
    aiAdvice: 'Salamat sa pagpaparehistro, Andres Bonifacio! Ang iyong farmer ID ay FARM005. Nakarehistro sa iyo ang Gulay sa 1 ektarya sa Tondo. Mangyaring kumpirmahin ang pagpaparehistro.',
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
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    parsedIntent: 'EMERGENCY',
    urgency: 'high',
    status: 'pending_approval',
    aiAdvice: 'Nakalulungkot marinig iyan. I-dokumento ang pinsala. Maaari kang mag-apply para sa tulong-pinansyal sa ilalim ng programa ng DA para sa mga nasalanta ng kalamidad. Makipag-ugnayan sa iyong lokal na tanggapan ng agrikultura.',
    aiConfidence: 0.92,
    safetyFlag: 'Medium',
    tone: 'Kritikal',
  },
];


export const resources: Resource[] = [
    { id: 'RES001', name: 'Patabang Urea', category: 'Pataba', stock: 500, unit: 'sako (50kg)', lastUpdated: '2023-10-26' },
    { id: 'RES002', name: 'Binhi ng Hybrid na Palay (SL-8H)', category: 'Binhi', stock: 200, unit: 'sako (20kg)', lastUpdated: '2023-10-25' },
    { id: 'RES003', name: 'Hand Tractor', category: 'Kagamitan', stock: 5, unit: 'yunit', lastUpdated: '2023-10-20' },
    { id: 'RES004', name: 'Pangkat ng Manggagawa sa Komunidad', category: 'Paggawa', stock: 25, unit: 'tao', lastUpdated: '2023-10-27' },
    { id: 'RES005', name: 'Neem Oil (Organic Pesticide)', category: 'Pataba', stock: 150, unit: 'bote (1L)', lastUpdated: '2023-10-28' },
    { id: 'RES006', name: 'Sprayer', category: 'Kagamitan', stock: 2, unit: 'yunit', lastUpdated: '2023-10-28' },
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

export const issueTrendsData = [
    { date: 'Oct 1', MgaPeste: 30, Sakit: 20, Patubig: 15 },
    { date: 'Oct 8', MgaPeste: 35, Sakit: 25, Patubig: 18 },
    { date: 'Oct 15', MgaPeste: 45, Sakit: 22, Patubig: 25 },
    { date: 'Oct 22', MgaPeste: 40, Sakit: 30, Patubig: 20 },
    { date: 'Oct 29', MgaPeste: 50, Sakit: 35, Patubig: 22 },
];

export const smsVolumeData = [
    { name: 'Lun', total: 120 },
    { name: 'Mar', total: 150 },
    { name: 'Miy', total: 110 },
    { name: 'Huw', total: 180 },
    { name: 'Biy', total: 220 },
    { name: 'Sab', total: 90 },
    { name: 'Lin', total: 70 },
];

export const adviceSuccessData = [
    { status: 'Inaprubahan', value: 75, fill: 'hsl(var(--chart-1))' },
    { status: 'In-edit', value: 15, fill: 'hsl(var(--chart-2))' },
    { status: 'Tinanggihan', value: 10, fill: 'hsl(var(--destructive))' },
];

export const cropStageData = [
    { name: 'Pagtatanim', value: 400, fill: 'hsl(var(--chart-1))' },
    { name: 'Paglago', value: 300, fill: 'hsl(var(--chart-2))' },
    { name: 'Pamumulaklak', value: 200, fill: 'hsl(var(--chart-3))' },
    { name: 'Pag-aani', value: 100, fill: 'hsl(var(--chart-4))' },
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

export const auditLogs: AuditLog[] = [
    { id: 'AUD001', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), user: 'brgy-admin@lingkodani.gov.ph', action: 'APPROVE_AI_REPLY', details: 'Inaprubahan ang tugon para sa SMS002 mula kay Juan dela Cruz.'},
    { id: 'AUD002', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), user: 'brgy-admin@lingkodani.gov.ph', action: 'REJECT_AI_REPLY', details: 'Tinanggihan ang tugon para sa SMS003 mula kay Jose Rizal.'},
    { id: 'AUD003', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: 'brgy-admin@lingkodani.gov.ph', action: 'SEND_BROADCAST', details: 'Nagpadala ng alerto sa baha sa 24 na magsasaka.'},
    { id: 'AUD004', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), user: 'brgy-admin@lingkodani.gov.ph', action: 'UPDATE_FARMER', details: 'In-update ang mga pananim para kay Maria Clara (FARM002).'},
    { id: 'AUD005', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), user: 'system', action: 'AUTO_ALERT_GENERATED', details: 'Bumuo ng alerto sa panganib ng baha batay sa data ng panahon.'},
];

export const topKeywordsData = [
  { word: 'Peste', count: 45 },
  { word: 'Pataba', count: 38 },
  { word: 'Sakit', count: 32 },
  { word: 'Ani', count: 28 },
  { word: 'Tubig', count: 25 },
  { word: 'Tulong', count: 22 },
  { word: 'Presyo', count: 19 },
  { word: 'Kamatis', count: 18 },
  { word: 'Palay', count: 15 },
  { word: 'Salamat', count: 12 },
];

export const languageUsageData = [
    { language: 'Tagalog', value: 65, fill: 'hsl(var(--chart-1))' },
    { language: 'Taglish', value: 20, fill: 'hsl(var(--chart-2))' },
    { language: 'Ilocano', value: 10, fill: 'hsl(var(--chart-3))' },
    { language: 'English', value: 5, fill: 'hsl(var(--chart-4))' },
];

export const smsPeakHoursData = [
  { hour: '6-8am', messages: 15 },
  { hour: '8-10am', messages: 28 },
  { hour: '10-12pm', messages: 22 },
  { hour: '12-2pm', messages: 18 },
  { hour: '2-4pm', messages: 25 },
  { hour: '4-6pm', messages: 35 },
  { hour: '6-8pm', messages: 20 },
];
