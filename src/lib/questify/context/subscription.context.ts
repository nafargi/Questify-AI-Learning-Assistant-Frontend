import { QuestifyClient } from '../client/questify.client';
import { Subscription, UsagePlan } from '../types';
import type { NoteMethod } from '../types/note.types';
import type { StudyMethod } from '../types/study.types';

interface SubscriptionState {
  subscription: Subscription | null;
  plan: UsagePlan | null;
  lastRefreshedAt: number;
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

class SubscriptionContextClass {
  private state: SubscriptionState = { subscription: null, plan: null, lastRefreshedAt: 0 };
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  isActive(): boolean { return this.state.subscription?.status === 'active'; }
  getMaterialLimit(): number { return this.state.plan?.features.material_limit ?? 5; }
  getAiRequestsPerDay(): number { return this.state.plan?.features.ai_requests_per_day ?? 10; }
  isExamGenerationEnabled(): boolean { return this.state.plan?.features.exam_generation_enabled ?? false; }
  isChatEnabled(): boolean { return this.state.plan?.features.chat_enabled ?? false; }
  getEnabledNoteMethods(): NoteMethod[] { return this.state.plan?.features.note_methods_enabled ?? []; }
  getEnabledStudyMethods(): StudyMethod[] { return this.state.plan?.features.study_methods_enabled ?? []; }
  getFileSizeLimit(): number { return this.state.plan?.features.file_size_limit_mb ?? 10; }

  async refresh(): Promise<void> {
    try {
      const [subscriptions, plans] = await Promise.all([
        QuestifyClient.get<Subscription[]>('/subscriptions/my', { skipCache: true }),
        QuestifyClient.get<UsagePlan[]>('/subscriptions/plans', { ttlMs: 5 * 60 * 1000 }),
      ]);
      const active = subscriptions.find(s => s.status === 'active') ?? null;
      const plan = active ? plans.find(p => p.id === active.plan_id) ?? null : null;
      this.state = { subscription: active, plan, lastRefreshedAt: Date.now() };
    } catch {
      // silent fail — keep stale state
    }
  }

  startAutoRefresh(): void {
    if (this.refreshTimer) return;
    this.refreshTimer = setInterval(() => { this.refresh().catch(() => {}); }, REFRESH_INTERVAL_MS);
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
  }

  clear(): void {
    this.state = { subscription: null, plan: null, lastRefreshedAt: 0 };
    this.stopAutoRefresh();
  }
}

export const SubscriptionContext = new SubscriptionContextClass();
