import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Clock, List, PaperPlaneTilt } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Types from API ─────────────────────────────────────────────────────────

interface Question {
  question_id: string;
  question_type: string;
  question_text: string;
  difficulty: string;
  content: Record<string, unknown>;
  explanation?: string;
}

interface ExamData {
  exam_id: string;
  exam_title: string;
  questions: Question[];
}

// ── Simple question renderer ───────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  answer,
  onChange,
}: {
  question: Question;
  index: number;
  answer: string | undefined;
  onChange: (val: string) => void;
}) {
  const content = question.content as any;

  return (
    <Card className="rounded-lg border-none shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground">Question {index + 1}</span>
          <Badge variant="outline" className="rounded-full text-[10px]">{question.question_type}</Badge>
          <Badge variant="secondary" className="rounded-full text-[10px]">{question.difficulty}</Badge>
        </div>

        <p className="font-medium text-base leading-relaxed">{question.question_text}</p>

        {/* Multiple Choice — store 0-based index string */}
        {question.question_type === "Multiple Choice" && content.options && (
          <div className="space-y-2">
            {(content.options as string[]).map((opt, i) => (
              <button
                key={i}
                onClick={() => onChange(String(i))}
                className={cn(
                  "w-full text-left p-3 rounded-lg border text-sm transition-all",
                  answer === String(i) ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"
                )}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {question.question_type === "True/False" && (
          <div className="flex gap-3">
            {["True", "False"].map((opt) => (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={cn(
                  "flex-1 p-3 rounded-lg border text-sm font-medium transition-all",
                  answer === opt ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Fill in Blank / Short Answer / Coding */}
        {(question.question_type === "Fill in Blank" || question.question_type === "Short Answer" || question.question_type === "Coding") && (
          <textarea
            value={answer ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={question.question_type === "Coding" ? 6 : 3}
            placeholder="Type your answer here..."
            className={cn(
              "w-full p-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-background",
              question.question_type === "Coding" && "font-mono"
            )}
          />
        )}

        {/* Matching — store as JSON string: { leftLabel: rightValue, ... } */}
        {question.question_type === "Matching" && (
          (() => {
            const leftItems: string[] = content.left_items ?? (content.pairs as any[])?.map((p: any) => p.left) ?? [];
            const rightPool: string[] = content.right_items ?? (content.pairs as any[])?.map((p: any) => p.right) ?? [];
            // Parse current answer JSON string back to a display map
            const selected: Record<string, string> = (() => {
              try { return answer ? JSON.parse(answer) : {}; } catch { return {}; }
            })();

            const updateMatch = (leftLabel: string, rightVal: string) => {
              const next = { ...selected };
              // Remove any other key that already has this value (uniqueness)
              Object.keys(next).forEach((k) => { if (next[k] === rightVal && k !== leftLabel) delete next[k]; });
              if (rightVal) next[leftLabel] = rightVal; else delete next[leftLabel];
              const json = JSON.stringify(next);
              onChange(Object.keys(next).length ? json : undefined as any);
            };

            return (
              <div className="space-y-2">
                {leftItems.map((left) => {
                  const usedValues = Object.entries(selected)
                    .filter(([k]) => k !== left)
                    .map(([, v]) => v);
                  return (
                    <div key={left} className="grid grid-cols-2 gap-3 items-center">
                      <div className="p-3 rounded-lg bg-muted text-sm font-bold">{left}</div>
                      <select
                        value={selected[left] ?? ""}
                        onChange={(e) => updateMatch(left, e.target.value)}
                        className={cn(
                          "p-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-all",
                          selected[left] ? "border-primary opacity-50" : "border-border font-bold text-foreground"
                        )}
                      >
                        <option value="">— Select —</option>
                        {rightPool.map((right) => (
                          <option key={right} value={right} disabled={usedValues.includes(right)}>
                            {right}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ExamRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const exam = location.state?.exam as ExamData | undefined;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState((exam?.questions.length ?? 20) * 90); // 1.5 min/question
  const [submitting, setSubmitting] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Redirect if no exam data
  useEffect(() => {
    if (!exam) navigate("/exam");
  }, [exam]);

  // Timer
  useEffect(() => {
    if (!exam) return;
    const t = setInterval(() => setTimeLeft((p) => { if (p <= 1) { clearInterval(t); handleSubmit(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [exam]);

  if (!exam) return null;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  const setAnswer = (id: string, val: string | undefined) => setAnswers((p) => {
    if (val === undefined) { const { [id]: _, ...rest } = p; return rest; }
    return { ...p, [id]: val };
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await api.post("/exam/submit", { exam_id: exam.exam_id, answers });
    setSubmitting(false);
    if (!res.success) { toast.error(res.message); return; }
    navigate("/exam-result", { state: { result: res.data, questions: exam.questions, examTitle: exam.exam_title } });
  };

  return (
    <Layout showSidebar={false} title={exam.exam_title}>
      {/* Sticky exam bar */}
      <div className="fixed top-14 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-muted-foreground hidden sm:block">Progress</span>
            <Progress value={progress} className="w-32 h-1.5" />
            <span className="text-xs font-bold">{answeredCount}/{exam.questions.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold tabular-nums",
              timeLeft < 60 ? "border-destructive text-destructive animate-pulse" : "bg-muted/50 border-transparent"
            )}>
              <Clock className="w-4 h-4" />{formatTime(timeLeft)}
            </div>
            <Button size="sm" className="rounded-full h-8 px-5" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigator */}
        <aside className="lg:col-span-3">
          <Card className="rounded-lg border-none shadow-sm sticky top-32">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <List className="w-4 h-4" />Navigator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, i) => (
                  <button
                    key={q.question_id}
                    onClick={() => questionRefs.current[q.question_id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className={cn(
                      "aspect-square rounded-lg text-xs font-bold border transition-all",
                      answers[q.question_id] ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Questions */}
        <main className="lg:col-span-9 space-y-6 pb-24">
          {exam.questions.map((q, i) => (
            <div key={q.question_id} ref={(el) => { questionRefs.current[q.question_id] = el; }} className="scroll-mt-32">
              <QuestionCard question={q} index={i} answer={answers[q.question_id]} onChange={(v) => setAnswer(q.question_id, v)} />
            </div>
          ))}

          <div className="pt-8 text-center border-t">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <PaperPlaneTilt className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Review your answers before submitting.</p>
            <Button size="lg" className="rounded-full px-12" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Assessment"}
            </Button>
          </div>
        </main>
      </div>
    </Layout>
  );
}
