import { QuestifyClient } from '../client/questify.client';
import { tokenManager } from '../client/questify.auth-store';
import { ValidationError } from '../client/questify.errors';
import {
  RegisterPayload,
  RegisterPayloadSchema,
  VerifyPayload,
  VerifyPayloadSchema,
  LoginPayload,
  LoginPayloadSchema,
  ResetPasswordPayload,
  ResetPasswordPayloadSchema,
  ChangePasswordPayload,
  ChangePasswordPayloadSchema,
  UpdateProfilePayload,
  UpdateProfilePayloadSchema,
  UserProfile,
  FullUserProfile,
  AuthUser,
} from '../types';

export class AuthService {
  /**
   * Helper to strip non-digit characters from OTP
   */
  private static sanitizeOtp(otp: string): string {
    return otp.replace(/\D/g, '');
  }

  static async register(payload: RegisterPayload): Promise<void> {
    const validated = RegisterPayloadSchema.parse(payload);
    await QuestifyClient.post('/auth/register', validated);
  }

  static async verifyEmail(payload: VerifyPayload): Promise<void> {
    const otp = this.sanitizeOtp(payload.otp);
    if (otp.length !== 6) {
      throw new ValidationError('OTP must be exactly 6 digits', 'local', '/auth/verify');
    }
    const validated = VerifyPayloadSchema.parse({ ...payload, otp });
    await QuestifyClient.post('/auth/verify', validated);
  }

  static async resendOtp(email: string): Promise<void> {
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail) {
      throw new ValidationError('Email is required', 'local', '/auth/resend-otp');
    }
    await QuestifyClient.post('/auth/resend-otp', { email: sanitizedEmail });
  }

  static async login(payload: LoginPayload): Promise<AuthUser> {
    const validated = LoginPayloadSchema.parse(payload);
    const data = await QuestifyClient.post<AuthUser>('/auth/login', validated);
    if (data.access_token) {
      tokenManager.setToken(data.access_token);
    }
    return data;
  }

  static async forgotPassword(email: string): Promise<void> {
    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail) {
      throw new ValidationError('Email is required', 'local', '/auth/forgot-password');
    }
    await QuestifyClient.post('/auth/forgot-password', { email: sanitizedEmail });
  }

  static async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    const otp = this.sanitizeOtp(payload.otp);
    if (otp.length !== 6) {
      throw new ValidationError('OTP must be exactly 6 digits', 'local', '/auth/reset-password');
    }
    const validated = ResetPasswordPayloadSchema.parse({ ...payload, otp });
    await QuestifyClient.post('/auth/reset-password', validated);
  }

  static async changePassword(payload: ChangePasswordPayload): Promise<void> {
    const validated = ChangePasswordPayloadSchema.parse(payload);
    await QuestifyClient.patch('/auth/user/password', validated);
  }

  static async getProfile(): Promise<UserProfile> {
    return QuestifyClient.get<UserProfile>('/auth/user/profile', {
      ttlMs: 30000, // 30 seconds cache
    });
  }

  static async getFullProfile(): Promise<FullUserProfile> {
    return QuestifyClient.get<FullUserProfile>('/auth/user/profile/full');
  }

  static async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const validated = UpdateProfilePayloadSchema.parse(payload);
    return QuestifyClient.patch<UserProfile>('/auth/user/profile', validated);
  }

  static getAvatarUrl(): string {
    // Return streaming URL; assume client handles auth if required via cookie 
    // or we might need to fetch it as blob if strict Bearer is needed.
    // The prompt says "returns the streaming URL, not the binary"
    return `https://questiai-43b71abdd48b.herokuapp.com/api/auth/user/avatar`;
  }

  static async uploadAvatar(file: File): Promise<AuthUser> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Invalid file type. Allowed: jpeg, png, webp', 'local', '/auth/user/profile/avatar');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ValidationError('File size exceeds 5MB limit', 'local', '/auth/user/profile/avatar');
    }

    // In a real app we might also check magic bytes here using FileReader

    const formData = new FormData();
    formData.append('file', file);

    const data = await QuestifyClient.put<AuthUser>('/auth/user/profile/avatar', formData);
    return data;
  }

  static async removeAvatar(): Promise<AuthUser> {
    return QuestifyClient.delete<AuthUser>('/auth/user/profile/avatar');
  }

  static async deleteAccount(): Promise<void> {
    await QuestifyClient.delete('/auth/user');
    tokenManager.clearToken();
  }
}
