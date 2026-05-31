import { QuestifyClient } from '../client/questify.client';
import { ValidationError, ChatDisabledError } from '../client/questify.errors';
import { SubscriptionContext } from '../context/subscription.context';
import { ChatSession, ChatMessage, AskPayload, AskResponse } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ChatService {
  private static activeSessionId: string | null = null;

  static setActiveSession(id: string): void { this.activeSessionId = id; }
  static clearActiveSession(): void { this.activeSessionId = null; }
  static getActiveSessionId(): string | null { return this.activeSessionId; }

  /** Create a new chat session. */
  static async createSession(): Promise<ChatSession> {
    const session = await QuestifyClient.post<ChatSession>('/chat/session');
    this.activeSessionId = session.session_id;
    return session;
  }

  /**
   * Ask a question. Automatically uses active session if session_id not provided.
   * @throws {ChatDisabledError} if plan doesn't include chat
   * @throws {ValidationError} if question is empty or over 2000 chars
   */
  static async ask(payload: AskPayload): Promise<AskResponse> {
    if (!SubscriptionContext.isChatEnabled()) {
      throw new ChatDisabledError('Chat is not available on your current plan', 'local', '/chat/ask');
    }
    const question = payload.question.trim();
    if (!question) throw new ValidationError('Question cannot be empty', 'local', '/chat/ask');
    if (question.length > 2000) throw new ValidationError('Question cannot exceed 2000 characters', 'local', '/chat/ask');
    if (payload.session_id && !UUID_REGEX.test(payload.session_id)) {
      throw new ValidationError('Invalid session_id UUID', 'local', '/chat/ask');
    }
    const sessionId = payload.session_id ?? this.activeSessionId ?? undefined;
    return QuestifyClient.post<AskResponse>('/chat/ask', { ...payload, question, session_id: sessionId });
  }

  /** List all chat sessions. */
  static async listSessions(): Promise<ChatSession[]> {
    return QuestifyClient.get<ChatSession[]>('/chat/sessions');
  }

  /** Get all messages for a session. */
  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return QuestifyClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  }
}
