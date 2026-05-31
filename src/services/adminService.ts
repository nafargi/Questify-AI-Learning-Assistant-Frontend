import { api } from "@/lib/api";
import type { Plan } from "./subscriptionService";

export interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  is_deleted: boolean;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  payment_reference: string;
}

export interface AdminTransaction {
  transaction_id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  status: string;
  provider_trade_no: string;
  provider_reference: string;
  created_at: string;
}

export interface CreatePlanPayload {
  name: string;
  description: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  trial_days: number;
  is_active: boolean;
  features: { feature_key: string; feature_value: Record<string, unknown> }[];
}

export const adminService = {
  // Plan management (super_admin only)
  getPlans: async (): Promise<Plan[]> => {
    const res = await api.get<Plan[]>("/admin/plans");
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  createPlan: async (payload: CreatePlanPayload): Promise<Plan> => {
    const res = await api.post<Plan>("/admin/plans", payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  updatePlan: async (plan_id: string, payload: Partial<CreatePlanPayload>): Promise<Plan> => {
    const res = await api.patch<Plan>(`/admin/plans/${plan_id}`, payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  deletePlan: async (plan_id: string): Promise<void> => {
    const res = await api.delete(`/admin/plans/${plan_id}`);
    if (!res.success) throw new Error(res.message);
  },

  // Subscription management
  assignSubscription: async (user_id: string, plan_id: string, status = "active") => {
    const res = await api.post("/admin/subscriptions/assign", { user_id, plan_id, status });
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  // User management
  getUsers: async (skip = 0, limit = 50): Promise<AdminUser[]> => {
    const res = await api.get<AdminUser[]>(`/admin/users?skip=${skip}&limit=${limit}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  getUser: async (user_id: string): Promise<AdminUser> => {
    const res = await api.get<AdminUser>(`/admin/users/${user_id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  // Read-only subscriptions
  getSubscriptions: async (skip = 0, limit = 50): Promise<AdminSubscription[]> => {
    const res = await api.get<AdminSubscription[]>(`/admin/subscriptions?skip=${skip}&limit=${limit}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  // Read-only transactions
  getTransactions: async (skip = 0, limit = 50): Promise<AdminTransaction[]> => {
    const res = await api.get<AdminTransaction[]>(`/admin/transactions?skip=${skip}&limit=${limit}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  // Role management (super_admin only)
  promoteUser: async (user_id: string, role: "support" | "super_admin" = "support"): Promise<AdminUser> => {
    const res = await api.post<AdminUser>("/admin/promote", { user_id, role });
    if (!res.success) throw new Error(res.message);
    return res.data;
  },
};
