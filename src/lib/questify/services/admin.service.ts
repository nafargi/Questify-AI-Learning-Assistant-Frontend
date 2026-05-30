import { QuestifyClient } from '../client/questify.client';
import { ForbiddenError, ValidationError } from '../client/questify.errors';
import { AuthService } from './auth.service';
import {
  AdminUser,
  AdminUserDetail,
  AdminSubscription,
  AdminTransaction,
  Pagination,
  CreatePlanPayload,
  CreatePlanPayloadSchema,
  AssignSubscriptionPayload,
  AssignSubscriptionPayloadSchema,
  UsagePlan,
  Subscription,
  UserProfile,
} from '../types';

export class AdminService {
  /**
   * Internal guard to ensure current user has the minimum required role.
   * Note: In a real app, role is often embedded in the JWT payload to avoid an extra
   * API call. For strictness, if we only have the profile endpoint, we fetch it and cache.
   */
  private static async requireRole(minimum: 'support' | 'super_admin'): Promise<UserProfile> {
    const profile = await AuthService.getProfile(); // cached for 30s
    
    if (minimum === 'super_admin' && profile.role !== 'super_admin') {
      throw new ForbiddenError(
        'FORBIDDEN' as any,
        'Requires super_admin privileges',
        'local',
        'AdminAction'
      );
    }
    
    if (minimum === 'support' && profile.role !== 'support' && profile.role !== 'super_admin') {
      throw new ForbiddenError(
        'FORBIDDEN' as any,
        'Requires at least support privileges',
        'local',
        'AdminAction'
      );
    }

    return profile;
  }

  private static buildPaginationParams(pagination?: Pagination): string {
    if (!pagination) return '';
    const params = new URLSearchParams();
    if (pagination.skip !== undefined) params.append('skip', pagination.skip.toString());
    if (pagination.limit !== undefined) {
      const limit = Math.min(pagination.limit, 200);
      params.append('limit', limit.toString());
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  static async getAllPlans(): Promise<UsagePlan[]> {
    await this.requireRole('support');
    return QuestifyClient.get<UsagePlan[]>('/admin/plans');
  }

  static async createPlan(payload: CreatePlanPayload): Promise<UsagePlan> {
    await this.requireRole('super_admin');
    const validated = CreatePlanPayloadSchema.parse(payload);
    return QuestifyClient.post<UsagePlan>('/admin/plans', validated);
  }

  static async updatePlan(id: string, payload: Partial<CreatePlanPayload>): Promise<UsagePlan> {
    await this.requireRole('super_admin');
    // Note: In strict apps we might partial parse here, assuming full patch is supported
    return QuestifyClient.patch<UsagePlan>(`/admin/plans/${id}`, payload);
  }

  static async deletePlan(id: string): Promise<void> {
    await this.requireRole('super_admin');
    await QuestifyClient.delete(`/admin/plans/${id}`);
  }

  static async assignSubscription(payload: AssignSubscriptionPayload): Promise<Subscription> {
    await this.requireRole('support');
    const validated = AssignSubscriptionPayloadSchema.parse(payload);
    return QuestifyClient.post<Subscription>('/admin/subscriptions/assign', validated);
  }

  static async listUsers(pagination?: Pagination): Promise<AdminUser[]> {
    await this.requireRole('support');
    const qs = this.buildPaginationParams(pagination);
    return QuestifyClient.get<AdminUser[]>(`/admin/users${qs}`);
  }

  static async getUser(id: string): Promise<AdminUserDetail> {
    await this.requireRole('support');
    return QuestifyClient.get<AdminUserDetail>(`/admin/users/${id}`);
  }

  static async listAllSubscriptions(pagination?: Pagination): Promise<AdminSubscription[]> {
    await this.requireRole('support');
    const qs = this.buildPaginationParams(pagination);
    return QuestifyClient.get<AdminSubscription[]>(`/admin/subscriptions${qs}`);
  }

  static async listAllTransactions(pagination?: Pagination): Promise<AdminTransaction[]> {
    await this.requireRole('support');
    const qs = this.buildPaginationParams(pagination);
    return QuestifyClient.get<AdminTransaction[]>(`/admin/transactions${qs}`);
  }

  static async promoteUser(userId: string, role: 'support' | 'super_admin'): Promise<UserProfile> {
    const currentUser = await this.requireRole('super_admin');
    
    if (currentUser.user_id === userId) {
      throw new ValidationError('Cannot promote your own account', 'local', '/admin/promote');
    }

    return QuestifyClient.post<UserProfile>('/admin/promote', { user_id: userId, role });
  }
}
