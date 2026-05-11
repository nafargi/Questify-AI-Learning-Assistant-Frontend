import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { Stack, ArrowCounterClockwise, Check, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { api } from "@/services/api";
import { toast } from "sonner";

interface LeitnerCard { question: string; answer: string; box: number; idx: string; }

export function LeitnerSystem({
    onBack,
    collectionId,
    studyData,
    bookTitle,
    pdfUrl,
    isFetchingPdf,
}: {
    onBack: () => void;
    collectionId: string;
    studyData: any;
    bookTitle?: string;
    pdfUrl?: string | null;
    isFetchingPdf?: boolean;
}) {
    const [cards, setCards] = useState<LeitnerCard[]>([]);
    const [currentBox, setCurrentBox] = useState<number>(1);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Initialize from actual API data: boxes[].box_number, boxes[].cards[].{question,answer}
    useEffect(() => {
        if (studyData?.boxes && Array.isArray(studyData.boxes)) {
            const flat: LeitnerCard[] = [];
            studyData.boxes.forEach((box: any) => {
                const boxNum = box.box_number ?? 1;
                if (Array.isArray(box.cards)) {
                    box.cards.forEach((card: any, cardIdx: number) => {
                        flat.push({
                            question: card.question,
                            answer: card.answer,
                            box: boxNum,
                            idx: `${boxNum}-${cardIdx}`,
                        });
                    });
                }
            });
            setCards(flat);
        }
    }, [studyData]);

    const boxCards = cards.filter(c => c.box === currentBox);
    const activeCard = boxCards[activeCardIndex];
    const isSessionComplete = activeCardIndex >= boxCards.length;

    const handleRate = async (correct: boolean) => {
        if (!activeCard) return;
        const newBox = correct ? Math.min(activeCard.box + 1, 5) : 1;
        setCards(prev => prev.map(c =>
            c.idx === activeCard.idx ? { ...c, box: newBox } : c
        ));

        // Sync with backend
        if (collectionId) {
            try {
                await api.updateLeitnerProgress({
                    collection_id: collectionId,
                    card_id: activeCard.idx,
                    success: correct,
                });
            } catch { /* non-blocking */ }
        }

        setIsFlipped(false);
        setTimeout(() => setActiveCardIndex(p => p + 1), 150);
    };

    const getBoxCount = (b: number) => cards.filter(c => c.box === b).length;
    const progressValue = boxCards.length === 0 ? 0 : (activeCardIndex / boxCards.length) * 100;

    // Available boxes (those that have cards)
    const availableBoxes = Array.from(new Set(cards.map(c => c.box))).sort();

    return (
        <StudySessionLayout
            title="Leitner System"
            subtitle="Spaced Repetition Cards"
            icon={Stack}
            color="text-amber-500"
            onExit={onBack}
        >
            <div className="h-full flex flex-col max-w-5xl mx-auto w-full p-6 gap-6">
                {/* Box Selector */}
                <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(box => (
                        <button
                            key={box}
                            onClick={() => { setCurrentBox(box); setActiveCardIndex(0); setIsFlipped(false); }}
                            className={cn(
                                "flex flex-col items-center p-4 border transition-all duration-300 relative rounded-xl",
                                currentBox === box
                                    ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20"
                                    : "bg-card hover:bg-accent/50"
                            )}
                        >
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Box {box}</span>
                            <span className="text-2xl font-black mt-1">{getBoxCount(box)}</span>
                            {currentBox === box && (
                                <motion.div layoutId="activeBox" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-b-xl" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Card Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[350px]">
                    <AnimatePresence mode="wait">
                        {cards.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-16">
                                No cards loaded yet. Initialize to generate flashcards from your PDF.
                            </div>
                        ) : !isSessionComplete && activeCard ? (
                            <div className="w-full max-w-2xl">
                                <motion.div
                                    key={activeCard.idx}
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 0 }}
                                    className={cn(
                                        "relative w-full cursor-pointer transition-transform duration-500 preserve-3d",
                                        isFlipped ? "rotate-y-180" : ""
                                    )}
                                    style={{ aspectRatio: '3/2' }}
                                    onClick={() => setIsFlipped(p => !p)}
                                >
                                    {/* Front */}
                                    <div className="absolute inset-0 bg-card border rounded-3xl shadow-xl p-10 flex flex-col items-center justify-center text-center backface-hidden">
                                        <Badge variant="outline" className="mb-4 uppercase tracking-widest text-[10px]">
                                            Box {activeCard.box} · Card {activeCardIndex + 1}/{boxCards.length}
                                        </Badge>
                                        <h3 className="text-2xl font-bold leading-tight">{activeCard.question}</h3>
                                        <p className="mt-8 text-xs text-muted-foreground font-medium uppercase tracking-wider">Tap to reveal answer</p>
                                    </div>
                                    {/* Back */}
                                    <div className="absolute inset-0 bg-slate-900 text-white border rounded-3xl shadow-xl p-10 flex items-center justify-center text-center rotate-y-180 backface-hidden">
                                        <p className="text-xl leading-relaxed">{activeCard.answer}</p>
                                    </div>
                                </motion.div>

                                {isFlipped && (
                                    <div className="flex gap-4 mt-6 justify-center animate-in fade-in duration-300">
                                        <Button variant="outline" size="lg"
                                            className="h-13 px-8 rounded-2xl border-destructive/30 hover:bg-destructive/10 text-destructive"
                                            onClick={e => { e.stopPropagation(); handleRate(false); }}>
                                            <X className="mr-2 w-5 h-5" /> Need Practice
                                        </Button>
                                        <Button size="lg"
                                            className="h-13 px-8 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                                            onClick={e => { e.stopPropagation(); handleRate(true); }}>
                                            <Check className="mr-2 w-5 h-5" /> Got It!
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-10 h-10" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black">Box {currentBox} Complete!</h2>
                                    <p className="text-muted-foreground mt-2">All cards reviewed for this box.</p>
                                </div>
                                <Button size="lg" className="rounded-xl px-8"
                                    onClick={() => { setCurrentBox(1); setActiveCardIndex(0); }}>
                                    <ArrowCounterClockwise className="mr-2" /> Restart from Box 1
                                </Button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Progress */}
                <div className="max-w-2xl mx-auto w-full space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Box {currentBox} Progress</span>
                        <span>{Math.round(progressValue)}%</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>
            </div>
        </StudySessionLayout>
    );
}