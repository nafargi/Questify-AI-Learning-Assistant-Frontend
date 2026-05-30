import { z } from 'zod';

export const QuestionTypeEnum = z.enum([
  'Multiple Choice',
  'True/False',
  'Fill in Blank',
  'Matching',
  'Short Answer',
  'Coding'
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const GenerateExamPayloadSchema = z.object({
  collection_id: z.string().uuid('Invalid collection ID format'),
  chapter_ids: z.array(z.string().uuid()).min(1, 'At least one chapter is required'),
  question_count: z.number().int().min(1).max(100).default(25),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']),
  question_types: z.array(QuestionTypeEnum).min(1, 'At least one question type is required'),
});

export type GenerateExamPayload = z.infer<typeof GenerateExamPayloadSchema>;

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // for multiple choice / matching
  answer?: string; // used internally, hidden from user when taking exam ideally
}

export interface Exam {
  id: string;
  collection_id: string;
  title: string;
  questions: Question[];
  created_at: string;
}

export interface SubmitExamPayload {
  exam_id: string;
  answers: Record<string, string>;
}

export interface GradedQuestion {
  question_id: string;
  is_correct: boolean;
  correct_answer: string;
  user_answer: string;
  explanation?: string;
}

export interface GradedSubmission {
  exam_id: string;
  score: number;
  total_questions: number;
  results: GradedQuestion[];
  submitted_at: string;
}

export interface ExamResult extends GradedSubmission {
  // Can extend if list endpoint returns additional metadata
}
