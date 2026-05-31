import { NoteMethod } from './note.types';
import { StudyMethod } from './study.types';

export interface UsagePlanFeatures {
  material_limit: number;
  file_size_limit_mb: number;
  ai_requests_per_day: number;
  exam_generation_enabled: boolean;
  chat_enabled: boolean;
  note_methods_enabled: NoteMethod[];
  study_methods_enabled: StudyMethod[];
}

export interface UsagePlan {
  plan_id: string;
  id: string; // alias for compatibility
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: UsagePlanFeatures;
  description?: string;
}

export interface Subscription {
  subscription_id: string;
  id: string; // alias
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  start_date: string;
  end_date: string;
  plan?: UsagePlan;
}

export interface PaymentInitiation {
  pay_url: string;
  transaction_id: string;
  checkout_url?: string;
}

export interface Transaction {
  transaction_id: string;
  id: string;
  user_id: string;
  subscription_id?: string;
  plan_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  created_at: string;
}
