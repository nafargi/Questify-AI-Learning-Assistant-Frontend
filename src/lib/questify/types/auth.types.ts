import { z } from 'zod';

export const RegisterPayloadSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
});
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;

export const VerifyPayloadSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/, 'OTP must contain only digits'),
});
export type VerifyPayload = z.infer<typeof VerifyPayloadSchema>;

export const LoginPayloadSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

export const ResetPasswordPayloadSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().length(6).regex(/^\d+$/),
  new_password: z.string().min(8),
});
export type ResetPasswordPayload = z.infer<typeof ResetPasswordPayloadSchema>;

export const ChangePasswordPayloadSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayloadSchema>;

export const UpdateProfilePayloadSchema = z.object({
  name: z.string().trim().min(1).optional(),
});
export type UpdateProfilePayload = z.infer<typeof UpdateProfilePayloadSchema>;

export interface UserProfile {
  user_id: string;
  email: string;
  name: string;
  role: 'user' | 'support' | 'super_admin';
  avatar_url?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface AuthUser {
  user: UserProfile;
  access_token: string;
}

export interface FullUserProfile extends UserProfile {
  last_login?: string;
  // Other extended profile details can be added here
}
