import { QuestifyClient } from '../client/questify.client';
import { NoteMethod, StudyMethod, UsagePlan, Subscription } from '../types';

export class SubscriptionContextClass {
  private activeSubscription: Subscription | null = null;
  private activePlan: UsagePlan | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Default fallback limits if plan cannot be fetched
  private readonly DEFAULT_LIMITS = {
    material_limit: 0,
    file_size_limit_mb: 5,
    ai_requests_per_day: 0,
    exam_generation_enabled: false,
    chat_enabled: false,
    note_methods_enabled: [] as NoteMethod[],
    study_methods_enabled: [] as StudyMethod[],
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('questify:auth:cleared', () => this.clear());
    }
  }

  /**
   * Starts the passive 10-minute refresh interval
   */
  startPassiveRefresh(): void {
    this.stopPassiveRefresh();
    this.refreshInterval = setInterval(() => {
      this.refresh().catch(() => {});
    }, 10 * 60 * 1000); // 10 minutes
  }

  stopPassiveRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Clears context state (e.g., on logout)
   */
  clear(): void {
    this.activeSubscription = null;
    this.activePlan = null;
    this.stopPassiveRefresh();
  }

  /**
   * Refreshes the subscription context by calling the APIs directly
   * using the core client to avoid circular dependencies with services.
   */
  async refresh(): Promise<void> {
    try {
      // 1. Fetch user's subscriptions
      const subscriptions = await QuestifyClient.get<Subscription[]>('/subscriptions/my');
      this.activeSubscription = subscriptions.find(sub => sub.status === 'active') || null;

      // 2. Fetch plans
      if (this.activeSubscription) {
        const plans = await QuestifyClient.get<UsagePlan[]>('/subscriptions/plans', {
          ttlMs: 5 * 60 * 1000, // 5 min cache
        });
        this.activePlan = plans.find(p => p.id === this.activeSubscription?.plan_id) || null;
      } else {
        this.activePlan = null;
      }
    } catch (err) {
      // If we fail to refresh (e.g., network error), we keep the current state.
      console.error('Failed to refresh subscription context', err);
    }
  }

  isActive(): boolean {
    return this.activeSubscription !== null && this.activeSubscription.status === 'active';
  }

  getMaterialLimit(): number {
    return this.activePlan?.features.material_limit ?? this.DEFAULT_LIMITS.material_limit;
  }

  getAiRequestsPerDay(): number {
    return this.activePlan?.features.ai_requests_per_day ?? this.DEFAULT_LIMITS.ai_requests_per_day;
  }

  isExamGenerationEnabled(): boolean {
    return this.activePlan?.features.exam_generation_enabled ?? this.DEFAULT_LIMITS.exam_generation_enabled;
  }

  isChatEnabled(): boolean {
    return this.activePlan?.features.chat_enabled ?? this.DEFAULT_LIMITS.chat_enabled;
  }

  getEnabledNoteMethods(): NoteMethod[] {
    return this.activePlan?.features.note_methods_enabled ?? this.DEFAULT_LIMITS.note_methods_enabled;
  }

  getEnabledStudyMethods(): StudyMethod[] {
    return this.activePlan?.features.study_methods_enabled ?? this.DEFAULT_LIMITS.study_methods_enabled;
  }

  getFileSizeLimit(): number {
    return this.activePlan?.features.file_size_limit_mb ?? this.DEFAULT_LIMITS.file_size_limit_mb;
  }
}

export const SubscriptionContext = new SubscriptionContextClass();
