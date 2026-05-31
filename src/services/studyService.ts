import { api } from "@/lib/api";

// GET /api/study/{method}/{collection_id} — returns array, take first item
async function getLatest(path: string, collectionId: string): Promise<any> {
  const res = await api.get<any[]>(`/study/${path}/${collectionId}`);
  if (!res.success) throw new Error(res.message);
  return res.data?.[0] ?? null;
}

async function generate(path: string, collectionId: string): Promise<any> {
  const res = await api.post<any>(`/study/${path}`, { collection_id: collectionId });
  if (!res.success) throw new Error(res.message);
  return res.data;
}

export const studyService = {
  // POST /api/study/pomodoro  |  GET /api/study/pomodoro/{collection_id}
  generatePomodoro: (id: string) => generate("pomodoro", id),
  getPomodoro:      (id: string) => getLatest("pomodoro", id),

  // POST /api/study/feynman   |  GET /api/study/feynman/{collection_id}
  generateFeynman:  (id: string) => generate("feynman", id),
  getFeynman:       (id: string) => getLatest("feynman", id),

  // POST /api/study/leitner   |  GET /api/study/leitner/{collection_id}
  generateLeitner:  (id: string) => generate("leitner", id),
  getLeitner:       (id: string) => getLatest("leitner", id),

  // POST /api/study/sq3r      |  GET /api/study/sq3r/{collection_id}
  generateSQ3R:     (id: string) => generate("sq3r", id),
  getSQ3R:          (id: string) => getLatest("sq3r", id),

  // POST /api/study/active-recall  |  GET /api/study/active-recall/{collection_id}
  generateActiveRecall: (id: string) => generate("active-recall", id),
  getActiveRecall:      (id: string) => getLatest("active-recall", id),
};
