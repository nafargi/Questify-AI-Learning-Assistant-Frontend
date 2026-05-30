import { NoteMethod } from './note.types';
import { StudyMethod } from './study.types';

export interface UsagePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: {
    material_limit: number;
    file_size_limit_mb: number;
    ai_requests_per_day: number;
    exam_generation_enabled: boolean;
    chat_enabled: boolean;
    note_methods_enabled: NoteMethod[];
    study_methods_enabled: StudyMethod[];
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface PaymentInitiation {
  pay_url: string;
  transaction_id: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}
