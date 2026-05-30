import { QuestifyClient } from '../client/questify.client';
import { SubscriptionContext } from '../context/subscription.context';
import { SubscriptionLimitError, ValidationError } from '../client/questify.errors';
import { StudyMethod } from '../types';

export class StudyService {
  /**
   * Internal guard to check if a specific study method is enabled on the current plan.
   */
  private static requireMethodEnabled(method: StudyMethod, endpoint: string): void {
    const enabledMethods = SubscriptionContext.getEnabledStudyMethods();
    if (!enabledMethods.includes(method)) {
      throw new SubscriptionLimitError(
        'SUBSCRIPTION_REQUIRED' as any,
        `Study method '${method}' is not enabled on your current plan.`,
        'local',
        endpoint
      );
    }
  }

  /**
   * Generates a new study session for a specific collection.
   */
  static async generate<T>(method: StudyMethod, collectionId: string): Promise<T> {
    const endpoint = `/study/${method}/generate`;
    this.requireMethodEnabled(method, endpoint);

    if (!collectionId) {
      throw new ValidationError('Collection ID is required', 'local', endpoint);
    }

    return QuestifyClient.post<T>(endpoint, { collection_id: collectionId });
  }

  /**
   * Gets all study sessions of a specific method for a given collection.
   */
  static async getByCollection<T>(method: StudyMethod, collectionId: string): Promise<T[]> {
    if (!collectionId) {
      throw new ValidationError('Collection ID is required', 'local', `/study/${method}/collection/${collectionId}`);
    }
    return QuestifyClient.get<T[]>(`/study/${method}/collection/${collectionId}`);
  }
}
