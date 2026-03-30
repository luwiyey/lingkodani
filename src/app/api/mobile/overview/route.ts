import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import type { Farmer, SmsMessage } from "@/lib/types";

function byRecentDate(left?: string, right?: string) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}

export async function GET(request: Request) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getServerFirestore();
  const [farmersSnapshot, messagesSnapshot] = await Promise.all([
    db.collection(firebaseCollections.farmers).limit(300).get(),
    db.collection(firebaseCollections.smsMessages).limit(300).get(),
  ]);

  const farmers = farmersSnapshot.docs.map((documentSnapshot) => {
    const farmer = documentSnapshot.data() as Farmer;
    return {
      ...farmer,
      id: farmer.id ?? documentSnapshot.id,
    };
  });
  const messages = messagesSnapshot.docs.map((documentSnapshot) => {
    const message = documentSnapshot.data() as SmsMessage;
    return {
      ...message,
      id: message.id ?? documentSnapshot.id,
    };
  });

  const recentMessages = [...messages]
    .sort((left, right) => byRecentDate(left.timestamp, right.timestamp))
    .slice(0, 5)
    .map((message) => ({
      id: message.id,
      farmerName: message.farmerName,
      phone: message.phone,
      message: message.message,
      timestamp: message.timestamp,
      urgency: message.urgency,
      caseStatus: message.caseStatus,
      status: message.status,
    }));

  return NextResponse.json({
    profile: {
      id: auth.profile.id,
      name: auth.profile.name,
      email: auth.profile.email,
      role: auth.profile.role,
      title: auth.profile.title,
      preferredWorkspace: auth.profile.preferredWorkspace ?? "simple",
    },
    summary: {
      farmerCount: farmers.length,
      activeFarmerCount: farmers.filter((farmer) => farmer.status === "active").length,
      pendingFarmerCount: farmers.filter((farmer) => farmer.status === "pending_approval").length,
      openCaseCount: messages.filter((message) => message.caseStatus && message.caseStatus !== "closed").length,
      highUrgencyCount: messages.filter((message) => message.urgency === "high").length,
      awaitingApprovalCount: messages.filter((message) => message.status === "pending_approval").length,
    },
    recentMessages,
  });
}
