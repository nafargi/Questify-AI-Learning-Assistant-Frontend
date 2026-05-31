import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, PaperPlaneRight, Trash, User, Robot,
  BookOpen, Brain, Target, TrendUp, CircleNotch
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
}

const suggestedPrompts = [
  { icon: BookOpen, title: "Explain Concept", prompt: "Can you explain the concept of photosynthesis in simple terms?", color: "bg-blue-500/10 text-blue-500" },
  { icon: Brain, title: "Study Strategy", prompt: "What's the best way to study for my calculus exam next week?", color: "bg-violet-500/10 text-violet-500" },
  { icon: Target, title: "Improve Weakness", prompt: "I'm struggling with quadratic equations. How can I improve?", color: "bg-orange-500/10 text-orange-500" },
  { icon: TrendUp, title: "Track Progress", prompt: "Based on my recent exams, what topics should I focus on?", color: "bg-emerald-500/10 text-emerald-500" },
];

const QuestyChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Load sessions on mount
  useEffect(() => {
    api.get<ChatSession[]>("/chat/sessions").then((res) => {
      if (res.success) setSessions(res.data ?? []);
      setSessionsLoading(false);
    });
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    setMessages([]);
    const res = await api.get<Message[]>(`/chat/sessions/${sessionId}/messages`);
    if (res.success) setMessages(res.data ?? []);
    setMessagesLoading(false);
  }, []);

  const selectSession = (session: ChatSession) => {
    setActiveSessionId(session.session_id);
    loadMessages(session.session_id);
  };

  const createNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic removal — no delete endpoint in API, just remove from UI
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    if (activeSessionId === sessionId) createNewChat();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const res = await api.post<{ session_id: string; answer: string }>("/chat/ask", {
      question,
      ...(activeSessionId ? { session_id: activeSessionId } : {}),
    });

    setIsSending(false);

    if (!res.success) {
      toast.error(res.message);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInputValue(question);
      return;
    }

    const { session_id, answer } = res.data;

    // If this was a new session, add it to the sidebar and set active
    if (!activeSessionId) {
      setActiveSessionId(session_id);
      const newSession: ChatSession = {
        session_id,
        title: question.slice(0, 40),
        created_at: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: answer,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  const showWelcome = messages.length === 0 && !activeSessionId && !messagesLoading;

  return (
    <DashboardLayout title="Questy AI Partner">
      <div className="flex h-[calc(100vh-120px)] gap-6 p-4">

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <Button onClick={createNewChat} className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 font-bold gap-2">
            <Plus className="w-4 h-4" weight="bold" />New Session
          </Button>

          <Card className="flex-1 rounded-xl border-none shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="p-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Sessions</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 w-full">
              <div className="p-2 space-y-1">
                {sessionsLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                {!sessionsLoading && sessions.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No sessions yet.</p>
                )}
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => selectSession(session)}
                    className={cn(
                      "group p-2.5 rounded-xl cursor-pointer transition-all duration-200 relative",
                      activeSessionId === session.session_id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="font-bold text-sm truncate pr-6">{session.title || "New Chat"}</p>
                      <button onClick={(e) => deleteSession(session.session_id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Main chat area */}
        <Card className="flex-1 flex flex-col rounded-xl border-none relative">
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div key="welcome" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Robot className="w-8 h-8 text-primary" weight="fill" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">How can I help you study today?</h2>
                <p className="text-muted-foreground max-w-sm mb-12">Ask me anything about your study materials.</p>
                <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
                  {suggestedPrompts.map((item, i) => (
                    <button key={i} onClick={() => setInputValue(item.prompt)}
                      className="group flex gap-x-4 items-center p-4 rounded-2xl border bg-card/50 text-left hover:border-primary hover:bg-primary/5 transition-all">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                        <item.icon className="w-4 h-4" weight="bold" />
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <ScrollArea className="flex-1 p-2 lg:p-10">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messagesLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex shrink-0 items-center justify-center self-end mb-2">
                          <Robot className="w-5 h-5 text-primary" weight="fill" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl shadow-sm",
                        msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted/50 border rounded-bl-none'
                      )}>
                        <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <span className="text-[10px] opacity-40 mt-2 block">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-9 h-9 rounded-xl bg-muted flex shrink-0 items-center justify-center self-end mb-2">
                          <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Robot className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                      <div className="bg-muted px-6 py-4 rounded-3xl flex gap-1.5 items-center">
                        {[0, 200, 400].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <div className="p-6 bg-background/50 backdrop-blur-md border-t">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col bg-muted/30 border rounded-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask anything about your study materials..."
                  className="border-none focus-visible:ring-0 h-12 px-5 text-sm bg-transparent"
                />
                <div className="flex items-center justify-end px-4 py-2 bg-muted/20 border-t">
                  <Button onClick={handleSend} disabled={!inputValue.trim() || isSending}
                    className="h-10 px-6 rounded-full font-bold gap-2 group shadow-md shadow-primary/20">
                    {isSending ? <CircleNotch className="w-4 h-4 animate-spin" /> : (
                      <>Send <PaperPlaneRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" weight="bold" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QuestyChat;
