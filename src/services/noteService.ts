import { api } from "@/lib/api";

// method id → API path segment
const METHOD_PATH: Record<string, string> = {
  cornell: "cornell",
  outline: "outline",
  mindmap: "mind-map",
  boxing: "boxing",
  charting: "charting",
  sentence: "sentence",
};

function path(methodId: string): string {
  return METHOD_PATH[methodId] ?? methodId;
}

export const noteService = {
  /** GET /api/notes/{type}/{collection_id} */
  getNotes: async (methodId: string, collectionId: string): Promise<any[]> => {
    const res = await api.get<any[]>(`/notes/${path(methodId)}/${collectionId}`);
    if (!res.success) throw new Error(res.message);
    return res.data ?? [];
  },

  /** POST /api/notes/{type} */
  generateNote: async (methodId: string, collectionId: string): Promise<any> => {
    const res = await api.post<any>(`/notes/${path(methodId)}`, { collection_id: collectionId });
    if (!res.success) throw new Error(res.message);
    return res.data;
  },

  /** DELETE /api/notes/{type}/{note_id} */
  deleteNote: async (methodId: string, noteId: string): Promise<void> => {
    const res = await api.delete(`/notes/${path(methodId)}/${noteId}`);
    if (!res.success) throw new Error(res.message);
  },
};
