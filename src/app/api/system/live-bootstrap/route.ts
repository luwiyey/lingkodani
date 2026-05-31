import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { defaultSystemSettings, mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from "@/lib/system-settings";
import type {
  AlertHistoryEntry,
  Farmer,
  FarmerAssistanceRecord,
  FieldVisitTask,
  MarketPriceEntry,
  OutboundMessage,
  Resource,
  SmsMessage,
  SystemSettings,
  User,
  Voucher,
} from "@/lib/types";
import { withResolvedUserPermissions } from "@/lib/user-permissions";

function withDocumentId<T>(snapshot: { id: string; data(): unknown }) {
  return {
    id: snapshot.id,
    ...(snapshot.data() as T),
  };
}

export async function GET(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const db = getServerFirestore();
    const [
      systemSettingsSnapshot,
      resourcesSnapshot,
      marketPricesSnapshot,
      farmersSnapshot,
      smsMessagesSnapshot,
      vouchersSnapshot,
      assistanceSnapshot,
      fieldVisitsSnapshot,
      alertHistorySnapshot,
      outboundMessagesSnapshot,
      usersSnapshot,
    ] = await Promise.all([
      db.collection(firebaseCollections.systemSettings).doc(SYSTEM_SETTINGS_DOCUMENT_ID).get(),
      db.collection(firebaseCollections.resources).orderBy("lastUpdated", "desc").limit(250).get(),
      db.collection(firebaseCollections.marketPrices).orderBy("updatedAt", "desc").limit(250).get(),
      db.collection(firebaseCollections.farmers).orderBy("registrationDate", "desc").limit(500).get(),
      db.collection(firebaseCollections.smsMessages).orderBy("timestamp", "desc").limit(500).get(),
      db.collection(firebaseCollections.vouchers).orderBy("issueDate", "desc").limit(250).get(),
      db.collection(firebaseCollections.assistanceRecords).orderBy("updatedAt", "desc").limit(250).get(),
      db.collection(firebaseCollections.fieldVisitTasks).orderBy("scheduledFor", "asc").limit(250).get(),
      db.collection(firebaseCollections.alertHistory).orderBy("timestamp", "desc").limit(250).get(),
      db.collection(firebaseCollections.outboundMessages).orderBy("createdAt", "desc").limit(500).get(),
      auth.profile.role === "developer"
        ? db.collection(firebaseCollections.users).orderBy("name", "asc").limit(250).get()
        : Promise.resolve(null),
    ]);

    const users =
      auth.profile.role === "developer" && usersSnapshot
        ? usersSnapshot.docs.map((documentSnapshot) =>
            withResolvedUserPermissions(withDocumentId<User>(documentSnapshot))
          )
        : [withResolvedUserPermissions(auth.profile)];

    return NextResponse.json({
      bootstrap: {
        systemSettings: mergeSystemSettings(
          systemSettingsSnapshot.exists
            ? (systemSettingsSnapshot.data() as Partial<SystemSettings>)
            : defaultSystemSettings
        ),
        resources: resourcesSnapshot.docs.map((documentSnapshot) => withDocumentId<Resource>(documentSnapshot)),
        marketPrices: marketPricesSnapshot.docs.map((documentSnapshot) => withDocumentId<MarketPriceEntry>(documentSnapshot)),
        farmers: farmersSnapshot.docs.map((documentSnapshot) => withDocumentId<Farmer>(documentSnapshot)),
        smsMessages: smsMessagesSnapshot.docs.map((documentSnapshot) => withDocumentId<SmsMessage>(documentSnapshot)),
        vouchers: vouchersSnapshot.docs.map((documentSnapshot) => withDocumentId<Voucher>(documentSnapshot)),
        assistanceRecords: assistanceSnapshot.docs.map((documentSnapshot) => withDocumentId<FarmerAssistanceRecord>(documentSnapshot)),
        fieldVisitTasks: fieldVisitsSnapshot.docs.map((documentSnapshot) => withDocumentId<FieldVisitTask>(documentSnapshot)),
        alertHistory: alertHistorySnapshot.docs.map((documentSnapshot) => withDocumentId<AlertHistoryEntry>(documentSnapshot)),
        outboundMessages: outboundMessagesSnapshot.docs.map((documentSnapshot) => withDocumentId<OutboundMessage>(documentSnapshot)),
        users,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to build live bootstrap payload", error);
    return NextResponse.json(
      { error: "Hindi mabuo ang paunang live bootstrap payload." },
      { status: 500 }
    );
  }
}
