import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import type {
  Farmer,
  FarmerAssistanceRecord,
  FieldVisitTask,
  SmsMessage,
} from "@/lib/types";

function byNewestDate<T>(items: T[], getValue: (item: T) => string | undefined) {
  return [...items].sort(
    (left, right) =>
      new Date(getValue(right) ?? 0).getTime() -
      new Date(getValue(left) ?? 0).getTime()
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const farmerId = id.trim();

  if (!farmerId) {
    return NextResponse.json({ error: "Missing farmer ID." }, { status: 400 });
  }

  const db = getServerFirestore();
  const farmerRef = db.collection(firebaseCollections.farmers).doc(farmerId);
  const [farmerSnapshot, smsSnapshot, assistanceSnapshot, visitSnapshot] =
    await Promise.all([
      farmerRef.get(),
      db
        .collection(firebaseCollections.smsMessages)
        .where("farmerId", "==", farmerId)
        .limit(40)
        .get(),
      db
        .collection(firebaseCollections.assistanceRecords)
        .where("farmerId", "==", farmerId)
        .limit(25)
        .get(),
      db
        .collection(firebaseCollections.fieldVisitTasks)
        .where("farmerId", "==", farmerId)
        .limit(25)
        .get(),
    ]);

  if (!farmerSnapshot.exists) {
    return NextResponse.json({ error: "Hindi makita ang farmer record." }, { status: 404 });
  }

  const farmer = farmerSnapshot.data() as Farmer;
  const messages = byNewestDate(
    smsSnapshot.docs.map((documentSnapshot) => {
      const message = documentSnapshot.data() as SmsMessage;
      return {
        ...message,
        id: message.id ?? documentSnapshot.id,
      };
    }),
    (message) => message.timestamp
  ).slice(0, 20);

  const assistanceRecords = byNewestDate(
    assistanceSnapshot.docs.map((documentSnapshot) => {
      const record = documentSnapshot.data() as FarmerAssistanceRecord;
      return {
        ...record,
        id: record.id ?? documentSnapshot.id,
      };
    }),
    (record) => record.updatedAt ?? record.createdAt
  ).slice(0, 12);

  const fieldVisitTasks = byNewestDate(
    visitSnapshot.docs.map((documentSnapshot) => {
      const visit = documentSnapshot.data() as FieldVisitTask;
      return {
        ...visit,
        id: visit.id ?? documentSnapshot.id,
      };
    }),
    (visit) => visit.updatedAt ?? visit.scheduledFor
  ).slice(0, 12);

  return NextResponse.json({
    farmer: {
      ...farmer,
      id: farmer.id ?? farmerSnapshot.id,
    },
    recentMessages: messages,
    assistanceRecords,
    fieldVisitTasks,
  });
}
