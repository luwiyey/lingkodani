import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { screenInboundSms } from "@/lib/inbound-sms-screening";
import { isLiveSmsTestModeEnabled } from "@/lib/live-sms-test-mode";
import { applyPriceWatchAdvice } from "@/lib/services/price-watch-service";
import { analyzeInboundSmsWithFallback } from "@/lib/services/server-sms-analysis-service";
import { processInboundSms } from "@/lib/services/sms-workflow-service";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { buildPhoneLookupCandidates, normalizePhone } from "@/lib/sms-simulator";
import type { Farmer, MarketPriceEntry, SmsMessage, User } from "@/lib/types";

async function queryCollectionByPhone<T extends { id?: string; uid?: string }>(
  collectionName: string,
  phoneCandidates: string[]
) {
  const db = getServerFirestore();
  const merged = new Map<string, T>();

  for (const candidate of phoneCandidates) {
    const snapshot = await db
      .collection(collectionName)
      .where("phone", "==", candidate)
      .limit(10)
      .get();

    for (const item of snapshot.docs) {
      const data = item.data() as T;
      merged.set(String(data.id ?? data.uid ?? item.id), data);
    }
  }

  return Array.from(merged.values());
}

async function queryMessagesByPhone(phoneCandidates: string[]) {
  const db = getServerFirestore();
  const merged = new Map<string, SmsMessage>();

  for (const candidate of phoneCandidates) {
    const snapshot = await db
      .collection(firebaseCollections.smsMessages)
      .where("phone", "==", candidate)
      .limit(25)
      .get();

    for (const item of snapshot.docs) {
      const data = item.data() as SmsMessage;
      merged.set(item.id, data);
    }
  }

  return Array.from(merged.values());
}

export async function POST(request: Request) {
  if (!isLiveMode) {
    return NextResponse.json(
      { error: "Ang safe live SMS test route ay para lamang sa live mode." },
      { status: 400 }
    );
  }

  if (!isLiveSmsTestModeEnabled(process.env)) {
    return NextResponse.json(
      { error: "Naka-lock pa ang live SMS test mode. I-enable muna ito sa server configuration." },
      { status: 403 }
    );
  }

  const auth = await authenticateServerRequest(request, ["developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Kinakailangan ang phone at message." },
        { status: 400 }
      );
    }

    const screening = screenInboundSms({ phone, message });

    if (screening.ignored) {
      return NextResponse.json({
        accepted: true,
        preview: true,
        ignored: true,
        reason: screening.reason,
      });
    }

    const normalizedPhone = screening.normalizedPhone;
    const phoneCandidates = buildPhoneLookupCandidates(phone);
    const [analysis, users, farmers, existingPhoneMessages, marketPriceSnapshot, systemSettings] = await Promise.all([
      analyzeInboundSmsWithFallback({ message }),
      queryCollectionByPhone<User>(firebaseCollections.users, phoneCandidates),
      queryCollectionByPhone<Farmer>(firebaseCollections.farmers, phoneCandidates),
      queryMessagesByPhone(phoneCandidates),
      getServerFirestore().collection(firebaseCollections.marketPrices).get(),
      getServerSystemSettings(),
    ]);

    const matchingOfficial = users.find(
      (user) => user.phone && normalizePhone(user.phone) === normalizedPhone
    );

    if (matchingOfficial) {
      return NextResponse.json(
        {
          error:
            "Ang numerong ito ay tugma sa isang staff o official account. Gumamit ng non-staff test number para sa farmer-flow preview.",
        },
        { status: 409 }
      );
    }

    const marketPrices = marketPriceSnapshot.docs.map(
      (item) => item.data() as MarketPriceEntry
    );
    const workflowBase = processInboundSms({
      id: `TESTSMS${Date.now()}`,
      phone,
      message,
      farmers,
      existingMessages: existingPhoneMessages,
      analysis,
      settings: systemSettings,
      sourceProvider: "simulation",
      externalId: `live-test-${Date.now()}-${auth.userId}`,
    });
    const previewMessage = applyPriceWatchAdvice(workflowBase.message, marketPrices);

    return NextResponse.json({
      accepted: true,
      preview: true,
      ignored: false,
      message: previewMessage,
      wouldCreatePendingFarmer: Boolean(workflowBase.newFarmer),
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi naproseso ang live SMS test preview." },
      { status: 500 }
    );
  }
}
