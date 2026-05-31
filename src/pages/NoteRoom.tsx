import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
    CaretLeft,
    ShareNetwork,
    Download,
    Layout,
    CircleNotch,
    Sparkle,
    ArrowsClockwise
} from "@phosphor-icons/react";
import { noteMethods } from '@/data/mockData';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { noteService } from '@/services/noteService';

// Import supported renderers
import { CornellNote } from '@/components/notes/CornellNote';
import { OutlineNote } from '@/components/notes/OutlineNote';
import { MindMapNote } from '@/components/notes/MindMapNote';
import { ChartingNote } from '@/components/notes/ChartingNote';
import { BoxingNote } from '@/components/notes/BoxingNote';
import { SentenceNote } from '@/components/notes/SentenceNote';
import { NoteContent } from '@/data/mockNotes';

function toNoteContent(raw: any, methodId: string): NoteContent {
  const base = {
    id: raw.note_id ?? raw.id ?? "",
    courseId: raw.collection_id ?? "",
    title: raw.title ?? "Untitled",
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "",
    method: methodId as NoteContent["method"],
  };
  switch (methodId) {
    case "cornell": return { ...base, cues: raw.cues ?? [], summary: raw.summary ?? "" };
    case "outline": return { ...base, sections: (raw.sections ?? []).map((s: any) => ({ heading: s.heading, level: 1 as const, content: "", bullets: s.bullets ?? [] })) };
    case "mindmap": return {
      ...base, center: raw.root?.label ?? "",
      branches: (raw.root?.children ?? []).map((c: any, i: number) => {
        const colors = ["bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800","bg-blue-100 dark:bg-blue-900/30 text-blue-800","bg-purple-100 dark:bg-purple-900/30 text-purple-800","bg-orange-100 dark:bg-orange-900/30 text-orange-800"];
        return { title: c.label, color: colors[i % colors.length], items: (c.children ?? []).map((cc: any) => cc.label) };
      }),
    };
    case "boxing": return { ...base, boxes: (raw.boxes ?? []).map((b: any) => ({ title: b.title, color: "border-primary bg-primary/5", items: b.items ?? [] })) };
    case "charting": return { ...base, headers: raw.columns ?? [], rows: raw.rows ?? [] };
    case "sentence": return { ...base, sections: (raw.sections ?? []).map((s: any) => ({ content: s.content })) };
    default: return base as NoteContent;
  }
}

interface NoteRoomProps {
    topic: any;
    initialMethod: string;
    onClose: () => void;
    onRegenerate?: (method: string) => Promise<void>;
}

const supportedMethodIds = ['sentence', 'boxing', 'cornell', 'outline', 'mindmap', 'charting'];
const filteredMethods = noteMethods.filter(m => supportedMethodIds.includes(m.id));

export default function NoteRoom({ topic, initialMethod, onClose, onRegenerate }: NoteRoomProps) {
    const [currentMethod, setCurrentMethod] = useState(initialMethod);
    const [activeContent, setActiveContent] = useState<any>(topic[initialMethod] || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    // Seed history with the freshly passed content — no stale cache for the initial method
    const [history, setHistory] = useState<Record<string, any>>({ [initialMethod]: topic[initialMethod] || null });

    const currentMethodInfo = filteredMethods.find(m => m.id === currentMethod);

    const fetchOtherMethod = useCallback(async (method: string) => {
        if (!topic.collectionId) return;

        // Use cached content only if it's non-null (null means not yet generated)
        if (history[method] != null) {
            setActiveContent(history[method]);
            return;
        }

        setIsLoading(true);
        try {
            console.log(`[NoteRoom] Fetching ${method} for collection ${topic.collectionId}`);
            const notes = await noteService.getNotes(method, topic.collectionId);
            const raw = notes && notes.length > 0 ? notes[0] : null;
            const content = raw ? toNoteContent(raw, method) : null;

            setHistory(prev => ({ ...prev, [method]: content }));
            setActiveContent(content);
        } catch (error) {
            console.error(`[NoteRoom] Failed to fetch ${method} notes:`, error);
            setActiveContent(null);
        } finally {
            setIsLoading(false);
        }
    }, [topic.collectionId, history]);

    useEffect(() => {
        if (currentMethod !== initialMethod || !activeContent) {
            fetchOtherMethod(currentMethod);
        }
    }, [currentMethod]);

    const handleRegenerate = async () => {
        if (!onRegenerate) return;
        setIsRegenerating(true);
        try {
            await onRegenerate(currentMethod);
            // Clear cache so fetchOtherMethod fetches fresh content
            setHistory(prev => { const next = { ...prev }; delete next[currentMethod]; return next; });
            await fetchOtherMethod(currentMethod);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleDownload = () => {
        if (!activeContent) {
            toast.error("No content to download");
            return;
        }

        try {
            const doc = new jsPDF();
            const title = topic.title || "Study Note";
            const method = currentMethodInfo?.name || currentMethod;

            // Header
            doc.setFontSize(20);
            doc.text(title, 10, 20);
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(`Method: ${method}`, 10, 30);
            doc.text(`Generated by Questify AI on ${new Date().toLocaleDateString()}`, 10, 35);

            doc.setLineWidth(0.5);
            doc.line(10, 40, 200, 40);

            // Content
            doc.setTextColor(0);
            doc.setFontSize(11);
            const textContent = typeof activeContent === 'string'
                ? activeContent
                : JSON.stringify(activeContent, null, 2);

            const splitText = doc.splitTextToSize(textContent, 180);
            doc.text(splitText, 10, 50);

            doc.save(`${title.replace(/\s+/g, '_')}_${currentMethod}.pdf`);
            toast.success("Note downloaded as PDF");
        } catch (err) {
            console.error("PDF Export failed:", err);
            toast.error("Failed to generate PDF");
        }
    };

    const handleShare = () => {
        const shareLink = `${window.location.origin}/note/${topic.id || topic.note_id}`;
        navigator.clipboard.writeText(shareLink);
        toast.success("Link copied to clipboard");
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4 opacity-50">
                    <CircleNotch className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-medium">AI is retrieving your {currentMethodInfo?.name}...</p>
                </div>
            );
        }

        if (!activeContent) {
            return (
                <div className="p-20 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/40">
                        <Sparkle className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">No {currentMethodInfo?.name} Note Yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            We couldn't find a note using this specific cognitive method for this topic.
                            You can generate one by clicking <span className="font-bold text-primary">Generate New</span> in the main dashboard.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-xl px-8" onClick={onClose}>
                        Return to Hub
                    </Button>
                </div>
            );
        }

        switch (currentMethod) {
            case 'sentence': return <SentenceNote content={activeContent} />;
            case 'boxing': return <BoxingNote content={activeContent} />;
            case 'outline': return <OutlineNote content={activeContent} />;
            case 'mindmap': return <MindMapNote content={activeContent} />;
            case 'cornell': return <CornellNote content={activeContent} />;
            case 'charting': return <ChartingNote content={activeContent} />;
            default: return (
                <div className="p-10 bg-muted/30 rounded-3xl border">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                        {typeof activeContent === 'string' ? activeContent : JSON.stringify(activeContent, null, 2)}
                    </pre>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground animate-fade-in flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-4 lg:px-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                        <CaretLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors" onClick={onClose}>
                                <Layout className="w-3 h-3" /> Hub
                            </span>
                            <span className="opacity-50">/</span>
                            <span className="text-foreground font-bold">{topic.courseId.toUpperCase()}</span>
                        </div>
                        <h1 className="text-sm font-bold leading-tight truncate max-w-[200px] lg:max-w-md">
                            {topic.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-8 px-3 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                                <span className="text-lg">{currentMethodInfo?.icon}</span>
                                <span className="font-bold">{currentMethodInfo?.name}</span>
                                <CaretLeft className="w-3 h-3 rotate-270 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-primary/10">
                            {filteredMethods.map(m => (
                                <DropdownMenuItem
                                    key={m.id}
                                    onClick={() => setCurrentMethod(m.id)}
                                    className={cn(
                                        "gap-2 rounded-lg m-1",
                                        currentMethod === m.id && "bg-primary/10 text-primary font-bold"
                                    )}
                                >
                                    <span className="text-lg">{m.icon}</span>
                                    {m.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

                    {onRegenerate && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-primary/10"
                            onClick={handleRegenerate}
                            disabled={isRegenerating || isLoading}
                            title="Regenerate note"
                        >
                            <ArrowsClockwise className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" onClick={handleDownload} title="Download as PDF">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" onClick={handleShare} title="Copy Share Link">
                        <ShareNetwork className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Note Content Container */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-dot-pattern">
                <div className="max-w-5xl mx-auto py-8 px-4 lg:px-0">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}