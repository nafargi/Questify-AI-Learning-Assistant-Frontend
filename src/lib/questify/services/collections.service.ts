import { QuestifyClient } from '../client/questify.client';
import { Collection } from '../types';

export class CollectionsService {
  /**
   * Note: Collection creation is a side effect of materials.service.ts `preprocessMaterials()`.
   * There is no standalone POST endpoint to create a collection.
   */

  static async listCollections(): Promise<Collection[]> {
    return QuestifyClient.get<Collection[]>('/collections/', {
      ttlMs: 15000, // 15s cache per constraints
    });
  }

  static async getCollection(id: string): Promise<Collection> {
    return QuestifyClient.get<Collection>(`/collections/${id}`);
  }

  static async deleteCollection(id: string): Promise<void> {
    await QuestifyClient.delete(`/collections/${id}`);
  }
}
