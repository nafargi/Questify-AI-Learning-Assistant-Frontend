import { QuestifyClient } from '../client/questify.client';
import { Collection } from '../types';

/**
 * Collections are created as a side-effect of MaterialsService.preprocessMaterials().
 * There is no standalone POST /collections endpoint.
 */
export class CollectionsService {
  /** List all collections for the current user. Cached for 15s. */
  static async listCollections(): Promise<Collection[]> {
    return QuestifyClient.get<Collection[]>('/collections/', { ttlMs: 15000 });
  }

  /** Get a single collection by ID. */
  static async getCollection(id: string): Promise<Collection> {
    return QuestifyClient.get<Collection>(`/collections/${id}`);
  }

  /** Delete a collection by ID. */
  static async deleteCollection(id: string): Promise<void> {
    await QuestifyClient.delete(`/collections/${id}`);
  }
}
