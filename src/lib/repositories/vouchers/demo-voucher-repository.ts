import type { Voucher } from "@/lib/types";
import type { VoucherRepository } from "@/lib/repositories/vouchers/types";
import { vouchers as initialVouchers } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<Voucher>({
  storageKey: "vouchers",
  initialData: initialVouchers,
});

export const demoVoucherRepository: VoucherRepository = {
  async listVouchers() {
    return store.list();
  },

  async createVoucher(voucher) {
    return store.prepend(voucher);
  },

  async updateVoucher(id, updates) {
    return store.updateById(id, updates);
  },
};
