import { z } from 'zod';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'support' | 'super_admin';
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  active_subscription_id?: string;
  total_spent: number;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  created_at: string;
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Pagination {
  skip?: number;
  limit?: number;
}

export const CreatePlanPayloadSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  currency: z.string().length(3).toUpperCase(),
  features: z.object({
    material_limit: z.number().int().min(0),
    file_size_limit_mb: z.number().int().min(1),
    ai_requests_per_day: z.number().int().min(0),
    exam_generation_enabled: z.boolean(),
    chat_enabled: z.boolean(),
    note_methods_enabled: z.array(z.string()),
    study_methods_enabled: z.array(z.string()),
  }),
});
export type CreatePlanPayload = z.infer<typeof CreatePlanPayloadSchema>;

export const AssignSubscriptionPayloadSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.string(),
  duration_days: z.number().int().min(1),
});
export type AssignSubscriptionPayload = z.infer<typeof AssignSubscriptionPayloadSchema>;
