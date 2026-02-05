
import type { Farmer, SmsMessage, Resource, KnowledgeArticle } from '@/lib/types';

export const farmers: Farmer[] = [
  {
    id: 'FARM001',
    name: 'Juan dela Cruz',
    phone: '+639171234567',
    location: 'San Isidro',
    municipality: 'Nueva Ecija',
    farmSize: 2.5,
    crops: ['Palay', 'Mais'],
    riskScore: 25,
    registrationDate: '2023-01-15',
    avatarUrl: 'https://picsum.photos/seed/101/200/200',
  },
  {
    id: 'FARM002',
    name: 'Maria Clara',
    phone: '+639182345678',
    location: 'Santa Cruz',
    municipality: 'Isabela',
    farmSize: 1.8,
    crops: ['Kamatis'],
    riskScore: 45,
    registrationDate: '2023-02-20',
    avatarUrl: 'https://picsum.photos/seed/102/200/200',
  },
  {
    id: 'FARM003',
    name: 'Jose Rizal',
    phone: '+639193456789',
    location: 'Mabini',
    municipality: 'Batangas',
    farmSize: 5.0,
    crops: ['Tubo'],
    riskScore: 15,
    registrationDate: '2023-03-10',
    avatarUrl: 'https://picsum.photos/seed/103/200/200',
  },
  {
    id: 'FARM004',
    name: 'Gabriela Silang',
    phone: '+639204567890',
    location: 'Lapu-Lapu',
    municipality: 'Ilocos Sur',
    farmSize: 3.2,
    crops: ['Tabako', 'Mais'],
    riskScore: 60,
    registrationDate: '2023-04-05',
    avatarUrl: 'https://picsum.photos/seed/106/200/200',
  },
  {
    id: 'FARM005',
    name: 'Andres Bonifacio',
    phone: '+639215678901',
    location: 'Tondo',
    municipality: 'Maynila',
    farmSize: 1.0,
    crops: ['Gulay'],
    riskScore: 30,
    registrationDate: '2023-05-12',
    avatarUrl: 'https://picsum.photos/seed/105/200/200',
  },
];

export const smsMessages: SmsMessage[] = [
  {
    id: 'SMS001',
    farmerId: 'FARM002',
    farmerName: 'Maria Clara',
    message: 'PEST TOMATO LEAFMINER. May dilaw na batik ang dahon ng kamatis ko. Paano ito masusugpo?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'pest-report',
    urgency: 'high',
    status: 'pending',
    aiAdvice: 'Maaaring senyales ng leafminer ang mga dilaw na batik. Isaalang-alang ang paggamit ng neem oil spray. Alisin at sirain ang mga apektadong dahon. Tingnan ang KB012 para sa karagdagang detalye.',
    aiConfidence: 0.85,
    knowledgeBaseId: 'KB012',
  },
  {
    id: 'SMS002',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    message: 'HARVEST PALAY 120kg. Malapit na ang anihan ng palay ko. May mga tip ba para pagkatapos ng ani?',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    type: 'crop-update',
    urgency: 'medium',
    status: 'approved',
    aiAdvice: 'Para sa post-harvest, tiyaking maayos ang pagpapatuyo ng mga butil sa 14% na moisture content bago itago. Gumamit ng malinis na sako at mga pasilidad ng imbakan upang maiwasan ang mga peste.',
    aiConfidence: 0.95,
  },
  {
    id: 'SMS003',
    farmerId: 'FARM003',
    farmerName: 'Jose Rizal',
    message: 'PEST SUGARCANE BORER. Kinakain ng peste ang mga tubo ko. Mukha silang mga borer.',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    type: 'pest-report',
    urgency: 'high',
    status: 'rejected',
    aiAdvice: 'Maaaring ito ay isang stem borer infestation. Ang paggamit ng mga pheromone trap o pagpapakilala ng mga natural na mandaragit tulad ng Trichogramma wasps ay maaaring maging epektibo.',
    aiConfidence: 0.78,
  },
  {
    id: 'SMS004',
    farmerId: 'FARM004',
    farmerName: 'Gabriela Silang',
    message: 'REQUEST SEED MAIS 10kg. Kailan ang pinakamainam na oras para magtanim ng mais para sa susunod na season?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'request',
    urgency: 'low',
    status: 'edited',
    aiAdvice: 'Ang pinakamahusay na oras para magtanim ng mais ay sa simula ng tag-ulan, karaniwang Mayo o Hunyo. Tiyaking mahusay na inihanda ang iyong lupa. Naitala na namin ang iyong kahilingan para sa binhi.',
    aiConfidence: 0.98,
  },
  {
    id: 'SMS005',
    farmerId: 'FARM005',
    farmerName: 'Andres Bonifacio',
    message: 'REGISTER Andres Bonifacio Tondo Gulay 1ha',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'registration',
    status: 'actioned',
    urgency: 'medium',
    aiAdvice: 'Salamat sa pagpaparehistro, Andres Bonifacio! Ang iyong farmer ID ay FARM005. Nakarehistro sa iyo ang Gulay sa 1 ektarya sa Tondo, Maynila.',
    aiConfidence: 0.99,
  },
  {
    id: 'SMS006',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    message: 'WEATHER TYPHOON DAMAGE. Nasira ng malakas na hangin ang bahagi ng aking taniman ng mais.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'weather',
    urgency: 'high',
    status: 'pending',
    aiAdvice: 'Nakalulungkot marinig iyan. I-dokumento ang pinsala. Maaari kang mag-apply para sa tulong-pinansyal sa ilalim ng programa ng DA para sa mga nasalanta ng kalamidad. Makipag-ugnayan sa iyong lokal na tanggapan ng agrikultura.',
    aiConfidence: 0.92,
  },
];


export const resources: Resource[] = [
    { id: 'RES001', name: 'Patabang Urea', category: 'Mga Pataba', stock: 500, unit: 'sako (50kg)', lastUpdated: '2023-10-26' },
    { id: 'RES002', name: 'Binhi ng Hybrid na Palay (SL-8H)', category: 'Mga Binhi', stock: 200, unit: 'sako (20kg)', lastUpdated: '2023-10-25' },
    { id: 'RES003', name: 'Hand Tractor', category: 'Mga Kasangkapan', stock: 5, unit: 'yunit', lastUpdated: '2023-10-20' },
    { id: 'RES004', name: 'Pangkat ng Manggagawa sa Komunidad', category: 'Paggawa', stock: 25, unit: 'tao', lastUpdated: '2023-10-27' },
    { id: 'RES005', name: 'Neem Oil (Organic Pesticide)', category: 'Mga Pataba', stock: 150, unit: 'bote (1L)', lastUpdated: '2023-10-28' },
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
    },
    {
        id: 'KB015',
        title: 'Pamamahala Pagkatapos ng Pag-aani ng Palay',
        summary: 'Pinakamahusay na kasanayan para sa pagpapatuyo, pag-iimbak, at paggiling ng palay upang mapakinabangan ang kalidad at mabawasan ang pagkawala.',
        content: '...',
        keywords: ['palay', 'ani', 'imbakan', 'pagpapatuyo'],
        lastUpdated: '2023-08-22',
        author: 'Admin',
    },
    {
        id: 'KB021',
        title: 'Epektibong Paggamit ng Patabang Urea',
        summary: 'Mga pamamaraan para sa tamang aplikasyon ng Urea upang matiyak ang pinakamainam na pagsipsip ng sustansya ng halaman at mabawasan ang pag-aaksaya.',
        content: '...',
        keywords: ['urea', 'pataba', 'aplikasyon', 'sustansya'],
        lastUpdated: '2023-09-01',
        author: 'Admin',
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
]
