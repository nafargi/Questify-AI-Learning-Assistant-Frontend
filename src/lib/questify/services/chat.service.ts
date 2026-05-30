import { QuestifyClient } from '../client/questify.client';
import { SubscriptionContext } from '../context/subscription.context';
import { ChatDisabledError, ValidationError } from '../client/questify.errors';
import { AskPayload, AskPayloadSchema, AskResponse, ChatMessage, ChatSession } from '../types';

export class ChatService {
  private static activeSessionId: string | null = null;

  static setActiveSession(id: string): void {
    this.activeSessionId = id;
  }

  static clearActiveSession(): void {
    this.activeSessionId = null;
  }

  static getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  static async createSession(): Promise<ChatSession> {
    if (!SubscriptionContext.isChatEnabled()) {
      throw new ChatDisabledError('Chat is disabled on your current plan', 'local', '/chat/session');
    }
    const session = await QuestifyClient.post<ChatSession>('/chat/session');
    this.setActiveSession(session.id);
    return session;
  }

  static async listSessions(): Promise<ChatSession[]> {
    return QuestifyClient.get<ChatSession[]>('/chat/sessions');
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return QuestifyClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  }

  static async ask(payload: AskPayload): Promise<AskResponse> {
    if (!SubscriptionContext.isChatEnabled()) {
      throw new ChatDisabledError('Chat is disabled on your current plan', 'local', '/chat/ask');
    }

    const validated = AskPayloadSchema.parse(payload);
    
    // Auto-inject active session if not provided
    if (!validated.session_id && this.activeSessionId) {
      validated.session_id = this.activeSessionId;
    }

    const response = await QuestifyClient.post<AskResponse>('/chat/ask', validated);

    // If a new session was created implicitly, update the active session
    if (response.session_id && this.activeSessionId !== response.session_id) {
      this.setActiveSession(response.session_id);
    }

    return response;
  }
}
