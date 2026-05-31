export interface ChatSession {
  session_id: string;
  user_id: string;
  created_at: string;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AskPayload {
  question: string;
  session_id?: string;
  collection_id?: string;
}

export interface AskResponse {
  answer: string;
  session_id: string;
  message_id: string;
}
