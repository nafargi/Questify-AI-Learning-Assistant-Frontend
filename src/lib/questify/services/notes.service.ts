import { QuestifyClient } from '../client/questify.client';
import { SubscriptionContext } from '../context/subscription.context';
import { SubscriptionLimitError } from '../client/questify.errors';
import { QuestifyErrorCode } from '../client/questify.errors';
import { NoteMethod, AnyNote } from '../types';

export class NotesService {
  /**
   * Generate notes for a collection using the specified method.
   * @throws {SubscriptionLimitError} if the plan doesn't include this note method
   */
  static async generate<T extends AnyNote>(method: NoteMethod, collectionId: string): Promise<T> {
    this.guardNoteMethod(method);
    return QuestifyClient.post<T>(`/notes/${method}/generate`, { collection_id: collectionId });
  }

  /** Get all notes of a method type for a specific collection. */
  static async getByCollection<T extends AnyNote>(method: NoteMethod, collectionId: string): Promise<T[]> {
    return QuestifyClient.get<T[]>(`/notes/${method}/collection/${collectionId}`);
  }

  /** Get all notes of a method type across all collections. */
  static async getAll<T extends AnyNote>(method: NoteMethod): Promise<T[]> {
    return QuestifyClient.get<T[]>(`/notes/${method}`);
  }

  /** Delete a specific note. */
  static async delete(method: NoteMethod, noteId: string): Promise<void> {
    await QuestifyClient.delete(`/notes/${method}/${noteId}`);
  }

  private static guardNoteMethod(method: NoteMethod): void {
    const enabled = SubscriptionContext.getEnabledNoteMethods();
    if (enabled.length > 0 && !enabled.includes(method)) {
      throw new SubscriptionLimitError(
        QuestifyErrorCode.SUBSCRIPTION_REQUIRED,
        `Note method "${method}" is not available on your current plan`,
        'local',
        `/notes/${method}/generate`
      );
    }
  }
}
