import { getServerFirestore } from "@/lib/firebase/server";

const AUTOMATION_LOCK_COLLECTION = "_automationLocks";

type AutomationLockRecord = {
  owner?: string;
  expiresAt?: string;
  updatedAt?: string;
};

function randomOwner(lockId: string) {
  return `${lockId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readExpiration(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export async function withAutomationLock<T>(
  lockId: string,
  leaseMs: number,
  task: () => Promise<T>
) {
  const db = getServerFirestore();
  const lockRef = db.collection(AUTOMATION_LOCK_COLLECTION).doc(lockId);
  const owner = randomOwner(lockId);
  const now = Date.now();
  const expiresAt = new Date(now + leaseMs).toISOString();

  const acquired = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(lockRef);
    const existing = snapshot.exists ? (snapshot.data() as AutomationLockRecord) : null;
    const lockExpiresAt = readExpiration(existing?.expiresAt);

    if (existing?.owner && lockExpiresAt > now) {
      return false;
    }

    transaction.set(
      lockRef,
      {
        owner,
        expiresAt,
        updatedAt: new Date(now).toISOString(),
      } satisfies AutomationLockRecord,
      { merge: true }
    );

    return true;
  });

  if (!acquired) {
    return {
      acquired: false as const,
      result: null,
    };
  }

  try {
    const result = await task();

    return {
      acquired: true as const,
      result,
    };
  } finally {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(lockRef);
      const existing = snapshot.exists ? (snapshot.data() as AutomationLockRecord) : null;

      if (existing?.owner === owner) {
        transaction.delete(lockRef);
      }
    });
  }
}
