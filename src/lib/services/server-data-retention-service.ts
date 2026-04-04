import { applyDataRetentionSweep } from "@/lib/data-retention";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from "@/lib/system-settings";
import type { AuditLog, Farmer, SystemSettings } from "@/lib/types";

function createAuditLog(actorName: string, redactedAuditLogs: number, redactedArchivedFarmers: number): AuditLog {
  return {
    id: `AUD-RETENTION-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: actorName,
    action: "RUN_DATA_RETENTION_SWEEP",
    details: `Audit logs redacted: ${redactedAuditLogs}; archived farmers redacted: ${redactedArchivedFarmers}.`,
  };
}

export async function processLiveDataRetentionSweep(actorName = "system") {
  const db = getServerFirestore();
  const [settingsSnapshot, auditSnapshot, farmersSnapshot] = await Promise.all([
    db.collection(firebaseCollections.systemSettings).doc(SYSTEM_SETTINGS_DOCUMENT_ID).get(),
    db.collection(firebaseCollections.auditLogs).get(),
    db.collection(firebaseCollections.farmers).get(),
  ]);

  const settings = mergeSystemSettings(
    settingsSnapshot.exists ? (settingsSnapshot.data() as Partial<SystemSettings>) : undefined
  );
  const auditLogs = auditSnapshot.docs.map((doc) => doc.data() as AuditLog);
  const farmers = farmersSnapshot.docs.map((doc) => doc.data() as Farmer);
  const result = applyDataRetentionSweep({
    auditLogs,
    farmers,
    policy: settings.retentionPolicy,
  });

  if (
    result.redactedAuditLogIds.length === 0 &&
    result.redactedFarmerIds.length === 0
  ) {
    return {
      checkedAuditLogs: auditLogs.length,
      checkedFarmers: farmers.length,
      redactedAuditLogs: 0,
      redactedArchivedFarmers: 0,
      skipped: true,
      reason: "nothing_to_redact",
    };
  }

  const writeBatch = db.batch();

  for (const id of result.redactedAuditLogIds) {
    const updated = result.auditLogs.find((entry) => entry.id === id);

    if (!updated) {
      continue;
    }

    writeBatch.set(
      db.collection(firebaseCollections.auditLogs).doc(id),
      updated,
      { merge: true }
    );
  }

  for (const id of result.redactedFarmerIds) {
    const updated = result.farmers.find((entry) => entry.id === id);

    if (!updated) {
      continue;
    }

    writeBatch.set(
      db.collection(firebaseCollections.farmers).doc(id),
      updated,
      { merge: true }
    );
  }

  const auditLog = createAuditLog(
    actorName,
    result.redactedAuditLogIds.length,
    result.redactedFarmerIds.length
  );
  writeBatch.set(
    db.collection(firebaseCollections.auditLogs).doc(auditLog.id),
    auditLog
  );

  await writeBatch.commit();

  return {
    checkedAuditLogs: auditLogs.length,
    checkedFarmers: farmers.length,
    redactedAuditLogs: result.redactedAuditLogIds.length,
    redactedArchivedFarmers: result.redactedFarmerIds.length,
    skipped: false,
  };
}
