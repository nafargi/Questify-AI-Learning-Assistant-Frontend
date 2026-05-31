import { adminClient } from "./client";

export interface AdminSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "expired" | "cancelled" | "pending";
  started_at: string;
  expires_at: string;
  payment_reference?: string;
}

export interface AssignSubscriptionPayload {
  user_id: string;
  plan_id: string;
  status?: string;
}

export const subscriptionsApi = {
  list: async (skip = 0, limit = 50): Promise<AdminSubscription[]> => {
    const res = await adminClient.get<AdminSubscription[]>(
      `/admin/subscriptions?skip=${skip}&limit=${limit}`
    );
    return res.data;
  },

  assign: async (payload: AssignSubscriptionPayload): Promise<void> => {
    await adminClient.post("/admin/subscriptions/assign", {
      ...payload,
      status: payload.status ?? "active",
    });
  },
};
