import { useState, useEffect } from "react";
import { StudySessionLayout } from "@/components/study/StudySessionLayout";
import { Stack, ArrowCounterClockwise, Check, X, BookOpen, ArrowLeft, CircleNotch } from "@phosphor-icons/react";
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
}: {
    onBack: () => void;
    collectionId: string;
    studyData: any;
    bookTitle?: string;
}) {
    const [cards, setCards] = useState<LeitnerCard[]>([]);
    const [currentBox, setCurrentBox] = useState<number>(0);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [availableBoxes, setAvailableBoxes] = useState<number[]>([]);

    useEffect(() => {
        if (studyData?.boxes && Array.isArray(studyData.boxes)) {
            const flat: LeitnerCard[] = [];
            studyData.boxes.forEach((box: any) => {
                const boxNum = box.box_number ?? 0;
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
            const boxes = Array.from(new Set(flat.map(c => c.box))).sort((a, b) => a - b);
            setAvailableBoxes(boxes);
            if (boxes.length > 0 && currentBox === 0 && !boxes.includes(0)) {
                setCurrentBox(boxes[0]);
            }
        }
    }, [studyData]);

    const boxCards = cards.filter(c => c.box === currentBox);
    const activeCard = boxCards[activeCardIndex];
    const isSessionComplete = activeCardIndex >= boxCards.length;

    const handleRate = async (correct: boolean) => {
        if (!activeCard) return;
        const allBoxes = availableBoxes.length > 0 ? availableBoxes : [0, 1, 2, 3, 4];
        const currentIdx = allBoxes.indexOf(activeCard.box);
        let newBox: number;
        if (correct) {
            newBox = currentIdx < allBoxes.length - 1 ? allBoxes[currentIdx + 1] : allBoxes[allBoxes.length - 1];
        } else {
            newBox = allBoxes[0];
        }
        setCards(prev => prev.map(c =>
            c.idx === activeCard.idx ? { ...c, box: newBox } : c
        ));

        if (collectionId) {
            try {
                await api.updateLeitnerProgress({
                    collection_id: collectionId,
                    card_id: activeCard.idx,
                    success: correct,
                });
            } catch { /* ignore */ }
        }

        setIsFlipped(false);
        setTimeout(() => setActiveCardIndex(p => p + 1), 150);
    };

    const getBoxCount = (b: number) => cards.filter(c => c.box === b).length;
    const progressValue = boxCards.length === 0 ? 0 : (activeCardIndex / boxCards.length) * 100;
    const displayBoxes = availableBoxes.length > 0 ? availableBoxes : [0, 1, 2, 3, 4];

    return (
        <StudySessionLayout
            title="Leitner Spaced Repetition"
            subtitle={bookTitle}
            icon={Stack}
            color="text-amber-500"
            onExit={onBack}
        >
            <div className="flex h-full overflow-hidden bg-background">
                {/* RIGHT: Leitner Content */}
                <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
                    {/* Box Selector */}
                    <div className="grid gap-3 shrink-0" style={{ gridTemplateColumns: `repeat(${displayBoxes.length}, 1fr)` }}>
                        {displayBoxes.map((box, i) => (
                            <button
                                key={box}
                                onClick={() => { setCurrentBox(box); setActiveCardIndex(0); setIsFlipped(false); }}
                                className={cn(
                                    "flex flex-col items-center p-3 border transition-all duration-300 relative rounded-xl",
                                    currentBox === box
                                        ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20"
                                        : "bg-card hover:bg-accent/50"
                                )}
                            >
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Box {i + 1}</span>
                                <span className="text-xl font-black mt-0.5">{getBoxCount(box)}</span>
                                {currentBox === box && (
                                    <motion.div layoutId="activeBox" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-b-xl" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Card Area */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <AnimatePresence mode="wait">
                            {cards.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm animate-pulse">
                                    No cards found for this collection.
                                </div>
                            ) : !isSessionComplete && activeCard ? (
                                <div className="w-full max-w-xl">
                                    <motion.div
                                        key={activeCard.idx}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        className={cn(
                                            "relative w-full cursor-pointer transition-transform duration-500 preserve-3d",
                                            isFlipped ? "rotate-y-180" : ""
                                        )}
                                        style={{ aspectRatio: '1.6/1' }}
                                        onClick={() => setIsFlipped(p => !p)}
                                    >
                                        {/* Front */}
                                        <div className="absolute inset-0 bg-card border-2 rounded-[2rem] shadow-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden ring-1 ring-black/5">
                                            <Badge variant="outline" className="mb-4 uppercase tracking-widest text-[9px] font-bold text-amber-600 border-amber-200">
                                                Box {displayBoxes.indexOf(activeCard.box) + 1}
                                            </Badge>
                                            <h3 className="text-xl font-black leading-tight text-slate-900">{activeCard.question}</h3>
                                            <p className="absolute bottom-6 text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Tap to flip</p>
                                        </div>
                                        {/* Back */}
                                        <div className="absolute inset-0 bg-slate-900 text-white rounded-[2rem] shadow-2xl p-8 flex items-center justify-center text-center rotate-y-180 backface-hidden">
                                            <p className="text-lg leading-relaxed font-medium">{activeCard.answer}</p>
                                        </div>
                                    </motion.div>

                                    {isFlipped && (
                                        <div className="flex gap-4 mt-8 justify-center animate-in fade-in zoom-in duration-300">
                                            <Button variant="outline" size="lg"
                                                className="flex-1 h-14 rounded-2xl border-destructive/20 hover:bg-destructive/10 text-destructive font-black uppercase tracking-widest text-[10px]"
                                                onClick={e => { e.stopPropagation(); handleRate(false); }}>
                                                <X className="mr-2 w-5 h-5" /> Incorrect
                                            </Button>
                                            <Button size="lg"
                                                className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20"
                                                onClick={e => { e.stopPropagation(); handleRate(true); }}>
                                                <Check className="mr-2 w-5 h-5" /> Correct
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                        <Check className="w-8 h-8" weight="bold" />
                                    </div>
                                    <h2 className="text-2xl font-black">Box {displayBoxes.indexOf(currentBox) + 1} Cleared!</h2>
                                    <Button onClick={() => setActiveCardIndex(0)} className="rounded-xl font-bold">Review Again</Button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Progress */}
                    <div className="max-w-xl mx-auto w-full space-y-2 mt-auto">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>Progress</span>
                            <span>{Math.round(progressValue)}%</span>
                        </div>
                        <Progress value={progressValue} className="h-1.5" />
                    </div>
                </div>
            </div>
        </StudySessionLayout>
    );
}