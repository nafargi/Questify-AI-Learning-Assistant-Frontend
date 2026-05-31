import { QuestifyClient } from '../client/questify.client';
import { TimeoutError } from '../client/questify.errors';
import { UsagePlan, Subscription, PaymentInitiation, Transaction } from '../types';
import { SubscriptionContext } from '../context/subscription.context';

export class SubscriptionsService {
  /**
   * Get all available plans. Cached for 5 minutes. No auth required.
   */
  static async getPlans(): Promise<UsagePlan[]> {
    return QuestifyClient.get<UsagePlan[]>('/subscriptions/plans', {
      ttlMs: 5 * 60 * 1000,
    });
  }

  /** Get all subscriptions for the current user. */
  static async getMySubscriptions(): Promise<Subscription[]> {
    return QuestifyClient.get<Subscription[]>('/subscriptions/my');
  }

  /** Returns the first active subscription or null. */
  static async getActiveSubscription(): Promise<Subscription | null> {
    const subscriptions = await this.getMySubscriptions();
    return subscriptions.find(sub => sub.status === 'active') ?? null;
  }

  /**
   * Initiate a payment for a plan.
   * Returns pay_url — the consumer decides how to open it (redirect, popup, etc.)
   */
  static async initiatePayment(planId: string): Promise<PaymentInitiation> {
    return QuestifyClient.post<PaymentInitiation>('/payments/initiate', { plan_id: planId });
  }

  /** Get payment transaction history. */
  static async getPaymentHistory(): Promise<Transaction[]> {
    return QuestifyClient.get<Transaction[]>('/payments/history');
  }

  /**
   * Poll until an active subscription appears (e.g. after payment redirect).
   * @throws {TimeoutError} if no active subscription found within timeoutMs
   */
  static async pollForActiveSubscription(
    options: { intervalMs?: number; timeoutMs?: number; onStatusCheck?: (status: string | null) => void } = {}
  ): Promise<Subscription> {
    const intervalMs = options.intervalMs ?? 3000;
    const timeoutMs = options.timeoutMs ?? 300000;
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeoutMs) {
        throw new TimeoutError('Polling timed out waiting for active subscription', '/subscriptions/my');
      }

      const subscriptions = await QuestifyClient.get<Subscription[]>('/subscriptions/my', { skipCache: true });
      const active = subscriptions.find(sub => sub.status === 'active');

      if (options.onStatusCheck) options.onStatusCheck(active ? active.status : null);

      if (active) {
        SubscriptionContext.refresh().catch(() => {});
        return active;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}
