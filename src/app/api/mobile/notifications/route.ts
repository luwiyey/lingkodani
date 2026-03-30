import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import type { AlertHistoryEntry, SmsMessage } from "@/lib/types";

function byRecent(left?: string, right?: string) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}

export async function GET(request: Request) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getServerFirestore();
  const [alertsSnapshot, smsSnapshot] = await Promise.all([
    db.collection(firebaseCollections.alertHistory).limit(25).get(),
    db.collection(firebaseCollections.smsMessages).limit(250).get(),
  ]);

  const alerts = alertsSnapshot.docs
    .map((documentSnapshot) => {
      const alert = documentSnapshot.data() as AlertHistoryEntry;
      return {
        id: alert.id ?? documentSnapshot.id,
        title: alert.title,
        timestamp: alert.timestamp,
        kind: "alert",
        severity: alert.severity.toLowerCase(),
        subtitle: alert.message,
        detail: alert.recommendation,
      };
    })
    .sort((left, right) => byRecent(left.timestamp, right.timestamp))
    .slice(0, 12);

  const urgentCases = smsSnapshot.docs
    .map((documentSnapshot) => {
      const message = documentSnapshot.data() as SmsMessage;
      return {
        ...message,
        id: message.id ?? documentSnapshot.id,
      };
    })
    .filter((message) => !message.closedAt && message.caseStatus !== "closed")
    .filter(
      (message) =>
        message.urgency === "high" ||
        message.status === "pending_approval" ||
        message.caseStatus === "awaiting_registration"
    )
    .sort((left, right) => byRecent(left.timestamp, right.timestamp))
    .slice(0, 12)
    .map((message) => ({
      id: message.id,
      title: `${message.farmerName} • ${message.urgency.toUpperCase()}`,
      timestamp: message.timestamp,
      kind: "case",
      severity: message.urgency,
      subtitle: message.message,
      detail: `${message.caseStatus ?? "open"} • ${message.parsedIntent}`,
      farmerId: message.farmerId,
      messageId: message.id,
    }));

  return NextResponse.json({
    notifications: [...alerts, ...urgentCases].sort((left, right) =>
      byRecent(left.timestamp, right.timestamp)
    ),
    summary: {
      alertCount: alerts.length,
      urgentCaseCount: urgentCases.length,
    },
  });
}
