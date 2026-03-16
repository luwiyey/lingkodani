import type { Voucher } from "@/lib/types";
import type { VoucherRepository } from "@/lib/repositories/vouchers/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoVoucherStore?: Voucher[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoVoucherStore) {
    demoStore.__lingkodAniDemoVoucherStore = [];
  }

  return demoStore.__lingkodAniDemoVoucherStore;
}

export const demoVoucherRepository: VoucherRepository = {
  async listVouchers() {
    return [...getStore()];
  },

  async createVoucher(voucher) {
    getStore().unshift(voucher);
    return voucher;
  },

  async updateVoucher(id, updates) {
    const store = getStore();
    const index = store.findIndex((item) => item.id === id);

    if (index === -1) return null;

    store[index] = {
      ...store[index],
      ...updates,
    };

    return store[index];
  },
};
