import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import { createAuditEntry } from "@/lib/services/audit-service";
import type { Farmer, LogbookEntry } from "@/lib/types";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const farmerId = id.trim();
    const body = await request.json();
    const note = normalizeText(body.note);

    if (!farmerId) {
      return NextResponse.json({ error: "Missing farmer ID." }, { status: 400 });
    }

    if (!note) {
      return NextResponse.json(
        { error: "Kinakailangan ang tala bago ito i-save." },
        { status: 400 }
      );
    }

    const db = getServerFirestore();
    const farmerRef = db.collection(firebaseCollections.farmers).doc(farmerId);
    const farmerSnapshot = await farmerRef.get();

    if (!farmerSnapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang farmer record." },
        { status: 404 }
      );
    }

    const farmer = farmerSnapshot.data() as Farmer;
    const timestamp = new Date().toISOString();
    const actorName = auth.profile.name ?? auth.email;
    const logbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${farmerId}-NOTE`,
      farmerId,
      timestamp,
      type: "Tala sa Bukid",
      title: "Mobile field note",
      description: `${actorName}: ${note}`,
      data: {
        source: "mobile_app",
      },
    };
    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-MOBILE-NOTE`,
      timestamp,
      user: actorName,
      action: "MOBILE_FARMER_NOTE_CREATED",
      details: `Nag-save ng farmer note para kay ${farmer.name || farmerId}.`,
      category: "operations",
      severity: "info",
      afterSnapshot: {
        farmerId,
        note,
      },
    });

    await Promise.all([
      db
        .collection(firebaseCollections.logbookEntries)
        .doc(logbookEntry.id)
        .set(logbookEntry),
      db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog),
    ]);

    return NextResponse.json({
      saved: true,
      entry: logbookEntry,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi na-save ang farmer note mula sa mobile app." },
      { status: 500 }
    );
  }
}
