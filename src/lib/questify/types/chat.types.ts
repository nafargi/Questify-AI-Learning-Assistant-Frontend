import { z } from 'zod';

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const AskPayloadSchema = z.object({
  question: z.string().trim().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  session_id: z.string().uuid().optional(),
});

export type AskPayload = z.infer<typeof AskPayloadSchema>;

export interface AskResponse {
  message: ChatMessage;
  session_id: string;
}
