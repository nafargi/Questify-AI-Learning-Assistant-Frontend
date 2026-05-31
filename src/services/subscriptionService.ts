import { api } from "@/lib/api";

export interface PlanFeature {
  feature_id: string;
  feature_key: string;
  feature_value: Record<string, unknown>;
}

export interface Plan {
  plan_id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  trial_days: number;
  is_active: boolean;
  features: PlanFeature[];
  created_at: string;
}

export interface Subscription {
  subscription_id: string;
  plan_id: string;
  status: "active" | "expired" | "cancelled" | "pending";
  started_at: string;
  expires_at: string;
}

export const subscriptionService = {
  getPlans: async (): Promise<Plan[]> => {
    const res = await api.get<Plan[]>("/subscriptions/plans");
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  getMySubscriptions: async (): Promise<Subscription[]> => {
    const res = await api.get<Subscription[]>("/subscriptions/my");
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  getActiveSubscription: async (): Promise<Subscription | null> => {
    const res = await api.get<Subscription[]>("/subscriptions/my");
    if (!res.success) return null;
    return res.data.find((s) => s.status === "active") ?? null;
  },
};
