import apiClient from './apiClient';
import { collectionsService, Collection } from './collectionsService';

// Re-export Collection so consumers can import from a single place
export type { Collection };

// ─── Response Shapes ─────────────────────────────────────────────────────────

export interface PomodoroSession {
  session_number: number;
  task: string;
  duration_minutes: number;
  break_minutes: number;
}

export interface PomodoroData {
  id?: string;
  collection_id?: string;
  title?: string;
  sessions?: PomodoroSession[];
  created_at?: string;
  [key: string]: any;
}

export interface FeynmanData {
  id?: string;
  collection_id?: string;
  concept?: string;
  simple_explanation?: string;
  key_points?: string[];
  knowledge_gaps?: string[];
  created_at?: string;
  [key: string]: any;
}

export interface LeitnerCard {
  question: string;
  answer: string;
  [key: string]: any;
}

export interface LeitnerBox {
  box_number: number;
  cards: LeitnerCard[];
  [key: string]: any;
}

export interface LeitnerData {
  id?: string;
  title?: string;
  boxes?: LeitnerBox[];
  [key: string]: any;
}

export interface SQ3RSurvey {
  headings: string[];
  key_terms: string[];
}

export interface SQ3RData {
  id?: string;
  survey?: SQ3RSurvey;
  questions?: string[];
  recite_points?: string[];
  review_summary?: string;
  [key: string]: any;
}

export interface ActiveRecallPrompt {
  question: string;
  hint?: string;
}

export interface ActiveRecallData {
  id?: string;
  topic?: string;
  prompts?: ActiveRecallPrompt[];
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const unwrap = (response: any): any =>
  response.data?.data ?? response.data;

const post = async (url: string, payload: object): Promise<any> => {
  console.group(`[studyService POST] ${url}`);
  console.log('Payload:', payload);
  console.groupEnd();
  try {
    const res = await apiClient.post(url, payload);
    const data = unwrap(res);
    console.log(`[studyService POST SUCCESS] ${url}`, data);
    return data;
  } catch (error: any) {
    console.error(`[studyService POST ERROR] ${url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

const get = async (url: string): Promise<any> => {
  console.log(`[studyService GET] ${url}`);
  try {
    const res = await apiClient.get(url);
    const data = unwrap(res);
    console.log(`[studyService GET SUCCESS] ${url}`, data);
    return data;
  } catch (error: any) {
    console.error(`[studyService GET ERROR] ${url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const studyService = {
  // Collections
  getCollections: (): Promise<Collection[]> =>
    collectionsService.getCollections(),

  // ── Helper: GET endpoints return arrays; unwrap to the first (most recent) item
  _unwrapArray: (data: any): any => {
    if (Array.isArray(data)) return data[0] ?? null;
    return data ?? null;
  },

  // Pomodoro
  generatePomodoro: (collectionId: string): Promise<PomodoroData> =>
    post('/api/study/pomodoro', { collection_id: collectionId }),

  getPomodoro: (collectionId: string): Promise<PomodoroData> =>
    get(`/api/study/pomodoro/${collectionId}`).then(d => Array.isArray(d) ? d[0] ?? null : d),

  // Feynman
  generateFeynman: (collectionId: string): Promise<FeynmanData> =>
    post('/api/study/feynman', { collection_id: collectionId }),

  getFeynman: (collectionId: string): Promise<FeynmanData> =>
    get(`/api/study/feynman/${collectionId}`).then(d => Array.isArray(d) ? d[0] ?? null : d),

  // Leitner
  generateLeitner: (collectionId: string): Promise<LeitnerData> =>
    post('/api/study/leitner', { collection_id: collectionId }),

  getLeitner: (collectionId: string): Promise<LeitnerData> =>
    get(`/api/study/leitner/${collectionId}`).then(d => Array.isArray(d) ? d[0] ?? null : d),

  // SQ3R
  generateSQ3R: (collectionId: string): Promise<SQ3RData> =>
    post('/api/study/sq3r', { collection_id: collectionId }),

  getSQ3R: (collectionId: string): Promise<SQ3RData> =>
    get(`/api/study/sq3r/${collectionId}`).then(d => Array.isArray(d) ? d[0] ?? null : d),

  // Active Recall
  generateActiveRecall: (collectionId: string): Promise<ActiveRecallData> =>
    post('/api/study/active-recall', { collection_id: collectionId }),

  getActiveRecall: (collectionId: string): Promise<ActiveRecallData> =>
    get(`/api/study/active-recall/${collectionId}`).then(d => Array.isArray(d) ? d[0] ?? null : d),

  // ── Generic helpers kept for backward-compat with method components ──────
  /** @deprecated Use the named generate* / get* methods instead. */
  generateSession: (method: string, collectionId: string): Promise<any> => {
    const slug = method.toLowerCase().replace('_', '-');
    return post(`/api/study/${slug}`, { collection_id: collectionId });
  },

  /** @deprecated Use the named generate* / get* methods instead. */
  getSession: (method: string, collectionId: string): Promise<any> => {
    const slug = method.toLowerCase().replace('_', '-');
    return get(`/api/study/${slug}/${collectionId}`);
  },
};
