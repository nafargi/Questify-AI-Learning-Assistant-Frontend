export type QuestionType = 'Multiple Choice' | 'True/False' | 'Fill in Blank' | 'Matching' | 'Short Answer' | 'Coding';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export interface GenerateExamPayload {
  collection_id: string;
  chapter_ids: string[];
  question_count: number;
  difficulty: Difficulty;
  question_types: QuestionType[];
}

export interface ExamQuestion {
  question_id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correct_answer?: string;
}

export interface Exam {
  exam_id: string;
  collection_id: string;
  questions: ExamQuestion[];
  created_at: string;
}

export interface SubmitExamPayload {
  exam_id: string;
  answers: Record<string, string>;
}

export interface GradedSubmission {
  exam_id: string;
  score: number;
  total: number;
  percentage: number;
  results: Array<{ question_id: string; correct: boolean; feedback?: string }>;
}

export interface ExamResult {
  result_id: string;
  exam_id: string;
  score: number;
  total: number;
  percentage: number;
  created_at: string;
}
