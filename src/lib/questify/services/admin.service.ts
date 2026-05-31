import { QuestifyClient } from '../client/questify.client';
import { ValidationError, ForbiddenError, QuestifyErrorCode } from '../client/questify.errors';
import { tokenManager } from '../client/questify.auth-store';
import { AuthService } from './auth.service';
import {
  UsagePlan, AdminUser, AdminUserDetail, AdminSubscription, AdminTransaction,
  Subscription, Pagination, CreatePlanPayload, AssignSubscriptionPayload, UserRole
} from '../types';

type MinRole = 'support' | 'super_admin';
const ROLE_HIERARCHY: Record<string, number> = { student: 0, support: 1, super_admin: 2 };

let _currentUserRole: string | null = null;

async function requireRole(minimum: MinRole): Promise<void> {
  if (!_currentUserRole) {
    try {
      const profile = await AuthService.getProfile();
      _currentUserRole = profile.role;
    } catch {
      throw new ForbiddenError(QuestifyErrorCode.FORBIDDEN, 'Cannot verify user role', 'local', '/admin');
    }
  }
  const userLevel = ROLE_HIERARCHY[_currentUserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimum] ?? 99;
  if (userLevel < requiredLevel) {
    throw new ForbiddenError(QuestifyErrorCode.FORBIDDEN, `This action requires the "${minimum}" role`, 'local', '/admin');
  }
}

export class AdminService {
  /** Call after login to cache the current user's role. */
  static setCurrentUserRole(role: string): void { _currentUserRole = role; }
  static clearCurrentUserRole(): void { _currentUserRole = null; }

  // ─── Plans ─────────────────────────────────────────────────────────────────

  static async getAllPlans(): Promise<UsagePlan[]> {
    await requireRole('support');
    return QuestifyClient.get<UsagePlan[]>('/admin/plans');
  }

  static async createPlan(payload: CreatePlanPayload): Promise<UsagePlan> {
    await requireRole('super_admin');
    return QuestifyClient.post<UsagePlan>('/admin/plans', payload);
  }

  static async updatePlan(id: string, payload: Partial<CreatePlanPayload>): Promise<UsagePlan> {
    await requireRole('super_admin');
    return QuestifyClient.patch<UsagePlan>(`/admin/plans/${id}`, payload);
  }

  static async deletePlan(id: string): Promise<void> {
    await requireRole('super_admin');
    await QuestifyClient.delete(`/admin/plans/${id}`);
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  static async assignSubscription(payload: AssignSubscriptionPayload): Promise<Subscription> {
    await requireRole('support');
    return QuestifyClient.post<Subscription>('/admin/subscriptions/assign', payload);
  }

  static async listAllSubscriptions(pagination?: Pagination): Promise<AdminSubscription[]> {
    await requireRole('support');
    const params = new URLSearchParams();
    if (pagination?.skip !== undefined) params.set('skip', String(pagination.skip));
    if (pagination?.limit !== undefined) params.set('limit', String(Math.min(pagination.limit, 200)));
    const query = params.toString() ? `?${params}` : '';
    return QuestifyClient.get<AdminSubscription[]>(`/admin/subscriptions${query}`);
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  static async listUsers(pagination?: Pagination): Promise<AdminUser[]> {
    await requireRole('support');
    const params = new URLSearchParams();
    if (pagination?.skip !== undefined) params.set('skip', String(pagination.skip));
    if (pagination?.limit !== undefined) params.set('limit', String(Math.min(pagination.limit, 200)));
    const query = params.toString() ? `?${params}` : '';
    return QuestifyClient.get<AdminUser[]>(`/admin/users${query}`);
  }

  static async getUser(id: string): Promise<AdminUserDetail> {
    await requireRole('support');
    return QuestifyClient.get<AdminUserDetail>(`/admin/users/${id}`);
  }

  // ─── Transactions ───────────────────────────────────────────────────────────

  static async listAllTransactions(pagination?: Pagination): Promise<AdminTransaction[]> {
    await requireRole('support');
    const params = new URLSearchParams();
    if (pagination?.skip !== undefined) params.set('skip', String(pagination.skip));
    if (pagination?.limit !== undefined) params.set('limit', String(Math.min(pagination.limit, 200)));
    const query = params.toString() ? `?${params}` : '';
    return QuestifyClient.get<AdminTransaction[]>(`/admin/transactions${query}`);
  }

  // ─── Promote ────────────────────────────────────────────────────────────────

  /**
   * Promote a user's role.
   * @throws {ValidationError} if attempting to promote own account
   */
  static async promoteUser(userId: string, role: UserRole): Promise<AdminUser> {
    await requireRole('super_admin');
    // Check we're not self-promoting
    try {
      const profile = await AuthService.getProfile();
      if (profile.user_id === userId) {
        throw new ValidationError('Cannot promote your own account', 'local', '/admin/promote');
      }
    } catch (e) {
      if (e instanceof ValidationError) throw e;
    }
    return QuestifyClient.post<AdminUser>('/admin/promote', { user_id: userId, role });
  }
}
