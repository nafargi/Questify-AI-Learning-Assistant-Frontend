import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export interface ExamRequest {
  collection_id: string;
  chapter_ids: string[];
  question_count?: number;
  difficulty: DifficultyLevel;
  question_types: string[];
}

export interface MCQContent {
  options: string[];
  correct_option_index: number;
}

export interface QuestionSchema {
  question_id?: string;
  question_type?: string;
  question_text?: string;
  content?: MCQContent | any;
  [key: string]: any;
}

export interface ExamResponse {
  exam_id: string | null;
  exam_title: string;
  questions: QuestionSchema[];
}

export interface ExamResultResponse {
  submission_id: string;
  exam_id: string;
  exam_title: string | null;
  total_score: number;
  max_score: number;
  status: string;
  created_at: string;
}

export interface SubmissionRequest {
  exam_id: string;
  answers: Record<string, any>[]; // Extendable since full schema is truncated
  [key: string]: any;
}

export interface SubmissionResponse {
  submission_id?: string;
  total_score?: number;
  max_score?: number;
  status?: string;
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const unwrap = (res: any): any => res.data?.data ?? res.data;

// ─── Service ──────────────────────────────────────────────────────────────────

export const examService = {
  /**
   * POST /api/exam/generate-exam
   * Generates a new exam for the given collection and chapters.
   */
  generateExam: async (payload: ExamRequest): Promise<ExamResponse> => {
    const url = '/api/exam/generate-exam';
    try {
      const response = await apiClient.post(url, payload);
      return unwrap(response);
    } catch (error: any) {
      console.error(`[ExamService POST] Failed: ${url}`, error);
      throw error;
    }
  },

  /**
   * GET /api/exam/results
   * Retrieves all exam results for the current user.
   */
  getExamResults: async (): Promise<ExamResultResponse[]> => {
    const url = '/api/exam/results';
    try {
      const response = await apiClient.get(url);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error(`[ExamService GET] Failed: ${url}`, error);
      throw error;
    }
  },

  /**
   * POST /api/exam/submit
   * Submits exam answers for grading.
   */
  submitExam: async (payload: SubmissionRequest): Promise<SubmissionResponse> => {
    const url = '/api/exam/submit';
    try {
      const response = await apiClient.post(url, payload);
      return unwrap(response);
    } catch (error: any) {
      console.error(`[ExamService POST] Failed: ${url}`, error);
      throw error;
    }
  }
};
