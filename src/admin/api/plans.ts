import { adminClient } from "./client";

export interface PlanFeature {
  feature_id?: string;
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
  created_at?: string;
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

export const plansApi = {
  list: async (): Promise<Plan[]> => {
    const res = await adminClient.get<Plan[]>("/admin/plans");
    return res.data;
  },

  create: async (payload: CreatePlanPayload): Promise<Plan> => {
    const res = await adminClient.post<Plan>("/admin/plans", payload);
    return res.data;
  },

  update: async (plan_id: string, payload: Partial<CreatePlanPayload>): Promise<Plan> => {
    const res = await adminClient.patch<Plan>(`/admin/plans/${plan_id}`, payload);
    return res.data;
  },

  delete: async (plan_id: string): Promise<void> => {
    await adminClient.delete(`/admin/plans/${plan_id}`);
  },
};
