import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  PaperPlaneRight,
  BookOpen,
  Brain,
  Target,
  TrendUp,
  Trash,
  Clock,
  CircleNotch,
  Robot,
  List,
  ChatCircle,
  Paperclip,
  Microphone,
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatService, ChatSession, ChatMessage } from '@/services/chatService';
import { toast } from 'sonner';

// ─── Suggested prompts shown on the empty-state welcome screen ────────────────

const suggestedPrompts = [
  {
    icon: BookOpen,
    title: 'Explain Concept',
    prompt: 'Can you explain a difficult concept to me in simple terms?',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Brain,
    title: 'Study Strategy',
    prompt: "What's the best study strategy to retain information long-term?",
    color: 'bg-violet-500/10 text-violet-500',
  },
  {
    icon: Target,
    title: 'Key Takeaways',
    prompt: 'How do I identify the most important points when studying?',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: TrendUp,
    title: 'Exam Readiness',
    prompt: 'What kinds of questions should I prepare for in an upcoming exam?',
    color: 'bg-emerald-500/10 text-emerald-500',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const QuestyChat = () => {
  const { user, avatarUrl } = useAuth();
  const isMobile = useIsMobile();

  const memoizedAvatarUrl = useMemo(
    () => avatarUrl || getAvatarUrl(user?.avatar_url),
    [avatarUrl, user?.avatar_url]
  );

  // ── State ──────────────────────────────────────────────────────────────────

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Data fetchers ──────────────────────────────────────────────────────────

  /** Loads messages for a given session. */
  const fetchMessages = async (sessionId: string) => {
    setIsLoadingMessages(true);
    try {
      const data = await chatService.getMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('[Chat] Failed to load messages:', error);
      toast.error('Failed to load conversation history.');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load messages whenever the selected session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Auto-scroll to bottom on new messages / typing indicator
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Clears the active session so the user starts a fresh chat. */
  const createNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInputValue('');
    setMobileHistoryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  /**
   * Sends the user's message.
   */
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const question = inputValue.trim();
    console.log('[QuestyChat] handleSend triggered. Question:', question);

    setInputValue('');
    setIsTyping(true);

    // Show the user's message immediately (optimistic update)
    const optimisticUserMsg: ChatMessage = {
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      let sessionId = activeSessionId;

      // If no session exists, create one first via the dedicated endpoint
      if (!sessionId) {
        // Derive a title from the user's first message (max 30 chars)
        const sessionTitle = question.length > 30 ? question.substring(0, 27) + '...' : question;
        console.log(`[QuestyChat] No active session. Creating one via POST  with title: "${sessionTitle}"...`);

        const newSession = await chatService.createSession(sessionTitle);
        sessionId = newSession.session_id;
        setActiveSessionId(sessionId);
        console.log('[QuestyChat] Session created successfully:', sessionId);
        // fetchSessions is not defined, skipping session list refresh
      }

      console.log('[QuestyChat] Calling chatService.ask with session_id:', sessionId);
      const response = await chatService.ask({
        question,
        session_id: sessionId,
      });

      console.log('[QuestyChat] chatService.ask SUCCESS. Response:', response);

      // Append the assistant reply
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error('[QuestyChat] CRITICAL FAILURE:', error);

      const errorDetail = error.response?.data || error.message;
      const errorStatus = error.response?.status || 'Unknown';

      toast.error(`Error ${errorStatus}: Check chat bubble for details.`);

      // Show the FULL RAW ERROR in the chat bubble so you can't miss it
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `🚨 SYSTEM ERROR (${errorStatus})\n\nRaw Response:\n\`\`\`json\n${JSON.stringify(errorDetail, null, 2)}\n\`\`\`\n\nPlease check if the endpoint exists or if the payload is correct.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      console.log('[QuestyChat] handleSend finished.');
    }
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Questy AI Partner">
      <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-110px)] max-w-4xl mx-auto w-full gap-4 lg:gap-6 p-3 lg:p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col rounded-xl border-none relative glass-card overflow-hidden">
          {/* Mobile top bar */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Robot className="w-5 h-5 text-primary" weight="fill" />
                </div>
                <h2 className="font-bold text-sm">Questy AI</h2>
              </div>
              <Button
                onClick={createNewChat}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-primary"
              >
                <Plus className="w-5 h-5" weight="bold" />
              </Button>
            </div>
          )}

          {/* ── Messages / Welcome ── */}
          <AnimatePresence mode="wait">
            {messages.length === 0 && !activeSessionId ? (
              /* Welcome / empty state */
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 text-center overflow-y-auto"
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-inner animate-bounce-subtle">
                  <Robot className="w-10 h-10 text-primary" weight="fill" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-3">
                  Hi, I'm Questy!
                </h2>
                <p className="text-muted-foreground max-w-sm mb-8 lg:mb-12 text-sm lg:text-base leading-relaxed">
                  Your AI study partner. Ask me anything — concepts, strategies, summaries, or exam
                  tips. I'm here to help you learn.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-w-2xl w-full">
                  {suggestedPrompts.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(item.prompt)}
                      className="group flex gap-x-4 items-center p-3 lg:p-4 rounded-2xl border bg-card/50 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm"
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                          item.color
                        )}
                      >
                        <item.icon className="w-4.5 h-4.5" weight="bold" />
                      </div>
                      <div>
                        <p className="font-bold text-xs lg:text-sm mb-1">{item.title}</p>
                        <p className="text-[10px] lg:text-xs text-muted-foreground leading-snug line-clamp-2">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Conversation */
              <ScrollArea className="flex-1 p-4 lg:p-10">
                <div className="space-y-6 max-w-3xl mx-auto">
                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                      <CircleNotch className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm font-bold uppercase tracking-widest">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div
                          key={message.message_id ?? index}
                          className={cn(
                            'flex gap-3 lg:gap-4',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-primary/10 flex flex-shrink-0 items-center justify-center shadow-sm self-end mb-2">
                              <Robot className="w-4 h-4 lg:w-5 lg:h-5 text-primary" weight="fill" />
                            </div>
                          )}

                          <div
                            className={cn(
                              'max-w-[85%] lg:max-w-[80%] p-3 lg:p-4 rounded-2xl relative shadow-sm',
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted/50 border text-foreground rounded-bl-none'
                            )}
                          >
                            <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </div>
                            <span
                              className={cn(
                                'text-[9px] lg:text-[10px] opacity-40 mt-2 lg:mt-3 block font-bold uppercase tracking-widest',
                                message.role === 'user'
                                  ? 'text-primary-foreground'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {message.created_at
                                ? new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : 'Just now'}
                            </span>
                          </div>

                          {message.role === 'user' && (
                            <Avatar className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl shadow-sm self-end mb-2">
                              <AvatarImage src={memoizedAvatarUrl} alt={user?.full_name} />
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                {user?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex gap-4 justify-start">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex flex-shrink-0 items-center justify-center shadow-sm self-end mb-2">
                            <Robot className="w-5 h-5 text-primary animate-pulse" />
                          </div>
                          <div className="bg-muted px-6 py-4 rounded-3xl flex flex-col gap-1.5">
                            <div className="flex gap-1.5 items-center">
                              <span
                                className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                                style={{ animationDelay: '0ms' }}
                              />
                              <span
                                className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                                style={{ animationDelay: '200ms' }}
                              />
                              <span
                                className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                                style={{ animationDelay: '400ms' }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-primary opacity-60">
                              Questy is thinking...
                            </span>
                          </div>
                        </div>
                      )}

                      <div ref={scrollRef} />
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </AnimatePresence>

          {/* ── Input bar ── */}
          <div className="p-3 lg:p-6 bg-background/50 backdrop-blur-md border-t">
            <div className="max-w-3xl mx-auto relative">
              <div className="flex flex-col bg-muted/30 border rounded-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isTyping}
                  placeholder="Ask Questy anything..."
                  className="border-none focus-visible:ring-0 min-h-[40px] lg:min-h-[48px] max-h-[150px] lg:max-h-[200px] px-4 lg:px-5 py-2 lg:py-3 text-sm bg-transparent resize-none disabled:opacity-50"
                />

                <div className="flex items-center justify-between px-3 lg:px-4 py-1.5 lg:py-2 bg-muted/20 border-t">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 lg:h-9 lg:w-9 rounded-full text-muted-foreground"
                    >
                      <Paperclip className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 lg:h-9 lg:w-9 rounded-full text-muted-foreground"
                    >
                      <Microphone className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="h-8 lg:h-10 px-4 lg:px-6 rounded-full font-bold gap-2 group transition-all active:scale-95 shadow-md shadow-primary/20 text-xs lg:text-sm"
                  >
                    {isTyping ? (
                      <CircleNotch className="w-4 h-4 animate-spin" />
                    ) : (
                      'Send'
                    )}
                    {!isTyping && (
                      <PaperPlaneRight
                        className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        weight="bold"
                      />
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
