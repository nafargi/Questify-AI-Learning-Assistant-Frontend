import { UserProfile } from './auth.types';
import { UsagePlan, Subscription, Transaction } from './subscription.types';

export interface Pagination {
  skip?: number;
  limit?: number;
}

export interface AdminUser extends UserProfile {
  is_deleted: boolean;
  updated_at: string;
}

export interface AdminUserDetail extends AdminUser {
  subscriptions: Subscription[];
}

export interface AdminSubscription extends Subscription {
  user_email: string;
}

export interface AdminTransaction extends Transaction {
  user_email: string;
}

export interface CreatePlanPayload {
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: {
    material_limit: number;
    file_size_limit_mb: number;
    ai_requests_per_day: number;
    exam_generation_enabled: boolean;
    chat_enabled: boolean;
    note_methods_enabled: string[];
    study_methods_enabled: string[];
  };
  description?: string;
}

export interface AssignSubscriptionPayload {
  user_id: string;
  plan_id: string;
}

export type UserRole = 'student' | 'support' | 'super_admin';
