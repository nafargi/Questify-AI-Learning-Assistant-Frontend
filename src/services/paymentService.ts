import { api } from "@/lib/api";

export interface PaymentInitiateResponse {
  transaction_id: string;
  pay_url: string;
}

export interface Transaction {
  transaction_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  provider_trade_no: string;
  provider_reference: string;
  created_at: string;
}

export const paymentService = {
  initiate: async (plan_id: string): Promise<PaymentInitiateResponse> => {
    const res = await api.post<PaymentInitiateResponse>("/payments/initiate", { plan_id });
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  getHistory: async (): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>("/payments/history");
    if (!res.success) throw new Error(res.message);
    return res.data;
  },
};
