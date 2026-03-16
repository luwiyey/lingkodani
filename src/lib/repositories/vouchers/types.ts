import type { Voucher } from "@/lib/types";

export interface VoucherRepository {
  listVouchers(): Promise<Voucher[]>;
  createVoucher(voucher: Voucher): Promise<Voucher>;
  updateVoucher(id: string, updates: Partial<Voucher>): Promise<Voucher | null>;
}
