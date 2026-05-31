import { QuestifyClient } from '../client/questify.client';
import { SubscriptionContext } from '../context/subscription.context';
import { SubscriptionLimitError, QuestifyErrorCode } from '../client/questify.errors';
import { StudyMethod, AnyStudy } from '../types';

export class StudyService {
  /**
   * Generate a study plan for a collection using the specified method.
   * @throws {SubscriptionLimitError} if the plan doesn't include this study method
   */
  static async generate<T extends AnyStudy>(method: StudyMethod, collectionId: string): Promise<T> {
    this.guardStudyMethod(method);
    return QuestifyClient.post<T>(`/study/${method}/generate`, { collection_id: collectionId });
  }

  /** Get all study plans of a method type for a specific collection. */
  static async getByCollection<T extends AnyStudy>(method: StudyMethod, collectionId: string): Promise<T[]> {
    return QuestifyClient.get<T[]>(`/study/${method}/collection/${collectionId}`);
  }

  private static guardStudyMethod(method: StudyMethod): void {
    const enabled = SubscriptionContext.getEnabledStudyMethods();
    if (enabled.length > 0 && !enabled.includes(method)) {
      throw new SubscriptionLimitError(
        QuestifyErrorCode.SUBSCRIPTION_REQUIRED,
        `Study method "${method}" is not available on your current plan`,
        'local',
        `/study/${method}/generate`
      );
    }
  }
}
