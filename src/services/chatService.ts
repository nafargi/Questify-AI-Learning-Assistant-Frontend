import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatSession {
    session_id: string;
    title: string;
    created_at: string;
}

export interface ChatMessage {
    message_id?: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface AskResponse {
    session_id: string;
    answer: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const unwrap = (res: any): any => res.data?.data ?? res.data;

// ─── Service ──────────────────────────────────────────────────────────────────

export const chatService = {

    /**
     * GET /api/chat/sessions/{session_id}/messages
     * Returns: { data: [{ message_id, role, content, created_at }] }
     */
    getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const url = `/api/chat/sessions/${sessionId}/messages`;
        console.log(`[Chat] GET ${url}`);
        try {
            const res = await apiClient.get(url);
            const data = unwrap(res);
            console.log(`[Chat] GET ${url} →`, data);
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            console.error(`[Chat] GET ${url} failed`, {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
            throw error;
        }
    },

    /**
     * POST /api/chat/ask
     * Body:     { question: string, session_id?: string }
     * Returns:  { data: { session_id, answer } }
     *
     * Omit session_id (or pass undefined) to let the backend create a new session.
     */
    ask: async (params: { question: string; session_id: string }): Promise<AskResponse> => {
        const url = '/api/chat/ask';

        const payload = {
            question: params.question,
            session_id: params.session_id
        };

        console.group(`[Chat Service] POST ${url}`);
        console.log('Sending Payload:', JSON.stringify(payload, null, 2));
        console.groupEnd();

        try {
            const res = await apiClient.post(url, payload);
            const data = unwrap(res);
            console.log(`[Chat Service] SUCCESS: ${url}`, data);
            return data as AskResponse;
        } catch (error: any) {
            const errorPayload = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                errorData: error.response?.data,
                errorMessage: error.message,
                requestPayload: payload
            };
            console.error(`[Chat Service] CRITICAL ERROR: ${url}`, errorPayload);
            throw error;
        }
    },

    /**
     * POST /api/chat/session
     * Creates a new chat session with a title.
     */
    createSession: async (title: string): Promise<ChatSession> => {
        const url = '/api/chat/session';
        // TEMP: Hardcoded collection ID to prevent backend 500 until they make it truly optional
        const payload = {
            title
        };
        console.log(`[Chat Service] ATTEMPTING: POST ${url}`, payload);
        try {
            const res = await apiClient.post(url, payload);
            const data = unwrap(res);
            console.log(`[Chat Service] SUCCESS: ${url}`, data);
            return data as ChatSession;
        } catch (error: any) {
            const errorPayload = {
                status: error.response?.status,
                statusText: error.response?.statusText,
                errorData: error.response?.data,
                errorMessage: error.message,
            };
            console.error(`[Chat Service] CRITICAL ERROR: ${url}`, errorPayload);
            throw error;
        }
    },

    // /**
    //  * DELETE /api/chat/sessions/{session_id}
    //  */
    // deleteSession: async (sessionId: string): Promise<void> => {
    //     const url = `/api/chat/sessions/${sessionId}`;
    //     console.log(`[Chat] DELETE ${url}`);
    //     try {
    //         await apiClient.delete(url);
    //         console.log(`[Chat] DELETE ${url} → ok`);
    //     } catch (error: any) {
    //         console.error(`[Chat] DELETE ${url} failed`, {
    //             status: error.response?.status,
    //             data: error.response?.data,
    //             message: error.message,
    //         });
    //         throw error;
    // },

    /**
     * GET /api/chat/sessions
     * Retrieves all chat sessions for the current user.
     */
    getSessions: async (): Promise<ChatSession[]> => {
        const url = '/api/chat/sessions';
        console.log(`[Chat Service] GET ${url}`);
        try {
            const res = await apiClient.get(url);
            const data = unwrap(res);
            console.log(`[Chat Service] SUCCESS: ${url}`, data);
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            console.error(`[Chat Service] GET ${url} failed`, error);
            throw error;
        }
    },
};
