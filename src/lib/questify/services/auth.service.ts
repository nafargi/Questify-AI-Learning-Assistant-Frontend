import { QuestifyClient, BASE_URL } from '../client/questify.client';
import { tokenManager } from '../client/questify.auth-store';
import { ValidationError } from '../client/questify.errors';
import { SubscriptionContext } from '../context/subscription.context';
import {
  RegisterPayload, RegisterPayloadSchema,
  LoginPayload, LoginPayloadSchema,
  VerifyPayload, ResetPasswordPayload,
  ChangePasswordPayload, UpdateProfilePayload,
  AuthUser, UserProfile, FullUserProfile
} from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export class AuthService {
  /**
   * Register a new user account.
   * @throws {ValidationError} if payload is invalid
   * @throws {ConflictError} if email already exists
   */
  static async register(payload: RegisterPayload): Promise<void> {
    const validated = RegisterPayloadSchema.parse(payload);
    validated.email = validated.email.trim().toLowerCase();
    await QuestifyClient.post('/auth/register', validated);
  }

  /**
   * Verify email with 6-digit OTP.
   * @throws {ValidationError} if OTP is not 6 digits
   */
  static async verifyEmail(payload: VerifyPayload): Promise<void> {
    const otp = payload.otp.replace(/\D/g, '');
    if (otp.length !== 6) throw new ValidationError('OTP must be exactly 6 digits', 'local', '/auth/verify');
    await QuestifyClient.post('/auth/verify', { email: payload.email.trim().toLowerCase(), otp });
  }

  /** Resend OTP to email. */
  static async resendOtp(email: string): Promise<void> {
    await QuestifyClient.post('/auth/resend-otp', { email: email.trim().toLowerCase() });
  }

  /**
   * Login and store token in memory.
   * @returns AuthUser with access_token
   */
  static async login(payload: LoginPayload): Promise<AuthUser> {
    const validated = LoginPayloadSchema.parse(payload);
    validated.email = validated.email.trim().toLowerCase();
    const data = await QuestifyClient.post<AuthUser>('/auth/login', validated);
    tokenManager.setToken(data.access_token);
    SubscriptionContext.refresh().catch(() => {});
    SubscriptionContext.startAutoRefresh();
    return data;
  }

  /** Send password reset OTP to email. */
  static async forgotPassword(email: string): Promise<void> {
    await QuestifyClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
  }

  /** Reset password with OTP received by email. */
  static async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    if (payload.new_password.length < 8) throw new ValidationError('Password must be at least 8 characters', 'local', '/auth/reset-password');
    const otp = payload.otp.replace(/\D/g, '');
    if (otp.length !== 6) throw new ValidationError('OTP must be exactly 6 digits', 'local', '/auth/reset-password');
    await QuestifyClient.post('/auth/reset-password', { ...payload, otp });
  }

  /** Change password while authenticated. */
  static async changePassword(payload: ChangePasswordPayload): Promise<void> {
    if (payload.new_password.length < 8) throw new ValidationError('New password must be at least 8 characters', 'local', '/auth/user/password');
    await QuestifyClient.patch('/auth/user/password', payload);
  }

  /** Get own profile. Cached for 30s. */
  static async getProfile(): Promise<UserProfile> {
    return QuestifyClient.get<UserProfile>('/auth/user/profile', { ttlMs: 30000 });
  }

  /** Get full profile including subscription info. */
  static async getFullProfile(): Promise<FullUserProfile> {
    return QuestifyClient.get<FullUserProfile>('/auth/user/profile/full');
  }

  /** Update display name. */
  static async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    return QuestifyClient.patch<UserProfile>('/auth/user/profile', payload);
  }

  /**
   * Returns the streaming URL for the current user's avatar.
   * Does NOT fetch the binary — use as <img src={...} />
   */
  static getAvatarUrl(): string {
    return `${BASE_URL}/auth/user/avatar`;
  }

  /**
   * Upload a new avatar image.
   * Client-side validation: JPEG/PNG/WebP only, max 5MB.
   * @throws {ValidationError} if file type or size is invalid
   */
  static async uploadAvatar(file: File): Promise<UserProfile> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      throw new ValidationError('Only JPEG, PNG, and WebP images are allowed', 'local', '/auth/user/profile/avatar');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ValidationError('Avatar must be smaller than 5MB', 'local', '/auth/user/profile/avatar');
    }
    const formData = new FormData();
    formData.append('avatar', file);
    return QuestifyClient.put<UserProfile>('/auth/user/profile/avatar', formData);
  }

  /** Remove current avatar. */
  static async removeAvatar(): Promise<UserProfile> {
    return QuestifyClient.delete<UserProfile>('/auth/user/profile/avatar');
  }

  /**
   * Delete the user's account and clear token.
   */
  static async deleteAccount(): Promise<void> {
    await QuestifyClient.delete('/auth/user');
    tokenManager.clearToken();
    SubscriptionContext.clear();
  }
}
