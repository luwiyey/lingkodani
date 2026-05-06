import type { AuditLog } from "@/lib/types";
import type { AuditRepository } from "@/lib/repositories/audit/types";
import { auditLogs as initialAuditLogs } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<AuditLog>({
  storageKey: "auditLogs",
  initialData: initialAuditLogs,
});

export const demoAuditRepository: AuditRepository = {
  async listAuditLogs() {
    return store.list();
  },

  async createAuditLog(input) {
    return store.prepend(input);
  },

  async updateAuditLog(id, updates) {
    return store.updateById(id, updates);
  },
};
