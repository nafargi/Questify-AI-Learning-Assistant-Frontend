import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendUp,
    Clock,
    Target,
    ArrowRight,
    Brain,
    CheckCircle,
    XCircle,
    Info
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface WeakPointAnalysisViewProps {
    results: any;
    questions: any[];
    answers: any;
}

export function WeakPointAnalysisView({ results, questions, answers }: WeakPointAnalysisViewProps) {
    const navigate = useNavigate();
    
    // Extract scores based on exact backend spec
    const totalScore = typeof results?.total_score === 'number' ? results.total_score : 0;
    const maxScore = typeof results?.max_score === 'number' ? results.max_score : 0;
    const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const status = results?.status || "graded";

    // Graded items from spec
    const gradedItems = Array.isArray(results?.graded_items) ? results.graded_items : [];

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <Brain className="w-16 h-16 text-muted-foreground/20 mb-4 animate-pulse" />
                <h2 className="text-xl font-bold">No results available</h2>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2">We couldn't find the assessment results. Please try again or contact support.</p>
                <Button onClick={() => window.location.reload()} className="mt-6 rounded-full">Retry</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/50 p-4 md:p-8 animate-in fade-in duration-700">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* 1. Header & Summary Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 border-border/50 glass-card overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Brain className="w-6 h-6" weight="fill" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black tracking-tight uppercase">Assessment Insights</h1>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Status: {status}</p>
                                </div>
                            </div>
                            <p className="text-base text-foreground/80 leading-relaxed font-medium bg-muted/30 p-4 rounded-2xl border border-border/50 italic">
                                "{results?.feedback || results?.message || "Your cognitive session has been processed. Excellent work on completing the assessment!"}"
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={cn(
                        "flex flex-col items-center justify-center p-8 border-none text-white relative overflow-hidden group",
                        scorePercentage >= 70 ? "bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700" : "bg-gradient-to-br from-primary via-primary/90 to-primary/80"
                    )}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Efficiency Rating</span>
                        <div className="text-6xl font-black tabular-nums">
                            {Math.round(totalScore)}<span className="text-2xl opacity-60">/{maxScore}</span>
                        </div>
                        <div className="text-sm font-black opacity-90 mt-2 bg-white/20 px-4 py-1 rounded-full backdrop-blur-md">
                            {Math.round(scorePercentage)}% Accuracy
                        </div>
                    </Card>
                </div>

                {/* 2. Detailed Performance Log */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-primary rounded-full" />
                            <h2 className="text-2xl font-black tracking-tight uppercase">Detailed Performance Log</h2>
                        </div>
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full font-black border-primary/20 bg-primary/5 text-primary">
                            {gradedItems.length} Items Evaluated
                        </Badge>
                    </div>

                    <div className="grid gap-4">
                        {gradedItems.map((item: any, index: number) => {
                            const question = questions.find(q => q.question_id === item.question_id);
                            const isCorrect = item.is_correct === true;
                            const scoreAttained = item.score_attained ?? 0;

                            return (
                                <Card key={item.question_id || index} className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 glass-card">
                                    <div className="flex flex-col md:flex-row">
                                        <div className={cn(
                                            "w-2 md:w-3 shrink-0 transition-colors duration-500",
                                            isCorrect ? "bg-green-500" : scoreAttained > 0 ? "bg-amber-500" : "bg-red-500"
                                        )} />
                                        <CardContent className="p-6 md:p-8 flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                <div className="flex items-center gap-4">
                                                    <Badge variant="outline" className="h-7 px-4 font-black uppercase tracking-[0.2em] text-[10px] rounded-lg bg-muted/50 border-none">
                                                        Item #{index + 1}
                                                    </Badge>
                                                    {isCorrect ? (
                                                        <span className="flex items-center gap-2 text-green-600 text-[11px] font-black uppercase tracking-widest">
                                                            <CheckCircle className="w-5 h-5" weight="fill" />
                                                            Mastered
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest",
                                                            scoreAttained > 0 ? "text-amber-500" : "text-red-500"
                                                        )}>
                                                            <XCircle className="w-5 h-5" weight="fill" />
                                                            {scoreAttained > 0 ? "Developing" : "Needs Work"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-xl">
                                                    Weight: <span className="text-foreground">{Math.round(scoreAttained)}</span> <span className="opacity-30">pts</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                                                    {question?.question || "Question content unavailable"}
                                                </h3>
                                                
                                                <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 text-sm text-muted-foreground leading-relaxed relative overflow-hidden">
                                                    <div className="flex gap-3 relative z-10">
                                                        <Info className="w-5 h-5 shrink-0 text-primary mt-0.5" weight="bold" />
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">AI Feedback</p>
                                                            <p className="italic font-medium">{item.feedback_note || "No specific feedback provided for this item."}</p>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-20">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-2xl py-8 font-black uppercase tracking-widest text-xs border-primary/20 hover:bg-primary/5 transition-all hover:scale-[1.02] active:scale-95"
                        onClick={() => window.location.reload()}
                    >
                        New Assessment
                    </Button>
                    <Button
                        className="flex-1 rounded-2xl py-8 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95"
                        onClick={() => navigate('/study-room')}
                    >
                        Back to Study Room
                        <ArrowRight className="ml-3 w-5 h-5" weight="bold" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
