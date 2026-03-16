import { config as loadEnv } from "dotenv";

import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import firebaseAdminCredentialHelpers from "../src/lib/firebase/admin-credentials.js";

loadEnv({ path: ".env.local", override: true });
loadEnv();

const { firebaseAdminCredentialHelpText, resolveFirebaseAdminCredentials } = firebaseAdminCredentialHelpers;
const resolvedCredentials = resolveFirebaseAdminCredentials(process.env);

if (!resolvedCredentials) {
  throw new Error(firebaseAdminCredentialHelpText);
}

const appOptions =
  resolvedCredentials.kind === "applicationDefault"
    ? {
        credential: applicationDefault(),
        ...(resolvedCredentials.projectId ? { projectId: resolvedCredentials.projectId } : {}),
      }
    : {
        credential: cert(resolvedCredentials.serviceAccount),
        projectId: resolvedCredentials.projectId,
      };

const app = getApps().length > 0
  ? getApp()
  : initializeApp(appOptions);

const db = getFirestore(app);
const auth = getAuth(app);

const farmers = [
  {
    id: "FARM009",
    name: "Felipe M. Macedonio",
    age: 58,
    gender: "Lalaki",
    phone: "+639159876543",
    barangay: "Batakil",
    sitio: "Zone 1",
    farmSize: 3.5,
    crops: ["Palay"],
    registrationDate: "2023-10-20T08:00:00Z",
    lastSmsActivity: "2026-03-08T14:30:00Z",
    avatarUrl: "https://picsum.photos/seed/felipe/200/200",
    status: "active",
  },
  {
    id: "FARM001",
    name: "Juan dela Cruz",
    age: 45,
    gender: "Lalaki",
    phone: "+639171234567",
    barangay: "Batakil",
    sitio: "Zone 1",
    farmSize: 2.5,
    crops: ["Palay", "Mais"],
    registrationDate: "2023-10-01T08:00:00Z",
    lastSmsActivity: "2026-03-08T09:00:00Z",
    avatarUrl: "https://picsum.photos/seed/101/200/200",
    status: "active",
  },
  {
    id: "FARM002",
    name: "Maria Clara",
    age: 38,
    gender: "Babae",
    phone: "+639182345678",
    barangay: "Batakil",
    sitio: "Zone 2",
    farmSize: 1.8,
    crops: ["Kamatis"],
    registrationDate: "2023-10-02T09:00:00Z",
    lastSmsActivity: "2026-03-08T11:00:00Z",
    avatarUrl: "https://picsum.photos/seed/102/200/200",
    status: "active",
  },
];

const smsMessages = [
  {
    id: "SMS008",
    farmerId: "FARM009",
    farmerName: "Felipe M. Macedonio",
    phone: "+639159876543",
    message: "Maraming rice bugs sa aking palayan sa Zone 1. Nakakaalarma na ang dami nila.",
    timestamp: "2026-03-08T14:30:00Z",
    parsedIntent: "PEST_DISEASE",
    urgency: "high",
    status: "pending_approval",
    aiAdvice: "Base sa inyong ulat, mukhang may outbreak ng rice bugs. Inirerekomenda ang agarang inspeksyon.",
    aiConfidence: 0.94,
    safetyFlag: "Medium",
    tone: "Nag-aalala",
  },
  {
    id: "SMS001",
    farmerId: "FARM002",
    farmerName: "Maria Clara",
    phone: "+639182345678",
    message: "PEST TOMATO LEAFMINER. May dilaw na batik ang dahon ng kamatis ko. Paano ito masusugpo?",
    timestamp: "2026-03-08T11:00:00Z",
    parsedIntent: "PEST_DISEASE",
    urgency: "high",
    status: "pending_approval",
    aiAdvice: "Maaaring senyales ng leafminer ang mga dilaw na batik. Tingnan ang knowledge base para sa detalye.",
    aiConfidence: 0.85,
    safetyFlag: "Low",
    tone: "Nag-aalala",
  },
  {
    id: "SMS002",
    farmerId: "FARM001",
    farmerName: "Juan dela Cruz",
    phone: "+639171234567",
    message: "HARVEST PALAY 120kg. Malapit na ang anihan ng palay ko.",
    timestamp: "2026-03-08T09:00:00Z",
    parsedIntent: "HARVEST",
    urgency: "medium",
    status: "approved",
    aiAdvice: "Para sa post-harvest, tiyaking maayos ang pagpapatuyo ng mga butil.",
    aiConfidence: 0.95,
    safetyFlag: "Low",
    tone: "Neutral",
    respondedAt: "2026-03-08T09:18:00Z",
  },
];

const auditLogs = [
  {
    id: "AUD006",
    timestamp: "2026-03-08T14:31:00Z",
    user: "system",
    action: "AUTO_ADVICE_GENERATED",
    details: "Binuo ang paunang payo para kay Felipe M. Macedonio.",
  },
  {
    id: "AUD001",
    timestamp: "2026-03-08T09:18:00Z",
    user: "Brgy. Admin",
    action: "APPROVE_AI_REPLY",
    details: "Juan dela Cruz: approved",
  },
];

const users = [
  {
    email: "brgy-admin@lingkodani.gov.ph",
    name: "Brgy. Admin",
    role: "barangay",
    title: "Barangay Administrator",
    barangay: "Batakil",
    phone: "+639171111111",
    avatarUrl: "https://picsum.photos/seed/brgy-admin/200/200",
    status: "active",
    createdAt: "2026-03-01T08:00:00Z",
    updatedAt: "2026-03-08T08:00:00Z",
    lastLoginAt: "2026-03-08T08:00:00Z",
  },
  {
    email: "dev@lingkodani.gov.ph",
    name: "Developer",
    role: "developer",
    title: "Platform Developer",
    barangay: "Municipal Support",
    phone: "+639175555555",
    status: "active",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-03-08T09:00:00Z",
    lastLoginAt: "2026-03-08T09:00:00Z",
  },
];

const systemSettings = {
  id: "barangay-current",
  brgyDescription: "Isang masiglang barangay na nakatuon sa pagpapabuti ng agrikultura at kapakanan ng mga magsasaka nito.",
  zoneDescriptions: Array.from({ length: 7 }, (_, index) => ({
    zone: `Zone ${index + 1}`,
    description: `Paglalarawan para sa Zone ${index + 1}...`,
  })),
  replyStartTime: "08:00",
  replyEndTime: "19:00",
  adminPhone: "+639123456789",
  templateCategories: [
    {
      id: "confirmation",
      label: "Pagkumpirma",
      templates: [
        {
          id: "confirmation-1",
          text: "Salamat sa inyong ulat. Natanggap na ito ng Lingkod-Ani at ipo-forward namin agad sa barangay agriculture team.",
          keywords: ["salamat", "ulat", "natanggap"],
        },
      ],
    },
    {
      id: "investigation",
      label: "Pagsisiyasat",
      templates: [
        {
          id: "investigation-1",
          text: "Salamat sa ulat. Maaari po bang ilahad ang crop, lokasyon, at pangunahing sintomas upang mas tumpak ang aming payo?",
          keywords: ["crop", "lokasyon", "sintomas"],
        },
      ],
    },
    {
      id: "resolution",
      label: "Resolusyon",
      templates: [
        {
          id: "resolution-1",
          text: "Na-review na ang inyong kahilingan at magpapadala kami ng sunod na update tungkol sa susunod na hakbang o resource availability.",
          keywords: ["review", "resource", "update"],
        },
      ],
    },
    {
      id: "emergency",
      label: "Emergency",
      templates: [
        {
          id: "emergency-1",
          text: "Natanggap ang inyong agarang ulat. Unahin ang kaligtasan at makipag-ugnayan sa barangay sa [Numero ng Hotline] kung may banta sa tao o ari-arian.",
          keywords: ["agarang", "kaligtasan", "hotline"],
        },
      ],
    },
  ],
  autoReplyEnabled: true,
  autoReplyTimeoutMinutes: 3,
  updatedAt: new Date().toISOString(),
  updatedBy: "Seeder",
};

const logbookEntries = [
  {
    id: "LOG001",
    farmerId: "FARM009",
    timestamp: "2026-03-08T14:30:00Z",
    type: "SMS",
    title: "Nag-ulat ng Rice Bugs",
    description: "Ulat ni Felipe M. Macedonio tungkol sa rice bugs sa Zone 1.",
  },
  {
    id: "LOG002",
    farmerId: "FARM009",
    timestamp: "2026-03-08T14:31:00Z",
    type: "Payo",
    title: "Nagpadala ng Payo ang AI",
    description: "Binuo ang paunang payo tungkol sa paggamit ng pesticide at voucher.",
  },
];

const resources = [
  {
    id: "RES006",
    name: "Sprayer",
    category: "Kagamitan",
    stock: 2,
    unit: "yunit",
    lastUpdated: "2026-03-08",
  },
  {
    id: "RES008",
    name: "Pamatay-peste (Pesticide)",
    category: "Pataba",
    stock: 15,
    unit: "bote (500ml)",
    lastUpdated: "2026-03-08",
  },
];

const marketPrices = [
  {
    id: "PRICE001",
    crop: "Palay",
    price: 24,
    unit: "kilo",
    source: "Batakil Bagsakan",
    trend: "up",
    updatedAt: "2026-03-15T07:10:00Z",
  },
  {
    id: "PRICE002",
    crop: "Kamatis",
    price: 42,
    unit: "kilo",
    source: "Public Market",
    trend: "down",
    updatedAt: "2026-03-14T22:00:00Z",
  },
];

const alertHistory = [
  {
    id: "ALH001",
    title: "Panganib ng Baha (72 Oras)",
    timestamp: "2026-03-15T07:30:00Z",
    type: "flood",
    severity: "Critical",
    message: "Babala: Posibleng malakas na pag-ulan at pagbaha sa mabababang bahagi ng Batakil sa loob ng 72 oras.",
    recommendation: "I-secure ang mga punla, linisin ang daluyan ng tubig, at maghanda sa agarang paglikas ng mga kagamitan kung tataas ang tubig.",
    source: "risk_center",
    recipientFarmerIds: ["FARM001", "FARM002", "FARM009"],
    sentCount: 3,
    failedCount: 0,
  },
];

const assistanceRecords = [
  {
    id: "AST001",
    farmerId: "FARM009",
    type: "Pesticide",
    title: "Pesticide support para sa rice bugs",
    details: "Nakareserba ang 2 bote ng pesticide at naghihintay ng field verification bago i-release.",
    quantity: "2 bote (500ml)",
    status: "in_progress",
    providedBy: "AEW Jose Rizal",
    createdAt: "2026-03-15T08:10:00Z",
    updatedAt: "2026-03-15T08:10:00Z",
    nextAction: "Bisitahin sa March 16 para i-check ang lawak ng infestation.",
    resourceId: "RES008",
  },
  {
    id: "AST002",
    farmerId: "FARM001",
    type: "Voucher",
    title: "Seed voucher para sa susunod na taniman",
    details: "Na-issue ang barangay support voucher para sa hybrid palay seeds.",
    quantity: "1 voucher",
    status: "completed",
    providedBy: "Brgy. Admin",
    createdAt: "2026-03-14T02:20:00Z",
    updatedAt: "2026-03-14T09:10:00Z",
    fulfilledAt: "2026-03-14T09:10:00Z",
    nextAction: "I-follow up ang germination status sa loob ng 7 araw.",
    resourceId: "RES006",
  },
];

const fieldVisitTasks = [
  {
    id: "VISIT001",
    farmerId: "FARM009",
    title: "Field validation para sa rice bugs",
    purpose: "Sukatin ang lawak ng infestation at kumpirmahin ang kailangan na pesticide support.",
    scheduledFor: "2026-03-16T01:30:00Z",
    assignedTo: "AEW Jose Rizal",
    priority: "high",
    status: "scheduled",
    createdAt: "2026-03-15T08:20:00Z",
    updatedAt: "2026-03-15T08:20:00Z",
    relatedSmsId: "SMS008",
  },
  {
    id: "VISIT002",
    farmerId: "FARM002",
    title: "Tomato leafminer follow-up",
    purpose: "I-check ang apektadong dahon at i-document ang rekomendadong intervention.",
    scheduledFor: "2026-03-15T06:00:00Z",
    assignedTo: "AEW Jose Rizal",
    priority: "high",
    status: "in_progress",
    createdAt: "2026-03-15T05:50:00Z",
    updatedAt: "2026-03-15T06:05:00Z",
    relatedSmsId: "SMS001",
  },
];

const knowledgeArticles = [
  {
    id: "KB012",
    title: "Pamamahala ng mga Peste sa Kamatis (Tomato Leafminer)",
    summary: "Gabay sa pagkilala at paggamot sa tomato leafminer.",
    content: "...",
    keywords: ["kamatis", "peste", "leafminer"],
    lastUpdated: "2023-09-15",
    author: "Admin",
    type: "article",
  },
  {
    id: "KB015",
    title: "Pamamahala Pagkatapos ng Pag-aani ng Palay",
    summary: "Pinakamahusay na kasanayan para sa pagpapatuyo at pag-iimbak ng palay.",
    content: "...",
    keywords: ["palay", "ani", "imbakan"],
    lastUpdated: "2023-08-22",
    author: "Admin",
    type: "article",
  },
];

const vouchers = [
  {
    id: "VOUCH001",
    farmerId: "FARM001",
    resourceId: "RES006",
    quantity: 1,
    code: "SPR-001",
    status: "issued",
    issueDate: "2026-03-08T10:00:00Z",
  },
];

for (const farmer of farmers) {
  await db.collection("farmers").doc(farmer.id).set(farmer);
}

for (const message of smsMessages) {
  await db.collection("smsMessages").doc(message.id).set(message);
}

for (const log of auditLogs) {
  await db.collection("auditLogs").doc(log.id).set(log);
}

for (const user of users) {
  let firebaseUser;

  try {
    firebaseUser = await auth.getUserByEmail(user.email);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    firebaseUser = await auth.createUser({
      email: user.email,
      password: "Lingkod!Seed01",
      displayName: user.name,
    });
  }

  await db.collection("users").doc(firebaseUser.uid).set({
    ...user,
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
  });
}

for (const entry of logbookEntries) {
  await db.collection("logbookEntries").doc(entry.id).set(entry);
}

for (const resource of resources) {
  await db.collection("resources").doc(resource.id).set(resource);
}

for (const entry of marketPrices) {
  await db.collection("marketPrices").doc(entry.id).set(entry);
}

for (const entry of alertHistory) {
  await db.collection("alertHistory").doc(entry.id).set(entry);
}

for (const record of assistanceRecords) {
  await db.collection("assistanceRecords").doc(record.id).set(record);
}

for (const task of fieldVisitTasks) {
  await db.collection("fieldVisitTasks").doc(task.id).set(task);
}

for (const article of knowledgeArticles) {
  await db.collection("knowledgeArticles").doc(article.id).set(article);
}

for (const voucher of vouchers) {
  await db.collection("vouchers").doc(voucher.id).set(voucher);
}

await db.collection("systemSettings").doc(systemSettings.id).set(systemSettings);

console.log("Seeded Firestore collections: farmers, smsMessages, auditLogs, users, systemSettings, logbookEntries, resources, marketPrices, alertHistory, assistanceRecords, fieldVisitTasks, knowledgeArticles, vouchers");
