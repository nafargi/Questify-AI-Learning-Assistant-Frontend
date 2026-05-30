import { QuestifyClient } from '../client/questify.client';
import { SubscriptionContext } from '../context/subscription.context';
import { ValidationError, ExamGenerationDisabledError } from '../client/questify.errors';
import {
  GenerateExamPayload,
  GenerateExamPayloadSchema,
  Exam,
  SubmitExamPayload,
  ExamResult,
  GradedSubmission,
} from '../types';

export class ExamsService {
  static async generateExam(payload: GenerateExamPayload): Promise<Exam> {
    if (!SubscriptionContext.isExamGenerationEnabled()) {
      throw new ExamGenerationDisabledError('Exam generation is disabled for your current plan', 'local', '/exam/generate-exam');
    }

    const validated = GenerateExamPayloadSchema.parse(payload);
    return QuestifyClient.post<Exam>('/exam/generate-exam', validated);
  }

  static async getResults(): Promise<ExamResult[]> {
    return QuestifyClient.get<ExamResult[]>('/exam/results', {
      ttlMs: 30000, // 30s cache per constraints
    });
  }

  static async submitExam(payload: SubmitExamPayload): Promise<GradedSubmission> {
    // Validate answer map
    if (!payload.answers || Object.keys(payload.answers).length === 0) {
      throw new ValidationError('Answers map cannot be empty', 'local', '/exam/submit');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const sanitizedAnswers: Record<string, string> = {};

    for (const [questionId, answer] of Object.entries(payload.answers)) {
      if (!uuidRegex.test(questionId)) {
        throw new ValidationError(`Invalid question ID format: ${questionId}`, 'local', '/exam/submit');
      }
      
      const trimmedAnswer = answer.trim();
      if (!trimmedAnswer) {
        throw new ValidationError(`Answer for question ${questionId} cannot be empty`, 'local', '/exam/submit');
      }
      
      sanitizedAnswers[questionId] = trimmedAnswer;
    }

    const finalPayload: SubmitExamPayload = {
      exam_id: payload.exam_id,
      answers: sanitizedAnswers,
    };

    return QuestifyClient.post<GradedSubmission>('/exam/submit', finalPayload);
  }
}
