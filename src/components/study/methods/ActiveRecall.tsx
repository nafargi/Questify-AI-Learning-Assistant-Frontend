import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { Brain, Eye, ArrowCounterClockwise, Check, Sparkle, X, Target, ArrowRight, Lightbulb } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Prompt { question: string; hint?: string; }

export function ActiveRecall({ onBack, collectionId, studyData, bookTitle, pdfUrl, isFetchingPdf }: {
    onBack: () => void;
    bookFilename?: string;
    bookTitle?: string;
    pdfUrl?: string | null;
    isFetchingPdf?: boolean;
    collectionId?: string;
    studyData: any;
}) {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [topic, setTopic] = useState<string>("");

    // Initialize from actual API data: { topic, prompts: [{question, hint}] }
    useEffect(() => {
        if (studyData) {
            const qs: Prompt[] = studyData.prompts || studyData.questions || [];
            setPrompts(qs);
            setTopic(studyData.topic || "");
        }
    }, [studyData]);

    const currentQ = prompts[currentIndex];
    const isComplete = prompts.length > 0 && currentIndex >= prompts.length;
    const progressValue = prompts.length > 0 ? (currentIndex / prompts.length) * 100 : 0;
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

    const handleNext = (correct: boolean) => {
        setScore(p => ({ correct: p.correct + (correct ? 1 : 0), total: p.total + 1 }));
        setIsAnswerVisible(false);
        setIsHintVisible(false);
        setCurrentIndex(p => p + 1);
    };

    return (
        <StudySessionLayout
            title="Active Recall"
            subtitle={topic || "Self-Testing Protocol"}
            icon={Brain}
            color="text-rose-500"
            onExit={onBack}
            rightAction={
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-rose-600 border-rose-200 bg-rose-50/50 rounded-full px-3">
                    Accuracy: {accuracy}%
                </Badge>
            }
        >
            <div className="flex h-full overflow-hidden bg-background">
                <div className="flex-1 flex flex-col relative min-w-0">
                    {/* Progress Bar */}
                    <div className="p-5 border-b bg-card/30 backdrop-blur-sm flex items-center gap-4">
                        <Progress value={progressValue} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                            {Math.min(currentIndex + 1, prompts.length)} / {prompts.length}
                        </span>
                        {topic && (
                            <Badge variant="secondary" className="text-[10px] rounded-full shrink-0">
                                {topic}
                            </Badge>
                        )}
                    </div>

                    <ScrollArea className="flex-1 p-8">
                        <div className="max-w-2xl mx-auto flex flex-col justify-center gap-8 py-10 min-h-[60vh]">
                            {prompts.length === 0 ? (
                                <div className="text-center text-muted-foreground py-20">
                                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">No prompts loaded. Initialize to generate questions from your PDF.</p>
                                </div>
                            ) : !isComplete ? (
                                <>
                                    {/* Question */}
                                    <Card className="p-10 md:p-14 shadow-2xl border-none rounded-[2.5rem] overflow-hidden relative bg-white ring-1 ring-black/5">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500" />
                                        <div className="flex items-center gap-2 mb-6">
                                            <Target className="w-4 h-4 text-rose-500" />
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Question {currentIndex + 1}</span>
                                        </div>
                                        <div className="text-2xl md:text-4xl font-black leading-tight tracking-tight text-slate-900">
                                            {currentQ?.question}
                                        </div>
                                    </Card>

                                    {/* Hint (if available) */}
                                    {currentQ?.hint && (
                                        <div className="flex justify-center">
                                            {!isHintVisible ? (
                                                <Button variant="ghost" size="sm" onClick={() => setIsHintVisible(true)}
                                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-2 rounded-xl">
                                                    <Lightbulb className="w-4 h-4" /> Show Hint
                                                </Button>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2 animate-in fade-in duration-300 max-w-lg w-full">
                                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" weight="fill" />
                                                    <span>{currentQ.hint}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reveal / Rate */}
                                    {!isAnswerVisible ? (
                                        <button
                                            onClick={() => setIsAnswerVisible(true)}
                                            className="w-full h-[200px] border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:bg-rose-500/5 hover:border-rose-500/30 hover:text-rose-500 transition-all duration-500 group"
                                        >
                                            <div className="p-5 rounded-full bg-slate-50 group-hover:bg-rose-50 transition-colors">
                                                <Brain className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <span className="font-black text-xs uppercase tracking-[0.3em]">Tap to Reveal Answer</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl rounded-[2rem]">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-3">Answer / Key Point</p>
                                                <p className="text-lg leading-relaxed font-medium">{currentQ?.hint || "Reflect on what you know about this topic."}</p>
                                            </Card>

                                            <div className="flex gap-3">
                                                <Button variant="outline" size="lg"
                                                    className="flex-1 h-14 rounded-2xl border-rose-200 text-rose-700 font-black uppercase tracking-widest text-xs hover:bg-rose-50"
                                                    onClick={() => handleNext(false)}>
                                                    <X className="w-5 h-5 mr-2" weight="bold" /> Need Review
                                                </Button>
                                                <Button size="lg"
                                                    className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20"
                                                    onClick={() => handleNext(true)}>
                                                    <Check className="w-5 h-5 mr-2" weight="bold" /> Got It!
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Completion screen */
                                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-12 shadow-rose-600/30">
                                        <Sparkle className="w-12 h-12" weight="bold" />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tighter">Recall Complete!</h2>
                                        <p className="text-muted-foreground mt-2">You've tested yourself on all {prompts.length} prompts.</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                                        <div className="bg-card p-5 rounded-2xl border">
                                            <div className="text-3xl font-black text-rose-600">{accuracy}%</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Accuracy</div>
                                        </div>
                                        <div className="bg-card p-5 rounded-2xl border">
                                            <div className="text-3xl font-black text-green-600">{score.correct}</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Correct</div>
                                        </div>
                                        <div className="bg-card p-5 rounded-2xl border">
                                            <div className="text-3xl font-black text-slate-400">{score.total - score.correct}</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">To Review</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button size="lg" onClick={() => { setCurrentIndex(0); setScore({ correct: 0, total: 0 }); }}
                                            className="h-12 px-8 font-bold rounded-2xl gap-2">
                                            <ArrowCounterClockwise className="w-4 h-4" /> Try Again
                                        </Button>
                                        <Button size="lg" variant="outline" onClick={onBack} className="h-12 px-8 rounded-2xl">
                                            Done <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </StudySessionLayout>
    );
}
