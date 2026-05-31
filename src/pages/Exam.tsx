import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, CaretRight, RocketLaunch, CheckCircle, Sparkle, ArrowRight, CircleNotch, Warning } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useGlobalState } from "@/contexts/GlobalStateContext";
import { toast } from "sonner";

interface Chapter {
  chapter_id: string;
  chapter_number: number;
  title: string;
  description: string;
}

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"] as const;
type Difficulty = typeof DIFFICULTIES[number];

const QUESTION_TYPES = ["Multiple Choice", "True/False", "Fill in Blank", "Matching", "Short Answer", "Coding"] as const;
type QuestionType = typeof QUESTION_TYPES[number];

export default function Exam() {
  const navigate = useNavigate();
  const { collections, collectionsLoading, profile } = useGlobalState();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>("Mixed");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["Multiple Choice", "True/False"]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!selectedCollectionId) { setChapters([]); setSelectedChapterIds([]); return; }
    setChaptersLoading(true);
    api.get<Chapter[]>(`/material/collections/${selectedCollectionId}/chapters`).then((res) => {
      if (res.success) { setChapters(res.data); setSelectedChapterIds(res.data.map((c) => c.chapter_id)); }
      else toast.error(res.message);
      setChaptersLoading(false);
    });
  }, [selectedCollectionId]);

  const toggleChapter = (id: string) =>
    setSelectedChapterIds((p) => p.includes(id) ? p.filter((c) => c !== id) : [...p, id]);

  const toggleType = (t: QuestionType) =>
    setQuestionTypes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const selectedCollection = collections.find((c) => c.collection_id === selectedCollectionId);
  const canStart = selectedCollectionId && selectedChapterIds.length > 0 && questionTypes.length > 0;

  const handleStart = async () => {
    if (!canStart) return;
    setGenerating(true);
    const res = await api.post<{ exam_id: string; exam_title: string; questions: unknown[] }>("/exam/generate-exam", {
      collection_id: selectedCollectionId,
      chapter_ids: selectedChapterIds,
      question_count: questionCount,
      difficulty,
      question_types: questionTypes,
    });
    setGenerating(false);
    if (!res.success) { toast.error(res.message); return; }
    navigate("/exam-room", { state: { exam: res.data } });
  };

  return (
    <Layout title="Exam Room">
      <div className="container py-4 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Room</h1>
            <p className="text-muted-foreground mt-1">Configure and start your practice assessment</p>
          </div>
          {profile && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.average_score.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Score</p>
              </div>
              <div className="h-10 w-px bg-border mx-2" />
              <div className="text-center">
                <p className="text-2xl font-bold">{profile.exams_completed}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Collection */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-bold">Select a Collection</h2>
              </div>
              {collectionsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
              ) : collections.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
                  <Warning className="w-5 h-5 flex-shrink-0" />
                  No collections found. <Link to="/upload" className="text-primary underline ml-1">Upload materials</Link> first.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collections.map((col) => (
                    <button key={col.collection_id} onClick={() => setSelectedCollectionId(col.collection_id)}
                      className={cn("group relative p-4 rounded-lg border transition-all duration-300 text-left",
                        selectedCollectionId === col.collection_id ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "bg-card hover:bg-accent/50 border-border"
                      )}>
                      <div className="flex items-start gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-transform duration-300",
                          selectedCollectionId === col.collection_id ? "bg-primary text-primary-foreground scale-110" : "bg-muted group-hover:scale-110"
                        )}>
                          {(col.title ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base mb-1 truncate">{col.title ?? "Untitled Collection"}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{col.description ?? "No description"}</p>
                        </div>
                        {selectedCollectionId === col.collection_id && <CheckCircle className="w-6 h-6 text-primary absolute top-4 right-4" weight="fill" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Step 2: Chapters + Config */}
            <section className={cn("transition-all duration-500", !selectedCollectionId && "opacity-50 pointer-events-none")}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                <h2 className="text-xl font-bold">Customize Assessment</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="rounded-lg border">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Chapters</CardTitle>
                    <Badge variant="secondary" className="rounded-full">{selectedChapterIds.length || "All"}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {chaptersLoading ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />) :
                      chapters.length === 0 ? <p className="text-sm text-muted-foreground py-2">No chapters found.</p> :
                        chapters.map((ch) => (
                          <label key={ch.chapter_id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                            selectedChapterIds.includes(ch.chapter_id) ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent hover:bg-muted/50"
                          )}>
                            <Checkbox checked={selectedChapterIds.includes(ch.chapter_id)} onCheckedChange={() => toggleChapter(ch.chapter_id)} />
                            <span className="text-sm font-medium flex-1 truncate">{ch.chapter_number}. {ch.title}</span>
                          </label>
                        ))}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="rounded-lg border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Questions</label>
                          <span className="text-lg font-bold">{questionCount}</span>
                        </div>
                        <Slider value={[questionCount]} onValueChange={([v]) => setQuestionCount(v)} max={50} min={5} step={5} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Difficulty</label>
                        <div className="grid grid-cols-4 gap-2">
                          {DIFFICULTIES.map((d) => (
                            <button key={d} onClick={() => setDifficulty(d)}
                              className={cn("py-2 px-1 text-[10px] uppercase font-bold rounded-lg border transition-all",
                                difficulty === d ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                              )}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="p-4 rounded-2xl bg-muted/50 border">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Question Types</p>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPES.map((t) => (
                        <Badge key={t} variant={questionTypes.includes(t) ? "default" : "outline"}
                          className="cursor-pointer py-1 px-3 rounded-full transition-all" onClick={() => toggleType(t)}>
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card className="rounded-lg border overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <RocketLaunch className="w-6 h-6 text-primary" weight="fill" />Launch Exam
                  </CardTitle>
                  <CardDescription>Review your configuration before initiating</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Collection</span>
                      <span className="text-sm font-bold truncate max-w-[140px]">{selectedCollection?.title ?? "Not Selected"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Chapters</span>
                      <span className="text-sm font-bold">{selectedChapterIds.length} selected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-muted/50 text-center">
                        <span className="text-xs text-muted-foreground block">Questions</span>
                        <span className="text-xl font-bold">{questionCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50 text-center">
                        <span className="text-xs text-muted-foreground block">Difficulty</span>
                        <span className="text-xl font-bold">{difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                    <Sparkle className="w-4 h-4 text-primary shrink-0 mt-0.5" weight="fill" />
                    <p className="text-xs text-muted-foreground leading-relaxed">Questy AI will generate questions from your selected chapters.</p>
                  </div>
                  <Button className="w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                    disabled={!canStart || generating} onClick={handleStart}>
                    {generating ? <><CircleNotch className="mr-2 w-5 h-5 animate-spin" />Generating…</> : <>Start Assessment <CaretRight className="ml-2 w-5 h-5" /></>}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none shadow-sm bg-accent/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"><Brain className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">AI Study Partner</p>
                    <p className="text-xs text-muted-foreground mt-1">Chat for quick revision</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full" asChild>
                    <Link to="/questy-chat"><ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
