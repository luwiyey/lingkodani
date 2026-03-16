import type { AuditLog } from "@/lib/types";
import type { AuditRepository } from "@/lib/repositories/audit/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoAuditStore?: AuditLog[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoAuditStore) {
    demoStore.__lingkodAniDemoAuditStore = [];
  }

  return demoStore.__lingkodAniDemoAuditStore;
}

export const demoAuditRepository: AuditRepository = {
  async listAuditLogs() {
    return [...getStore()];
  },

  async createAuditLog(input) {
    getStore().unshift(input);
    return input;
  },
};
