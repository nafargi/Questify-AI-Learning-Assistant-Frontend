import { QuestifyClient } from '../client/questify.client';
import { ValidationError } from '../client/questify.errors';
import { SubscriptionContext } from '../context/subscription.context';
import { ExamGenerationDisabledError } from '../client/questify.errors';
import { GenerateExamPayload, Exam, SubmitExamPayload, GradedSubmission, ExamResult } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ExamsService {
  /**
   * Generate an exam for a collection.
   * @throws {ExamGenerationDisabledError} if plan doesn't include exam generation
   * @throws {ValidationError} if payload is invalid
   */
  static async generateExam(payload: GenerateExamPayload): Promise<Exam> {
    if (!SubscriptionContext.isExamGenerationEnabled()) {
      throw new ExamGenerationDisabledError('Exam generation is not available on your current plan', 'local', '/exam/generate-exam');
    }
    if (!UUID_REGEX.test(payload.collection_id)) {
      throw new ValidationError('Invalid collection_id UUID', 'local', '/exam/generate-exam');
    }
    if (!payload.chapter_ids || payload.chapter_ids.length === 0) {
      throw new ValidationError('At least one chapter_id is required', 'local', '/exam/generate-exam');
    }
    for (const id of payload.chapter_ids) {
      if (!UUID_REGEX.test(id)) throw new ValidationError(`Invalid chapter_id UUID: ${id}`, 'local', '/exam/generate-exam');
    }
    const qCount = Math.round(payload.question_count ?? 25);
    if (qCount < 1 || qCount > 100) throw new ValidationError('question_count must be between 1 and 100', 'local', '/exam/generate-exam');
    if (!payload.question_types || payload.question_types.length === 0) {
      throw new ValidationError('At least one question type is required', 'local', '/exam/generate-exam');
    }
    return QuestifyClient.post<Exam>('/exam/generate-exam', { ...payload, question_count: qCount });
  }

  /** Get all past exam results. Cached 30s. */
  static async getResults(): Promise<ExamResult[]> {
    return QuestifyClient.get<ExamResult[]>('/exam/results', { ttlMs: 30000 });
  }

  /**
   * Submit exam answers.
   * @throws {ValidationError} if answers map is empty or contains invalid UUIDs
   */
  static async submitExam(payload: SubmitExamPayload): Promise<GradedSubmission> {
    if (!payload.answers || Object.keys(payload.answers).length === 0) {
      throw new ValidationError('Answers must not be empty', 'local', '/exam/submit');
    }
    // Sanitize: trim all answer strings
    const sanitized: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload.answers)) {
      sanitized[k] = v.trim();
    }
    return QuestifyClient.post<GradedSubmission>('/exam/submit', { ...payload, answers: sanitized });
  }
}
