import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { MagnifyingGlass, CaretRight, CheckCircle, BookOpen, Pen, Sparkle, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface SQ3RData {
    survey?: { headings?: string[]; key_terms?: string[] };
    questions?: string[];
    recite_points?: string[];
    review_summary?: string;
}

export function SQ3RMethod({ onBack, collectionId, studyData, bookTitle, pdfUrl, isFetchingPdf }: {
    onBack: () => void;
    collectionId: string;
    studyData: any;
    bookTitle?: string;
    pdfUrl?: string | null;
    isFetchingPdf?: boolean;
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
            <div className="flex h-full bg-background">
                {/* Stepper Sidebar */}
                <div className="w-64 border-r bg-muted/5 flex flex-col p-5 gap-4 shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Workflow</p>
                    <div className="space-y-1">
                        {STEPS.map((s, idx) => (
                            <div key={s.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                                idx === step ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-muted-foreground",
                                idx < step && "opacity-50"
                            )}>
                                <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                    idx === step ? "bg-white text-purple-600" : "bg-muted"
                                )}>
                                    {idx < step ? <CheckCircle className="w-4 h-4" weight="bold" /> : idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-sm font-bold">{s.label}</span>
                                    {idx === step && <p className="text-[10px] opacity-70 leading-tight mt-0.5">{s.desc}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1">
                        <div className="max-w-3xl mx-auto py-12 px-8 space-y-10">

                            {/* SURVEY */}
                            {step === 0 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-purple-500/5 border border-purple-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-purple-800 mb-1">📋 Cognitive Scan</p>
                                        <p className="text-xs text-purple-700/70">Scan the structure — don't read in detail yet.</p>
                                    </div>

                                    {headings.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Document Headings</p>
                                            <div className="space-y-2">
                                                {headings.map((h, i) => (
                                                    <div key={i} className="p-4 rounded-xl border bg-card hover:border-purple-300 transition-colors">
                                                        <h3 className="text-lg font-black">{h}</h3>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {keyTerms.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Key Terms</p>
                                            <div className="flex flex-wrap gap-2">
                                                {keyTerms.map((t, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs px-3 py-1 rounded-full font-semibold">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* QUESTION */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="bg-blue-500/5 border border-blue-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-blue-800 mb-1">❓ AI-Generated Questions</p>
                                        <p className="text-xs text-blue-700/70">These questions were generated from your PDF. Keep them in mind while reading.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {questions.length > 0 ? questions.map((q, i) => (
                                            <div key={i} className="p-4 rounded-xl border bg-card flex gap-3 items-start">
                                                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                <p className="text-sm font-medium leading-relaxed">{q}</p>
                                            </div>
                                        )) : <p className="text-sm text-muted-foreground italic">No questions generated.</p>}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Your Questions</p>
                                        <Textarea
                                            placeholder="Add your own questions here..."
                                            className="min-h-[120px] rounded-xl text-sm"
                                            value={userNotes[1] || ''}
                                            onChange={e => setUserNotes(p => ({ ...p, 1: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* READ */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in duration-700">
                                    <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-emerald-800 mb-1">📖 Active Reading</p>
                                        <p className="text-xs text-emerald-700/70">Read your uploaded document now. Focus on answering the questions from Step 2.</p>
                                    </div>
                                    <div className="p-8 rounded-2xl border bg-card text-center space-y-4">
                                        <BookOpen className="w-12 h-12 text-emerald-500 mx-auto opacity-60" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Open your PDF in the browser or refer to the source material.<br />
                                            <span className="text-xs">Read with purpose — hunt for answers to the questions above.</span>
                                        </p>
                                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">{bookTitle || 'Your Document'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Notes while reading</p>
                                        <Textarea
                                            placeholder="Jot down key answers and insights as you read..."
                                            className="min-h-[140px] rounded-xl text-sm"
                                            value={userNotes[2] || ''}
                                            onChange={e => setUserNotes(p => ({ ...p, 2: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* RECITE */}
                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="bg-orange-500/5 border border-orange-500/15 p-5 rounded-2xl">
                                        <p className="text-sm font-bold text-orange-800 mb-1">🧠 Mental Reconstruction</p>
                                        <p className="text-xs text-orange-700/70">Without peeking — write what you remember about each key point.</p>
                                    </div>
                                    <div className="space-y-6">
                                        {recitePoints.length > 0 ? recitePoints.map((point, i) => (
                                            <div key={i} className="space-y-2">
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{i + 1}. {point}</p>
                                                <Textarea
                                                    placeholder="Write what you remember about this..."
                                                    className="min-h-[100px] rounded-xl text-sm bg-muted/20 border-dashed"
                                                    value={userNotes[300 + i] || ''}
                                                    onChange={e => setUserNotes(p => ({ ...p, [300 + i]: e.target.value }))}
                                                />
                                            </div>
                                        )) : (
                                            <Textarea
                                                placeholder="Summarize the entire material from memory..."
                                                className="min-h-[200px] rounded-xl text-sm"
                                                value={userNotes[3] || ''}
                                                onChange={e => setUserNotes(p => ({ ...p, 3: e.target.value }))}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* REVIEW */}
                            {step === 4 && (
                                <div className="space-y-8 animate-in zoom-in duration-500 text-center">
                                    <div className="w-20 h-20 bg-purple-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-purple-600/30">
                                        <CheckCircle className="w-10 h-10" weight="bold" />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tighter">Session Complete!</h2>
                                        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">You've completed the SQ3R cycle. Here's the AI review summary:</p>
                                    </div>
                                    {reviewSummary && (
                                        <div className="text-left p-6 rounded-2xl bg-card border shadow-sm max-w-2xl mx-auto">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-3">AI Review Summary</p>
                                            <p className="text-sm leading-relaxed text-muted-foreground">{reviewSummary}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                        <div className="bg-card p-6 rounded-2xl border">
                                            <div className="text-3xl font-black text-purple-600">{questions.length}</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Questions Answered</div>
                                        </div>
                                        <div className="bg-card p-6 rounded-2xl border">
                                            <div className="text-3xl font-black text-purple-600">{recitePoints.length}</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Points Recalled</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-6 border-t bg-background/80 backdrop-blur-xl flex justify-between items-center">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Step {step + 1} of 5 · {Math.round((step / 4) * 100)}% complete
                        </div>
                        <div className="flex gap-3">
                            {step > 0 && step < 4 && (
                                <Button variant="ghost" onClick={() => setStep((step - 1) as any)} className="rounded-xl px-5">
                                    Previous
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                className="gap-2 rounded-xl px-7 h-11 font-bold shadow-lg shadow-purple-600/20 bg-purple-600 hover:bg-purple-700"
                            >
                                {step < 4 ? `Next: ${STEPS[step + 1].label}` : 'Finish Session'}
                                <CaretRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </StudySessionLayout>
    );
}
