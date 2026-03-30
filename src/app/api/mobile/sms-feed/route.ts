import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import type { SmsMessage } from "@/lib/types";

function byRecentTimestamp(left: SmsMessage, right: SmsMessage) {
  return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
}

export async function GET(request: Request) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const snapshot = await getServerFirestore()
    .collection(firebaseCollections.smsMessages)
    .limit(300)
    .get();

  const messages = snapshot.docs
    .map((documentSnapshot) => {
      const message = documentSnapshot.data() as SmsMessage;
      return {
        ...message,
        id: message.id ?? documentSnapshot.id,
      };
    })
    .sort(byRecentTimestamp)
    .slice(0, 40)
    .map((message) => ({
      id: message.id,
      caseId: message.caseId,
      farmerId: message.farmerId,
      farmerName: message.farmerName,
      phone: message.phone,
      message: message.message,
      timestamp: message.timestamp,
      urgency: message.urgency,
      status: message.status,
      caseStatus: message.caseStatus,
      parsedIntent: message.parsedIntent,
      aiAdvice: message.aiAdvice,
      safetyFlag: message.safetyFlag,
      tone: message.tone,
      assignedTo: message.assignedTo,
      officialReminderCount: message.officialReminderCount,
      caseOutcomeStatus: message.caseOutcomeStatus,
      caseOutcomeSummary: message.caseOutcomeSummary,
      resolutionConfirmationStatus: message.resolutionConfirmationStatus,
    }));

  return NextResponse.json({ messages });
}
