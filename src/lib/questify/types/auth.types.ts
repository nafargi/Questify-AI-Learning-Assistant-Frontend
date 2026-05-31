import { z } from 'zod';

export const RegisterPayloadSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;

export const LoginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

export interface VerifyPayload { email: string; otp: string; }
export interface ResetPasswordPayload { email: string; otp: string; new_password: string; }
export interface ChangePasswordPayload { old_password: string; new_password: string; }
export interface UpdateProfilePayload { full_name?: string; }

export interface AuthUser {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export type FullUserProfile = UserProfile & {
  subscription_status: string | null;
  plan_name: string | null;
};
