import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  CaretRight,
  TrendUp,
  Target,
  RocketLaunch,
  Faders,
  Funnel,
  ChartBar,
  CheckCircle,
  Clock,
  Sparkle,
  Lightning,
  GraduationCap,
  ArrowRight,
  CircleNotch,
  ClockCounterClockwise,
  Warning
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { questionTypes } from "@/data/mockData";
import ExamRoom from "./ExamRoom";
import { api, ExamQuestion, SubmitResponse } from "@/services/api";
import { collectionsService, Collection } from "@/services/collectionsService";
import { materialService, AnalyzedChapter } from "@/services/materialService";
import { useMaterial } from "@/contexts/MaterialContext";
import { toast } from "sonner";

export default function Exam() {
  const { collectionId: sessionCollectionId } = useMaterial();
  const [step, setStep] = useState<"configure" | "exam">("configure");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapters, setChapters] = useState<AnalyzedChapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  
  // Exam State
  const [examId, setExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<SubmitResponse | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState({
    questionTypes: ['Multiple Choice'],
    questionCount: 10,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'mixed',
    selectedChapterIds: [] as string[],
  });


  // Fetch collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await collectionsService.getCollections();
        setCollections(data);
        
        // Auto-select session collection if it exists
        if (sessionCollectionId && data.some(c => c.collection_id === sessionCollectionId)) {
          setActiveCollectionId(sessionCollectionId);
        }
      } catch (error: any) {
        console.error("--- Collection Fetch Error (Exam Page) ---");
        toast.error("Failed to load your study collections. Please check your connection.");
      } finally {
        setIsLoadingCollections(false);
      }
    };
    fetchCollections();
  }, [sessionCollectionId]);

  // Fetch chapters when collection is selected
  useEffect(() => {
    if (activeCollectionId) {
      // Clear old chapters and selected IDs immediately to prevent desync
      setChapters([]);
      setConfig(p => ({ ...p, selectedChapterIds: [] }));
      
      const fetchChapters = async () => {
        setIsLoadingChapters(true);
        try {
          const responseData = await materialService.analyze(activeCollectionId);
          console.log("Analyze Response Data:", responseData);
          
          // Handle cases where data might be nested differently
          const chs = responseData.chapters || (Array.isArray(responseData) ? responseData : []);
          
          setChapters(chs);
          // Default select all chapters for the new material
          if (chs.length > 0) {
            setConfig(p => ({ ...p, selectedChapterIds: chs.map(c => c.chapter_id) }));
          } else {
            console.warn("No chapters found in analysis response");
          }
        } catch (error) {
          console.error("Failed to fetch chapters for collection:", error);
          setChapters([]);
          toast.error("Could not analyze this material. Please try again.");
        } finally {
          setIsLoadingChapters(false);
        }
      };
      fetchChapters();
    } else {
      setChapters([]);
      setConfig(p => ({ ...p, selectedChapterIds: [] }));
    }
  }, [activeCollectionId]);

  // Timer logic
  useEffect(() => {
    if (step === "exam" && !isFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, isFinished, timeLeft]);

  const selectedCollection = collections.find((c) => c.collection_id === activeCollectionId);

  const handleStart = async () => {
    if (!activeCollectionId) {
      toast.error("Please select a study collection first.");
      return;
    }

    if (config.questionTypes.length === 0) {
      toast.error("Please select at least one question type.");
      return;
    }
    
    setIsGenerating(true);
    console.log("--- EXAM GENERATION START ---");
    try {
      // Use labels directly or map them strictly
      const selectedTypeLabels = config.questionTypes.map(typeId => {
        const type = questionTypes.find(t => t.id === typeId || t.label === typeId);
        return type ? type.label : typeId;
      });

      // Capitalize difficulty for backend consistency
      const formattedDifficulty = config.difficulty === 'mixed' 
        ? "Medium" 
        : config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1);

      // Use only selected chapter IDs
      const chapterIds = config.selectedChapterIds.length > 0 
        ? config.selectedChapterIds 
        : chapters.map(ch => ch.chapter_id);

      if (chapterIds.length === 0) {
        throw new Error("No chapters selected. Please analyze your material first.");
      }

      const requestPayload = {
        collection_id: activeCollectionId,
        chapter_ids: chapterIds,
        question_count: config.questionCount,
        difficulty: formattedDifficulty,
        question_types: selectedTypeLabels
      };

      console.log("Request Payload:", requestPayload);

      const examData = await api.generateExam(requestPayload);
      
      console.log("Response Data:", examData);

      if (!examData || !examData.questions || examData.questions.length === 0) {
        throw new Error("No questions were generated. Try adjusting your settings.");
      }

      setExamId(examData.exam_id);
      setQuestions(examData.questions);
      setAnswers({});
      setTimeLeft(config.questionCount * 1.5 * 60); // 1.5 mins per question
      setIsFinished(false);
      setResults(null);
      setStep("exam");
      toast.success("Assessment generated successfully!");
    } catch (error: any) {
      console.error("--- EXAM GENERATION FAILED ---");
      console.error(error);
      const backendMessage = error.response?.data?.detail || 
                            error.response?.data?.message || 
                            error.message ||
                            "Failed to generate assessment. Please try again.";
      toast.error(backendMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFinish = async () => {
    if (isSubmitting || !examId) return;
    
    setIsSubmitting(true);
    console.log("--- EXAM SUBMISSION START ---");
    try {
      const submitPayload = {
        exam_id: examId,
        answers: answers
      };

      console.log("Submit Payload:", submitPayload);

      const response = await api.submitExam(submitPayload);
      
      console.log("Submit Response:", response);

      setResults(response);
      setIsFinished(true);
      toast.success("Assessment submitted! Analyzing results...");
    } catch (error: any) {
      console.error("--- EXAM SUBMISSION FAILED ---");
      console.error(error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          "Failed to submit assessment. Please check your connection.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (step === "exam") {
    if (questions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-6 bg-background p-6">
          <Warning className="w-16 h-16 text-destructive" weight="fill" />
          <h2 className="text-2xl font-bold">Generation Desync</h2>
          <p className="text-muted-foreground max-w-md mx-auto">The assessment state was lost or the questions were not received correctly.</p>
          <Button onClick={() => setStep("configure")} variant="outline" className="rounded-full">Back to Configuration</Button>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] bg-background">
        <ExamRoom
          key={examId || 'new-exam'}
          questions={questions}
          answers={answers}
          onAnswer={setAnswer}
          timeLeft={timeLeft}
          isFinished={isFinished}
          onFinish={handleFinish}
          results={results}
          onReset={() => {
            setStep("configure");
            setQuestions([]);
            setAnswers({});
          }}
        />
        {isSubmitting && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="relative">
              <CircleNotch className="w-16 h-16 text-primary animate-spin mb-6" weight="bold" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary animate-pulse" weight="fill" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Analyzing Performance</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">Questy AI is grading your responses and generating a personalized mastery path.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout title="Exam Room">
      <div className="container py-6 max-w-6xl px-4 sm:px-6 relative">
          {/* Generation Loading Overlay */}
          {isGenerating && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
               <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 relative">
                  <CircleNotch className="w-12 h-12 text-primary animate-spin" weight="bold" />
                  <RocketLaunch className="w-6 h-6 text-primary absolute" weight="fill" />
               </div>
               <h2 className="text-2xl font-black tracking-tight mb-2">Questy AI is Synthesizing</h2>
               <p className="text-muted-foreground max-w-xs mx-auto">Building a custom assessment from your study materials...</p>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-center md:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary mb-2">
                <Sparkle className="w-5 h-5 animate-pulse" weight="fill" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Questy Intelligence Engine</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Practice Assessments</h1>
              <p className="text-sm text-muted-foreground font-medium">Generate fresh, AI-powered exams from your study materials</p>
            </div>
            <Link to="/exam-history">
              <Button variant="outline" className="rounded-full h-11 px-6 font-bold border-primary/20 hover:bg-primary/5 transition-all">
                <ClockCounterClockwise className="w-4 h-4 mr-2" />
                View Exam History
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-10">
              {/* Step 1: Collection Selection */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm border border-primary/20">01</div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Select Study Collection</h2>
                    <p className="text-xs text-muted-foreground">Which material should Questy AI focus on?</p>
                  </div>
                </div>

                {isLoadingCollections ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse border border-border/50" />
                    ))}
                  </div>
                ) : collections.length === 0 ? (
                  <Card className="p-10 text-center border-dashed border-2 bg-muted/30">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                      <GraduationCap className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">No collections found</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Upload and process study materials first to generate exams.</p>
                    <Button asChild className="rounded-full font-bold px-8">
                      <Link to="/upload">Get Started</Link>
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {collections.map((collection) => (
                      <button
                        key={collection.collection_id}
                        onClick={() => setActiveCollectionId(collection.collection_id)}
                        className={cn(
                          "group relative p-5 rounded-2xl border transition-all duration-300 text-left h-full flex items-center gap-4",
                          activeCollectionId === collection.collection_id
                            ? "border-primary bg-primary/[0.03] ring-1 ring-primary"
                            : "bg-card hover:bg-accent/50 border-border/50"
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-500 shrink-0",
                          activeCollectionId === collection.collection_id 
                            ? "bg-primary text-primary-foreground rotate-3 scale-110" 
                            : "bg-muted group-hover:scale-105"
                        )}>
                          {collection.icon || <GraduationCap weight="fill" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-bold text-base mb-1 truncate">{collection.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{collection.description}</p>
                        </div>
                        {activeCollectionId === collection.collection_id && (
                          <div className="absolute top-3 right-3 animate-in zoom-in duration-300">
                            <CheckCircle className="w-6 h-6 text-primary" weight="fill" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Step 2: Customization */}
              <section className={cn("space-y-6 transition-all duration-500", !activeCollectionId && "opacity-50 blur-[1px] pointer-events-none")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm border border-primary/20">02</div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Configure Assessment</h2>
                    <p className="text-xs text-muted-foreground">Tailor the difficulty and scope of your session</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-border/50 overflow-hidden group">
                    <CardHeader className="bg-muted/30 pb-4">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Faders className="w-3.5 h-3.5 text-primary" weight="bold" />
                        Global Parameters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-foreground">Total Questions</label>
                          <Badge variant="secondary" className="font-black px-3 py-0.5 rounded-full text-primary">{config.questionCount}</Badge>
                        </div>
                        <Slider
                          value={[config.questionCount]}
                          onValueChange={([val]) => setConfig(p => ({ ...p, questionCount: val }))}
                          max={30} min={5} step={5}
                          className="py-2"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1">
                          <span>5 Qs</span>
                          <span>15 Qs</span>
                          <span>30 Qs</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-foreground block">Cognitive Difficulty</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['easy', 'medium', 'hard', 'mixed'].map(level => (
                            <button
                              key={level}
                              onClick={() => setConfig(p => ({ ...p, difficulty: level as any }))}
                              className={cn(
                                "py-2.5 px-1 text-[10px] uppercase font-black rounded-xl border transition-all truncate",
                                config.difficulty === level
                                  ? "bg-primary text-primary-foreground border-primary scale-105"
                                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                              )}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-primary" weight="bold" />
                        Integrated Question Types
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-2">
                        {questionTypes.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setConfig(p => ({
                              ...p,
                              questionTypes: p.questionTypes.includes(t.label)
                                ? p.questionTypes.filter(label => label !== t.label)
                                : [...p.questionTypes, t.label]
                            }))}
                            className={cn(
                              "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                              config.questionTypes.includes(t.label)
                                ? "bg-primary/5 border-primary text-primary font-bold shadow-none"
                                : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50 shadow-none"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-base",
                              config.questionTypes.includes(t.label) ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              {t.icon.length > 2 ? <Lightning weight="fill" className="w-4 h-4" /> : t.icon}
                            </div>
                            <span className="text-[11px] truncate">{t.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mt-6 flex items-start gap-3">
                        <Lightning className="w-4 h-4 text-primary shrink-0 mt-0.5" weight="fill" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Pro Tip: Including diverse question types helps identify cognitive blind spots.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Step 3: Chapter Selection */}
              <section className={cn("space-y-6 transition-all duration-500", !activeCollectionId && "opacity-50 blur-[1px] pointer-events-none")}>
                 <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm border border-primary/20">03</div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Scope Your Exam</h2>
                    <p className="text-xs text-muted-foreground">Select specific sections from your document</p>
                  </div>
                </div>

                {isLoadingChapters ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse border border-border/50" />
                    ))}
                  </div>
                ) : chapters.length === 0 && activeCollectionId ? (
                   <div className="p-6 rounded-2xl border border-dashed text-center text-muted-foreground">
                      No chapters found in this material. Try another one.
                   </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chapters.map((chapter) => (
                      <div
                        key={chapter.chapter_id}
                        onClick={() => setConfig(p => ({
                          ...p,
                          selectedChapterIds: p.selectedChapterIds.includes(chapter.chapter_id)
                            ? p.selectedChapterIds.filter(id => id !== chapter.chapter_id)
                            : [...p.selectedChapterIds, chapter.chapter_id]
                        }))}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                          config.selectedChapterIds.includes(chapter.chapter_id)
                            ? "border-primary bg-primary/[0.03] ring-1 ring-primary"
                            : "bg-card border-border/50 hover:border-primary/30"
                        )}
                      >
                        <Checkbox 
                          checked={config.selectedChapterIds.includes(chapter.chapter_id)} 
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate">CH {chapter.chapter_number}: {chapter.chapter_title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{chapter.chapter_description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-6">
                <Card className="rounded-3xl border border-border/50 overflow-hidden glass-card relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-x" />
                  <CardHeader className="bg-primary/5 pb-6 px-6 pt-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mb-4 shadow-none">
                      <RocketLaunch className="w-6 h-6" weight="fill" />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">Ready to Launch?</CardTitle>
                    <CardDescription className="text-xs font-medium">Questy AI will synthesize questions based on your current setup.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-8 px-6 pb-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Material</span>
                        </div>
                        <span className="text-xs font-bold truncate max-w-[140px]">
                          {selectedCollection?.title || "None Selected"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/40 text-center border border-border/50 group hover:border-primary/30 transition-colors">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Volume</span>
                          <span className="text-2xl font-black text-primary">{config.questionCount}</span>
                          <span className="text-[10px] text-muted-foreground block">Questions</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/40 text-center border border-border/50 group hover:border-primary/30 transition-colors">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Estimate</span>
                          <span className="text-2xl font-black text-primary">{Math.round(config.questionCount * 1.5)}</span>
                          <span className="text-[10px] text-muted-foreground block">Minutes</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full py-8 text-lg font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative shadow-none"
                      disabled={!activeCollectionId || isGenerating || isLoadingChapters}
                      onClick={handleStart}
                    >
                      {isGenerating ? (
                        <>
                          <CircleNotch className="mr-3 w-6 h-6 animate-spin" weight="bold" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <span className="relative z-10 flex items-center">
                            Start Practice Exam
                            <CaretRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground/20 opacity-0 group-hover:opacity-10 transition-opacity" />
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground italic flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        AI Engine Online & Ready
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Link to="/questy-chat" className="block group">
                  <Card className="rounded-2xl border-none shadow-none bg-accent/30 hover:bg-accent/50 transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shrink-0 transition-transform group-hover:rotate-12">
                        <Brain className="w-6 h-6" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black leading-none mb-1">AI Study Partner</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">Quick revision before you start?</p>
                      </div>
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-background/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
}
