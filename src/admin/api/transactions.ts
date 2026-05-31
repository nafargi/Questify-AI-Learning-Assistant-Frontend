import { adminClient } from "./client";

export interface AdminTransaction {
  transaction_id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  provider_trade_no?: string;
  provider_reference?: string;
  created_at: string;
}

export const transactionsApi = {
  list: async (skip = 0, limit = 50): Promise<AdminTransaction[]> => {
    const res = await adminClient.get<AdminTransaction[]>(
      `/admin/transactions?skip=${skip}&limit=${limit}`
    );
    return res.data;
  },
};
