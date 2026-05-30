import { QuestifyClient } from '../client/questify.client';
import { SubscriptionContext } from '../context/subscription.context';
import { SubscriptionLimitError, ValidationError } from '../client/questify.errors';
import { NoteMethod } from '../types';

export class NotesService {
  /**
   * Internal guard to check if a specific note method is enabled on the current plan.
   */
  private static requireMethodEnabled(method: NoteMethod, endpoint: string): void {
    const enabledMethods = SubscriptionContext.getEnabledNoteMethods();
    if (!enabledMethods.includes(method)) {
      throw new SubscriptionLimitError(
        'SUBSCRIPTION_REQUIRED' as any, 
        `Note method '${method}' is not enabled on your current plan.`, 
        'local', 
        endpoint
      );
    }
  }

  /**
   * Generates a new note for a specific collection.
   */
  static async generate<T>(method: NoteMethod, collectionId: string): Promise<T> {
    const endpoint = `/notes/${method}/generate`;
    this.requireMethodEnabled(method, endpoint);

    if (!collectionId) {
      throw new ValidationError('Collection ID is required', 'local', endpoint);
    }

    return QuestifyClient.post<T>(endpoint, { collection_id: collectionId });
  }

  /**
   * Gets all notes of a specific method for a given collection.
   */
  static async getByCollection<T>(method: NoteMethod, collectionId: string): Promise<T[]> {
    if (!collectionId) {
      throw new ValidationError('Collection ID is required', 'local', `/notes/${method}/collection/${collectionId}`);
    }
    return QuestifyClient.get<T[]>(`/notes/${method}/collection/${collectionId}`);
  }

  /**
   * Gets all notes of a specific method.
   */
  static async getAll<T>(method: NoteMethod): Promise<T[]> {
    return QuestifyClient.get<T[]>(`/notes/${method}/`);
  }

  /**
   * Deletes a specific note.
   */
  static async delete(method: NoteMethod, noteId: string): Promise<void> {
    if (!noteId) {
      throw new ValidationError('Note ID is required', 'local', `/notes/${method}/${noteId}`);
    }
    await QuestifyClient.delete(`/notes/${method}/${noteId}`);
  }
}
