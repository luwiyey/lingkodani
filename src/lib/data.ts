
import type { Farmer, SmsMessage, Resource, KnowledgeArticle } from '@/lib/types';

export const farmers: Farmer[] = [
  {
    id: 'FARM001',
    name: 'Juan dela Cruz',
    phone: '+639171234567',
    location: 'Barangay San Isidro, Nueva Ecija',
    farmSize: 2.5,
    crops: ['Rice', 'Corn'],
    riskScore: 25,
    registrationDate: '2023-01-15',
    avatarUrl: 'https://picsum.photos/seed/101/200/200',
  },
  {
    id: 'FARM002',
    name: 'Maria Clara',
    phone: '+639182345678',
    location: 'Barangay Santa Cruz, Isabela',
    farmSize: 1.8,
    crops: ['Vegetables'],
    riskScore: 45,
    registrationDate: '2023-02-20',
    avatarUrl: 'https://picsum.photos/seed/102/200/200',
  },
  {
    id: 'FARM003',
    name: 'Jose Rizal',
    phone: '+639193456789',
    location: 'Barangay Mabini, Batangas',
    farmSize: 5.0,
    crops: ['Sugarcane'],
    riskScore: 15,
    registrationDate: '2023-03-10',
    avatarUrl: 'https://picsum.photos/seed/103/200/200',
  },
  {
    id: 'FARM004',
    name: 'Gabriela Silang',
    phone: '+639204567890',
    location: 'Barangay Lapu-Lapu, Ilocos Sur',
    farmSize: 3.2,
    crops: ['Tobacco', 'Corn'],
    riskScore: 60,
    registrationDate: '2023-04-05',
    avatarUrl: 'https://picsum.photos/seed/106/200/200',
  },
];

export const smsMessages: SmsMessage[] = [
  {
    id: 'SMS001',
    farmerId: 'FARM002',
    farmerName: 'Maria Clara',
    message: 'My tomatoes have yellow spots on the leaves. What should I do?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    urgency: 'high',
    status: 'pending',
    aiAdvice: 'Yellow spots may indicate a fungal infection. Consider applying a fungicide. Ensure proper spacing for air circulation. Please check knowledge base article #KB012 for more details.',
    aiConfidence: 0.85,
    knowledgeBaseId: 'KB012',
  },
  {
    id: 'SMS002',
    farmerId: 'FARM001',
    farmerName: 'Juan dela Cruz',
    message: 'Harvest time for my rice is approaching. Any tips for post-harvest?',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    urgency: 'medium',
    status: 'approved',
    aiAdvice: 'For post-harvest, ensure proper drying of grains to 14% moisture content before storage. Use clean sacks and storage facilities to prevent pests.',
    aiConfidence: 0.95,
  },
  {
    id: 'SMS003',
    farmerId: 'FARM003',
    farmerName: 'Jose Rizal',
    message: 'My sugarcane stalks are being eaten by pests. They look like borers.',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    urgency: 'high',
    status: 'rejected',
    aiAdvice: 'This could be a stem borer infestation. Use of pheromone traps or introducing natural predators like Trichogramma wasps can be effective. Avoid harsh chemical pesticides if possible.',
    aiConfidence: 0.78,
  },
  {
    id: 'SMS004',
    farmerId: 'FARM004',
    farmerName: 'Gabriela Silang',
    message: 'When is the best time to plant corn for the next season?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    urgency: 'low',
    status: 'edited',
    aiAdvice: 'The best time to plant corn is at the beginning of the rainy season, typically May or June. Ensure your soil is well-prepared.',
    aiConfidence: 0.98,
  },
];


export const resources: Resource[] = [
    { id: 'RES001', name: 'Urea Fertilizer', category: 'Fertilizers', stock: 500, unit: 'bags (50kg)', lastUpdated: '2023-10-26' },
    { id: 'RES002', name: 'Hybrid Rice Seeds (SL-8H)', category: 'Seeds', stock: 200, unit: 'bags (20kg)', lastUpdated: '2023-10-25' },
    { id: 'RES003', name: 'Hand Tractor', category: 'Tools', stock: 5, unit: 'units', lastUpdated: '2023-10-20' },
    { id: 'RES004', name: 'Community Labor Pool', category: 'Labor', stock: 25, unit: 'persons available', lastUpdated: '2023-10-27' },
];

export const knowledgeArticles: KnowledgeArticle[] = [
    {
        id: 'KB012',
        title: 'Managing Fungal Infections in Tomato Plants',
        summary: 'A guide to identifying and treating common fungal diseases like blight and yellow leaf spot in tomatoes.',
        content: '...',
        keywords: ['tomato', 'fungus', 'yellow spots', 'blight'],
        lastUpdated: '2023-09-15',
        author: 'Admin',
    },
    {
        id: 'KB015',
        title: 'Rice Post-Harvest Management',
        summary: 'Best practices for drying, storing, and milling rice to maximize quality and minimize loss.',
        content: '...',
        keywords: ['rice', 'harvest', 'storage', 'drying'],
        lastUpdated: '2023-08-22',
        author: 'Admin',
    }
];

export const issueTrendsData = [
    { date: 'Oct 1', Pests: 30, Disease: 20, Irrigation: 15 },
    { date: 'Oct 8', Pests: 35, Disease: 25, Irrigation: 18 },
    { date: 'Oct 15', Pests: 45, Disease: 22, Irrigation: 25 },
    { date: 'Oct 22', Pests: 40, Disease: 30, Irrigation: 20 },
    { date: 'Oct 29', Pests: 50, Disease: 35, Irrigation: 22 },
];

export const smsVolumeData = [
    { name: 'Mon', total: 120 },
    { name: 'Tue', total: 150 },
    { name: 'Wed', total: 110 },
    { name: 'Thu', total: 180 },
    { name: 'Fri', total: 220 },
    { name: 'Sat', total: 90 },
    { name: 'Sun', total: 70 },
];

export const adviceSuccessData = [
    { status: 'Approved', value: 75, fill: 'hsl(var(--chart-1))' },
    { status: 'Edited', value: 15, fill: 'hsl(var(--chart-2))' },
    { status: 'Rejected', value: 10, fill: 'hsl(var(--destructive))' },
];
