import React, { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    CaretRight,
    CaretLeft,
    PaperPlaneTilt,
    Brain,
    List,
    Warning,
    Target,
    CircleNotch
} from '@phosphor-icons/react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import { QuestionRenderer } from '../components/exam/QuestionRenderer';
import { WeakPointAnalysisView } from '../components/exam/WeakPointAnalysisView';
import { useIsMobile } from "@/hooks/use-mobile";

interface ExamRoomProps {
    questions: any[];
    answers: Record<string, any>;
    onAnswer: (id: string, value: any) => void;
    timeLeft: number;
    isFinished: boolean;
    onFinish: () => void;
    results: any;
    onReset: () => void;
}

export default function ExamRoom({
    questions = [],
    answers = {},
    onAnswer,
    timeLeft,
    isFinished,
    onFinish,
    results,
    onReset
}: ExamRoomProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const isMobile = useIsMobile();

    // Reset index if questions change (safety)
    useEffect(() => {
        setCurrentIndex(0);
    }, [questions.length]);

    if (isFinished && results) {
        return <WeakPointAnalysisView results={results} questions={questions} answers={answers} />;
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions && questions.length > 0 ? questions[currentIndex] : null;
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions ? questions.length : 0;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    const isLastQuestion = totalQuestions > 0 ? currentIndex === totalQuestions - 1 : true;

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (!currentQuestion && !isFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
                <CircleNotch className="w-12 h-12 text-primary animate-spin mb-4" weight="bold" />
                <h2 className="text-xl font-bold">Synchronizing Questions...</h2>
                <p className="text-muted-foreground mt-2">Questy AI is preparing your assessment environment.</p>
                <Button onClick={onReset} variant="ghost" className="mt-8">Abort Session</Button>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen flex text-foreground antialiased selection:bg-primary/20">
            {/* LEFT SIDEBAR: Question Navigator */}
            {!isMobile && (
                <div className="w-72 border-r bg-muted/5 flex flex-col sticky top-0 h-screen overflow-hidden shrink-0 border-border/50">
                    <div className="p-6 border-b bg-background">
                        <div className="flex items-center gap-2 text-primary mb-4">
                            <Brain className="w-6 h-6" weight="fill" />
                            <h2 className="font-black tracking-tight text-lg">Exam Engine</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span>Progress</span>
                                <span>{answeredCount}/{totalQuestions}</span>
                            </div>
                            <Progress value={progressPercent} className="h-1.5" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-4 gap-2">
                            {questions.map((q, i) => (
                                <button
                                    key={q.question_id || i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "aspect-square rounded-xl text-xs font-bold transition-all flex items-center justify-center border",
                                        currentIndex === i 
                                            ? "ring-2 ring-primary border-primary bg-primary/10 text-primary" 
                                            : answers[q.question_id]
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t bg-background mt-auto space-y-3">
                         <div className={cn(
                            "flex items-center justify-between p-3 rounded-xl border tabular-nums",
                            timeLeft < 60 ? "border-destructive text-destructive bg-destructive/5 animate-pulse" : "bg-muted/30 border-transparent"
                        )}>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                                <Clock className="w-4 h-4" /> Time Left
                            </div>
                            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                        </div>
                        <Button 
                            className="w-full rounded-xl font-bold h-12 shadow-none" 
                            onClick={onFinish}
                            disabled={answeredCount === 0}
                        >
                            Finish & Submit
                        </Button>
                    </div>
                </div>
            )}

            {/* RIGHT CONTENT: Question Area */}
            <main className="flex-1 flex flex-col bg-muted/5 overflow-y-auto h-screen relative">
                {isMobile && (
                    <div className="bg-background border-b p-4 sticky top-0 z-20 flex items-center justify-between shadow-none">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Left</span>
                            <span className={cn("text-sm font-black tabular-nums", timeLeft < 60 && "text-destructive")}>{formatTime(timeLeft)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-full font-bold">{currentIndex + 1} / {totalQuestions}</Badge>
                            <Button size="sm" className="rounded-full shadow-none h-8" onClick={onFinish}>Submit</Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12">
                    <div className="w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Phase {currentIndex + 1}</span>
                                <Badge variant="outline" className="rounded-full text-[9px] uppercase font-bold px-3 border-primary/20 text-primary">
                                    {currentQuestion?.question_type || 'Loading...'}
                                </Badge>
                            </div>
                            {currentQuestion && answers[currentQuestion.question_id] && (
                                <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle weight="fill" className="w-4 h-4" /> Saved
                                </div>
                            )}
                        </div>

                        <Card className="rounded-[2.5rem] border-none shadow-none bg-background overflow-hidden ring-1 ring-border/50 relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20" />
                            <CardContent className="p-8 md:p-16">
                                {currentQuestion && (
                                    <QuestionRenderer
                                        question={currentQuestion}
                                        value={answers[currentQuestion.question_id]}
                                        onChange={(val) => onAnswer(currentQuestion.question_id, val)}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between gap-6 pt-4">
                            <Button
                                variant="ghost"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="rounded-2xl h-14 px-10 font-bold gap-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <CaretLeft weight="bold" />
                                Previous
                            </Button>

                            {!isLastQuestion ? (
                                <Button
                                    onClick={handleNext}
                                    className="rounded-2xl h-14 px-12 font-bold gap-2 shadow-none"
                                >
                                    Next Phase
                                    <CaretRight weight="bold" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={onFinish}
                                    className="rounded-2xl h-14 px-12 font-bold gap-2 bg-green-600 hover:bg-green-700 shadow-none text-white"
                                >
                                    <PaperPlaneTilt weight="fill" />
                                    Submit Final
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
