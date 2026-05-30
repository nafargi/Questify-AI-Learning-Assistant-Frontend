import { QuestifyClient } from '../client/questify.client';
import { TimeoutError } from '../client/questify.errors';
import { UsagePlan, Subscription, PaymentInitiation, Transaction } from '../types';
import { SubscriptionContext } from '../context/subscription.context';

export class SubscriptionsService {
  static async getPlans(): Promise<UsagePlan[]> {
    return QuestifyClient.get<UsagePlan[]>('/subscriptions/plans', {
      ttlMs: 5 * 60 * 1000, // 5 minutes cache
    });
  }

  static async getMySubscriptions(): Promise<Subscription[]> {
    return QuestifyClient.get<Subscription[]>('/subscriptions/my');
  }

  static async getActiveSubscription(): Promise<Subscription | null> {
    const subscriptions = await this.getMySubscriptions();
    return subscriptions.find(sub => sub.status === 'active') || null;
  }

  static async initiatePayment(planId: string): Promise<PaymentInitiation> {
    return QuestifyClient.post<PaymentInitiation>('/payments/initiate', { plan_id: planId });
  }

  static async getPaymentHistory(): Promise<Transaction[]> {
    return QuestifyClient.get<Transaction[]>('/payments/history');
  }

  static async pollForActiveSubscription(
    options: { intervalMs?: number; timeoutMs?: number; onStatusCheck?: (status: string | null) => void } = {}
  ): Promise<Subscription> {
    const intervalMs = options.intervalMs || 3000;
    const timeoutMs = options.timeoutMs || 300000; // 5 mins
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeoutMs) {
        throw new TimeoutError('Polling timed out waiting for active subscription', '/subscriptions/my');
      }

      // We explicitly bypass cache here so we get fresh data
      const subscriptions = await QuestifyClient.get<Subscription[]>('/subscriptions/my', { skipCache: true });
      const active = subscriptions.find(sub => sub.status === 'active');
      
      if (options.onStatusCheck) {
        options.onStatusCheck(active ? active.status : null);
      }

      if (active) {
        // Refresh the context passively now that we have an active sub
        SubscriptionContext.refresh().catch(() => {});
        return active;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}
