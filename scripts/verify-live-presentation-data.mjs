import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";

import {
  regularSeasonSmsMessages,
  typhoonSeasonSmsMessages,
} from "./presentation-typhoon-data.mjs";

dotenv.config({ path: ".env.local", override: true });
dotenv.config();

const email = process.env.LIVE_QA_EMAIL;
const password = process.env.LIVE_QA_PASSWORD;

if (!email || !password) {
  throw new Error("Missing LIVE_QA_EMAIL or LIVE_QA_PASSWORD environment variables.");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const normalizePhone = (value) => String(value ?? "").replace(/\D/g, "").replace(/^0/, "63");
const excludedPhones = new Set(
  [
    process.env.SMS_PRIVACY_EXCLUDED_NUMBERS,
    process.env.NEXT_PUBLIC_SMS_PRIVACY_EXCLUDED_NUMBERS,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => normalizePhone(value))
    .filter(Boolean),
);

const app = initializeApp(firebaseConfig, `presentation-verify-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, email, password);

  const snapshot = await getDocs(collection(db, "smsMessages"));
  const storedMessages = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  const visibleMessages = storedMessages.filter(
    (message) => !excludedPhones.has(normalizePhone(message.phone)),
  );
  const hiddenByPrivacy = storedMessages.length - visibleMessages.length;
  const expectedGeneratedIds = new Set(
    [...regularSeasonSmsMessages, ...typhoonSeasonSmsMessages].map((message) => message.id),
  );
  const foundGeneratedIds = new Set(
    visibleMessages
      .map((message) => message.id)
      .filter((id) => expectedGeneratedIds.has(id)),
  );
  const presentationMessages = visibleMessages.filter((message) => (
    /^SMS(?:REG)?2026/.test(message.id)
    && message.timestamp >= "2026-02-01T00:00:00Z"
    && message.timestamp <= "2026-09-08T23:59:59Z"
  ));
  const monthlyCounts = presentationMessages.reduce((counts, message) => {
    const month = message.timestamp.slice(0, 7);
    counts[month] = (counts[month] ?? 0) + 1;
    return counts;
  }, {});
  const rainySeasonDailyCounts = presentationMessages
    .filter((message) => (
      message.timestamp >= "2026-08-01T00:00:00Z"
      && message.timestamp <= "2026-09-08T23:59:59Z"
    ))
    .reduce((counts, message) => {
      const day = message.timestamp.slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
      return counts;
    }, {});
  const rainySeasonCounts = Object.values(rainySeasonDailyCounts);

  if (foundGeneratedIds.size !== expectedGeneratedIds.size) {
    throw new Error(
      `Live verification found ${foundGeneratedIds.size}/${expectedGeneratedIds.size} generated records.`,
    );
  }

  if (presentationMessages.length < 360) {
    throw new Error(`Live verification found only ${presentationMessages.length}/360 presentation records.`);
  }

  if (Object.keys(monthlyCounts).length !== 8) {
    throw new Error("Live presentation records do not cover every month from February through September.");
  }

  if (rainySeasonCounts.length !== 39 || Math.min(...rainySeasonCounts) < 5) {
    throw new Error("Live rainy-season records do not include at least five reports per day.");
  }

  console.log(JSON.stringify({
    verified: true,
    storedSmsRecords: storedMessages.length,
    visibleSmsRecords: visibleMessages.length,
    privacyHiddenRecords: hiddenByPrivacy,
    presentationSmsRecords: presentationMessages.length,
    generatedRecordsFound: foundGeneratedIds.size,
    generatedRecordsExpected: expectedGeneratedIds.size,
    monthlyCounts,
    rainySeasonDays: rainySeasonCounts.length,
    minimumRainySeasonDailyReports: Math.min(...rainySeasonCounts),
    maximumRainySeasonDailyReports: Math.max(...rainySeasonCounts),
  }, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await signOut(auth);
    } catch {
      // Read-only verifier cleanup.
    }
  });
