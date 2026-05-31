import { api } from "@/lib/api";

export interface Collection {
  collection_id: string;
  user_id: string;
  title: string;
  description: string;
  confidence: number;
  icon?: string;
  created_at: string;
}

export const collectionsService = {
  getCollections: async (): Promise<Collection[]> => {
    const res = await api.get<Collection[]>("/collections/");
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  deleteCollection: async (id: string): Promise<void> => {
    const res = await api.delete(`/collections/${id}`);
    if (!res.success) throw new Error(res.message);
  },
};
