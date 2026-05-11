import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { ChatCircle, ArrowLeft, BookOpen, PaperPlaneTilt, Sparkle, CircleNotch, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PDFViewer } from "@/components/study/PDFViewer";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { toast } from "sonner";

interface FeynmanMethodProps {
    bookTitle?: string;
    pdfUrl?: string | null;
    isFetchingPdf?: boolean;
    collectionId?: string;
    studyData: any;
    onBack: () => void;
}

interface ChatMessage { sender: 'ai' | 'user'; text: string; type?: 'concept' | 'gap' | 'reply'; }

export function FeynmanMethod({ bookTitle, pdfUrl, isFetchingPdf, collectionId, studyData, onBack }: FeynmanMethodProps) {
    const [isSourceVisible, setIsSourceVisible] = useState(true);
    const [userInput, setUserInput] = useState("");
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Build initial chat from actual API data
    useEffect(() => {
        if (!studyData) return;
        const msgs: ChatMessage[] = [];

        // Concept intro
        if (studyData.concept) {
            msgs.push({
                sender: 'ai',
                text: `📚 Today's concept: **${studyData.concept}**\n\n${studyData.simple_explanation || ''}`,
                type: 'concept'
            });
        }

        // Key points
        if (studyData.key_points?.length) {
            msgs.push({
                sender: 'ai',
                text: `🔑 Key points to cover:\n${studyData.key_points.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`,
                type: 'concept'
            });
        }

        // Knowledge gaps → this is what the student must explain
        if (studyData.knowledge_gaps?.length) {
            msgs.push({
                sender: 'ai',
                text: `🎯 I need you to explain these areas in simple terms:\n${studyData.knowledge_gaps.map((g: string) => `• ${g}`).join('\n')}`,
                type: 'gap'
            });
        }

        if (msgs.length === 0) {
            msgs.push({ sender: 'ai', text: "I'm ready to hear your explanation. Teach me this topic as if I'm a beginner!", type: 'concept' });
        }

        setChatHistory(msgs);
    }, [studyData]);

    const handleSend = async () => {
        if (!userInput.trim() || !collectionId) return;
        const input = userInput;
        setChatHistory(p => [...p, { sender: 'user', text: input }]);
        setUserInput("");
        setIsSubmitting(true);

        try {
            const response = await api.submitFeynman({ collection_id: collectionId, explanation: input });
            const feedback = response.feedback || response.simple_explanation || "Good effort! Keep simplifying.";
            const gaps = response.knowledge_gaps || response.knowledge_gaps;
            let reply = feedback;
            if (gaps?.length) reply += `\n\n🎯 Focus more on:\n${gaps.map((g: string) => `• ${g}`).join('\n')}`;
            setChatHistory(p => [...p, { sender: 'ai', text: reply, type: 'reply' }]);
        } catch {
            toast.error("Could not get AI feedback right now.");
            setChatHistory(p => [...p, { sender: 'ai', text: "Good try! Keep simplifying the concept.", type: 'reply' }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <StudySessionLayout
            title="Feynman Studio"
            subtitle={bookTitle}
            icon={ChatCircle}
            color="text-green-500"
            onExit={onBack}
            rightAction={
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal-600 border-teal-200 bg-teal-50/50">
                        Teach to Learn
                    </Badge>
                    <Badge variant={isSubmitting ? "secondary" : "default"} className="rounded-full">
                        {isSubmitting ? 'AI ANALYZING...' : 'LISTENING'}
                    </Badge>
                </div>
            }
        >
            <div className="flex h-full animate-in fade-in duration-500 overflow-hidden bg-background">
                {/* LEFT: PDF */}
                <div className={cn(
                    "transition-all duration-500 relative border-r overflow-hidden flex flex-col bg-slate-50/50",
                    isSourceVisible ? "w-[40%] opacity-100" : "w-12 opacity-80"
                )}>
                    {isSourceVisible ? (
                        <>
                            {isFetchingPdf ? (
                                <div className="flex items-center justify-center h-full gap-3 text-muted-foreground flex-col">
                                    <CircleNotch className="w-6 h-6 animate-spin text-primary" />
                                    <span className="text-xs font-medium">Loading document...</span>
                                </div>
                            ) : (
                                <PDFViewer pdfUrl={pdfUrl} title={bookTitle} />
                            )}
                            <Button
                                variant="secondary" size="sm"
                                className="absolute top-4 right-4 z-50 shadow-md h-8 w-8 p-0 rounded-lg"
                                onClick={() => setIsSourceVisible(false)}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center pt-8 gap-6">
                            <Button variant="ghost" size="icon" onClick={() => setIsSourceVisible(true)} className="h-12 w-12 rounded-xl hover:bg-teal-50">
                                <BookOpen className="w-6 h-6 text-teal-600" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* RIGHT: Chat */}
                <div className="flex-1 flex flex-col relative bg-dot-pattern min-w-0">
                    <div className="flex-1 flex flex-col h-full max-w-2xl mx-auto w-full p-6 pb-0 gap-4">
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <div className="space-y-6 pb-6 mt-2">
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={cn(
                                        "flex flex-col gap-2 max-w-[88%] animate-in slide-in-from-bottom-2",
                                        msg.sender === 'user' ? "items-end ml-auto" : "items-start"
                                    )}>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest px-2",
                                            msg.sender === 'ai' ? "text-teal-600" : "text-slate-400"
                                        )}>
                                            {msg.sender === 'ai' ? '🤖 AI Tutor' : '👤 You'}
                                        </span>
                                        <div className={cn(
                                            "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                                            msg.sender === 'ai'
                                                ? msg.type === 'gap'
                                                    ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none"
                                                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                                                : "bg-teal-600 text-white rounded-tr-none"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isSubmitting && (
                                    <div className="flex items-center gap-2 text-teal-600 text-xs font-bold animate-pulse ml-4">
                                        <CircleNotch className="w-4 h-4 animate-spin" />
                                        AI is analyzing your explanation...
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="pb-6 mt-auto">
                            <Card className="p-3 flex flex-col gap-2 shadow-xl border-teal-500/20 bg-background/90 backdrop-blur-xl rounded-2xl">
                                <Textarea
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    placeholder="Explain this concept in simple terms, as if teaching a 10-year-old..."
                                    className="resize-none border-none focus-visible:ring-0 min-h-[100px] text-sm bg-transparent"
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                />
                                <div className="flex justify-between items-center px-2 py-1 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shift+Enter for new line</span>
                                    <Button
                                        size="sm"
                                        onClick={handleSend}
                                        disabled={!userInput.trim() || isSubmitting}
                                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 h-9 font-bold gap-2"
                                    >
                                        Submit <PaperPlaneTilt className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </StudySessionLayout>
    );
}
