import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { Timer, Play, Pause, ArrowCounterClockwise, CheckCircle, Circle, Info } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PDFViewer } from "@/components/study/PDFViewer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/services/api";
import { toast } from "sonner";

type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'BREAK';

interface PomodoroSession {
    session_number: number;
    task: string;
    duration_minutes: number;
    break_minutes: number;
}

interface PomodoroMethodProps {
    bookTitle?: string;
    pdfUrl?: string | null;
    isFetchingPdf?: boolean;
    collectionId?: string;
    studyData: any;
    onBack: () => void;
}

export function PomodoroMethod({ bookTitle, pdfUrl, isFetchingPdf, collectionId, studyData, onBack }: PomodoroMethodProps) {
    const [sessions, setSessions] = useState<PomodoroSession[]>([]);
    const [currentSessionIdx, setCurrentSessionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [timerState, setTimerState] = useState<TimerState>('IDLE');
    const [completedSessions, setCompletedSessions] = useState<number[]>([]);

    // Initialize from actual API data
    useEffect(() => {
        if (studyData?.sessions && Array.isArray(studyData.sessions)) {
            setSessions(studyData.sessions);
            const first = studyData.sessions[0];
            if (first) setTimeLeft((first.duration_minutes || 25) * 60);
        }
    }, [studyData]);

    // Timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerState === 'RUNNING' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && timerState === 'RUNNING') {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [timerState, timeLeft]);

    const currentSession = sessions[currentSessionIdx];
    const totalDuration = (currentSession?.duration_minutes || 25) * 60;

    const handleTimerComplete = async () => {
        if (timerState === 'RUNNING') {
            setCompletedSessions(p => [...p, currentSessionIdx]);
            setTimerState('BREAK');
            const breakSecs = (currentSession?.break_minutes || 5) * 60;
            setTimeLeft(breakSecs);
            new Audio('/sounds/bell.mp3').play().catch(() => {});
            if (collectionId) {
                try {
                    await api.recordPomodoro({ collection_id: collectionId, duration: currentSession?.duration_minutes || 25, completed: true });
                    toast.success("Session recorded!");
                } catch { /* non-blocking */ }
            }
        } else {
            // Break done — move to next session
            const next = currentSessionIdx + 1;
            if (next < sessions.length) {
                setCurrentSessionIdx(next);
                setTimeLeft((sessions[next].duration_minutes || 25) * 60);
            } else {
                setTimeLeft((currentSession?.duration_minutes || 25) * 60);
            }
            setTimerState('IDLE');
        }
    };

    const handleSessionClick = (idx: number) => {
        if (timerState === 'RUNNING') return;
        setCurrentSessionIdx(idx);
        setTimeLeft((sessions[idx].duration_minutes || 25) * 60);
        setTimerState('IDLE');
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const progressValue = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

    return (
        <StudySessionLayout
            title="Pomodoro Focus"
            subtitle={bookTitle}
            icon={Timer}
            color="text-orange-500"
            onExit={onBack}
            rightAction={
                <Badge variant={timerState === 'RUNNING' ? "destructive" : "secondary"} className="rounded-full px-3">
                    {timerState === 'RUNNING' ? '🔴 FOCUS' : timerState === 'BREAK' ? '☕ BREAK' : '⏸ IDLE'}
                </Badge>
            }
        >
            <div className="flex h-full">
                {/* LEFT: PDF */}
                <div className="flex-1 border-r overflow-hidden">
                    {isFetchingPdf ? (
                        <div className="flex items-center justify-center h-full gap-3 text-muted-foreground flex-col">
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span className="text-xs font-medium">Loading document...</span>
                        </div>
                    ) : (
                        <div className={cn("h-full w-full transition-all duration-700", timerState === 'BREAK' && "blur-xl grayscale opacity-30")}>
                            <PDFViewer pdfUrl={pdfUrl} title={bookTitle} />
                        </div>
                    )}
                </div>

                {/* RIGHT: Timer + Sessions */}
                <div className="w-80 flex flex-col bg-card/50 backdrop-blur-sm p-6 gap-6 overflow-hidden">
                    {/* Timer ring */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="96" cy="96" r="88" className="stroke-muted" strokeWidth="8" fill="none" />
                                <circle
                                    cx="96" cy="96" r="88"
                                    className={cn("transition-all duration-1000", timerState === 'BREAK' ? "stroke-green-500" : "stroke-orange-500")}
                                    strokeWidth="8" fill="none"
                                    strokeDasharray={2 * Math.PI * 88}
                                    strokeDashoffset={2 * Math.PI * 88 * (1 - progressValue / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-mono font-black">{formatTime(timeLeft)}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                                    {timerState === 'BREAK' ? 'Break' : timerState === 'IDLE' ? 'Ready' : 'Focus'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full">
                            <Button
                                size="lg"
                                className={cn("flex-1 h-11 rounded-xl font-bold", timerState === 'RUNNING' ? "bg-destructive hover:bg-destructive/90" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 shadow-lg")}
                                onClick={() => setTimerState(p => p === 'RUNNING' ? 'PAUSED' : 'RUNNING')}
                            >
                                {timerState === 'RUNNING' ? <Pause className="w-4 h-4 mr-2" weight="fill" /> : <Play className="w-4 h-4 mr-2" weight="fill" />}
                                {timerState === 'RUNNING' ? 'Pause' : 'Start'}
                            </Button>
                            <Button size="icon" variant="outline" className="h-11 w-11 rounded-xl"
                                onClick={() => { setTimerState('IDLE'); setTimeLeft((currentSession?.duration_minutes || 25) * 60); }}>
                                <ArrowCounterClockwise className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* AI-generated session tasks */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <Info className="w-3 h-3" /> AI Study Plan
                        </p>
                        {sessions.length === 0 ? (
                            <div className="text-xs text-muted-foreground/60 text-center py-8 border border-dashed rounded-2xl italic">
                                No sessions generated yet. Initialize to create your study plan.
                            </div>
                        ) : (
                            <ScrollArea className="flex-1">
                                <div className="space-y-2 pr-2">
                                    {sessions.map((s, idx) => {
                                        const done = completedSessions.includes(idx);
                                        const active = idx === currentSessionIdx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSessionClick(idx)}
                                                disabled={timerState === 'RUNNING'}
                                                className={cn(
                                                    "w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-start gap-3",
                                                    active && "border-orange-500/50 bg-orange-500/5",
                                                    done && "opacity-50",
                                                    !active && !done && "hover:border-primary/30 hover:bg-muted/30"
                                                )}
                                            >
                                                {done
                                                    ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" weight="fill" />
                                                    : <Circle className={cn("w-4 h-4 mt-0.5 shrink-0", active ? "text-orange-500" : "text-muted-foreground/30")} weight={active ? "fill" : "regular"} />
                                                }
                                                <div className="min-w-0">
                                                    <p className={cn("text-xs font-bold truncate", active && "text-orange-600")}>{s.task}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.duration_minutes}m focus · {s.break_minutes}m break</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Overall progress */}
                    {sessions.length > 0 && (
                        <div className="space-y-1.5 shrink-0">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                <span>Progress</span>
                                <span>{completedSessions.length}/{sessions.length} sessions</span>
                            </div>
                            <Progress value={(completedSessions.length / sessions.length) * 100} className="h-1.5" />
                        </div>
                    )}
                </div>
            </div>
        </StudySessionLayout>
    );
}
