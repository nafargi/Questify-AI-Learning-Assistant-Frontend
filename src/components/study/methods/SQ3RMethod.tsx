import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { MagnifyingGlass, CaretRight, CheckCircle, BookOpen, Pen, Sparkle, CircleNotch, ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";

interface SQ3RData {
    survey?: { headings?: string[]; key_terms?: string[] };
    questions?: string[];
    recite_points?: string[];
    review_summary?: string;
}

export function SQ3RMethod({ onBack, collectionId, studyData }: {
    onBack: () => void;
    collectionId: string;
    studyData: any;
}) {
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [data, setData] = useState<SQ3RData>({});
    const [userNotes, setUserNotes] = useState<Record<number, string>>({});

    const STEPS = [
        { id: 'survey', label: 'Survey', icon: MagnifyingGlass, color: 'purple', desc: "Scan headings and key terms to map the territory." },
        { id: 'question', label: 'Question', icon: Pen, color: 'blue', desc: "AI has pre-formed questions. Add your own." },
        { id: 'read', label: 'Read', icon: BookOpen, color: 'emerald', desc: "Read with the questions in mind." },
        { id: 'recite', label: 'Recite', icon: Sparkle, color: 'orange', desc: "Write what you remember — no peeking." },
        { id: 'review', label: 'Review', icon: CheckCircle, color: 'purple', desc: "Check your understanding against the key points." },
    ];

    useEffect(() => {
        if (studyData) setData(studyData as SQ3RData);
    }, [studyData]);

    const handleNext = () => {
        if (step >= 4) { onBack(); return; }
        setStep((step + 1) as any);
    };

    if (!data || Object.keys(data).length === 0) return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <CircleNotch className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Preparing SQ3R Session...</p>
        </div>
    );

    const headings = data.survey?.headings || [];
    const keyTerms = data.survey?.key_terms || [];
    const questions = data.questions || [];
    const recitePoints = data.recite_points || [];
    const reviewSummary = data.review_summary || "";

    return (
        <StudySessionLayout
            title="SQ3R Deep Reading"
            subtitle={STEPS[step].label + " Phase"}
            icon={STEPS[step].icon}
            color="text-purple-500"
            onExit={onBack}
        >
            <div className="flex h-full bg-background overflow-hidden">
                {/* MIDDLE: Stepper Sidebar */}
                <div className="w-60 border-r bg-muted/5 flex flex-col p-4 gap-4 shrink-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Workflow</p>
                    <div className="space-y-1">
                        {STEPS.map((s, idx) => (
                            <div key={s.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer",
                                idx === step ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-muted-foreground hover:bg-muted/50",
                                idx < step && "opacity-60"
                            )} onClick={() => setStep(idx as any)}>
                                <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                    idx === step ? "bg-white text-purple-600" : "bg-muted"
                                )}>
                                    {idx < step ? <CheckCircle className="w-4 h-4" weight="bold" /> : idx + 1}
                                </div>
                                <span className="text-xs font-bold truncate">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <ScrollArea className="flex-1">
                        <div className="max-w-2xl mx-auto py-10 px-6 space-y-10">
                            {/* SURVEY */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-purple-500/5 border border-purple-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-purple-800 mb-1">📋 Cognitive Scan</p>
                                        <p className="text-xs text-purple-700/70">Scan the structure — don't read in detail yet.</p>
                                    </div>
                                    {headings.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Headings</p>
                                            {headings.map((h, i) => (
                                                <div key={i} className="p-4 rounded-xl border bg-card hover:border-purple-300 transition-colors">
                                                    <h3 className="text-sm font-bold">{h}</h3>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* QUESTION */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="bg-blue-500/5 border border-blue-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-blue-800 mb-1">❓ AI Questions</p>
                                        <p className="text-xs text-blue-700/70">Keep these in mind while reading the source material.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {questions.map((q, i) => (
                                            <div key={i} className="p-4 rounded-xl border bg-card flex gap-3 items-start shadow-sm">
                                                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                <p className="text-sm font-medium leading-relaxed">{q}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* READ */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in duration-700">
                                    <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-2xl text-center">
                                        <BookOpen className="w-10 h-10 text-emerald-500 mx-auto mb-3" weight="fill" />
                                        <p className="text-sm font-bold text-emerald-800 mb-1">📖 Deep Reading Phase</p>
                                        <p className="text-xs text-emerald-700/70">Focus on the PDF on the left. Find answers to the questions.</p>
                                    </div>
                                    <Textarea
                                        placeholder="Type key insights here as you find them in the text..."
                                        className="min-h-[250px] rounded-[2rem] p-6 text-sm bg-muted/20 border-dashed border-2"
                                        value={userNotes[2] || ''}
                                        onChange={e => setUserNotes(p => ({ ...p, 2: e.target.value }))}
                                    />
                                </div>
                            )}

                            {/* RECITE */}
                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="bg-orange-500/5 border border-orange-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-orange-800 mb-1">🧠 Recall Phase</p>
                                        <p className="text-xs text-orange-700/70">Summarize each point from memory.</p>
                                    </div>
                                    <div className="space-y-6">
                                        {recitePoints.map((point, i) => (
                                            <div key={i} className="space-y-2">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{i + 1}. {point}</p>
                                                <Textarea
                                                    placeholder="Recite from memory..."
                                                    className="min-h-[100px] rounded-2xl text-sm"
                                                    value={userNotes[300 + i] || ''}
                                                    onChange={e => setUserNotes(p => ({ ...p, [300 + i]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* REVIEW */}
                            {step === 4 && (
                                <div className="space-y-8 animate-in zoom-in duration-500 text-center py-6">
                                    <div className="w-20 h-20 bg-purple-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-purple-600/30">
                                        <CheckCircle className="w-10 h-10" weight="bold" />
                                    </div>
                                    <h2 className="text-3xl font-black">Cycle Complete</h2>
                                    {reviewSummary && (
                                        <Card className="text-left p-6 rounded-[2rem] bg-slate-900 text-white border-none shadow-xl">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-3">AI Synthesis</p>
                                            <p className="text-sm leading-relaxed">{reviewSummary}</p>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-6 border-t bg-background/80 backdrop-blur-xl flex justify-between items-center shrink-0">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Phase {step + 1} of 5 · {Math.round((step / 4) * 100)}%
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleNext}
                                className="gap-2 rounded-xl px-8 h-12 font-bold shadow-lg shadow-purple-600/20 bg-purple-600 hover:bg-purple-700"
                            >
                                {step < 4 ? `Continue to ${STEPS[step + 1].label}` : 'Finish Session'}
                                <CaretRight className="w-4 h-4" weight="bold" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </StudySessionLayout>
    );
}
