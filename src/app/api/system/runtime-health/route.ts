import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { listRuntimeHealthRecords } from "@/lib/system-health";
import type { OutboundMessage, SmsMessage } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getServerFirestore();
  const [records, latestInboundSnapshot, latestOutboundSnapshot] = await Promise.all([
    listRuntimeHealthRecords(),
    db.collection(firebaseCollections.smsMessages).orderBy("timestamp", "desc").limit(1).get(),
    db.collection(firebaseCollections.outboundMessages).orderBy("createdAt", "desc").limit(1).get(),
  ]);

  const latestInbound = latestInboundSnapshot.docs[0]?.data() as SmsMessage | undefined;
  const latestOutbound = latestOutboundSnapshot.docs[0]?.data() as OutboundMessage | undefined;

  return NextResponse.json({
    records,
    latestInbound: latestInbound
      ? {
          timestamp: latestInbound.timestamp,
          farmerName: latestInbound.farmerName,
          caseId: latestInbound.caseId ?? latestInbound.id,
          sourceProvider: latestInbound.sourceProvider ?? "unknown",
        }
      : null,
    latestOutbound: latestOutbound
      ? {
          createdAt: latestOutbound.createdAt,
          recipientPhone: latestOutbound.recipientPhone,
          purpose: latestOutbound.purpose ?? "other",
          status: latestOutbound.status,
          provider: latestOutbound.provider,
        }
      : null,
  });
}
