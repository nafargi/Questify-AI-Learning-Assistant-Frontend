import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle, XCircle, ArrowLeft, ArrowCounterClockwise, ClockCounterClockwise } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";

interface GradedItem {
  graded_item_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  score_attained: number;
  feedback_note: string;
  graded_by: string;
}

interface SubmitResult {
  submission_id: string;
  exam_id: string;
  total_score: number;
  max_score: number;
  status: string;
  created_at: string;
  graded_items: GradedItem[];
}

interface Question {
  question_id: string;
  question_type: string;
  question_text: string;
  difficulty: string;
}

export default function ExamResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as SubmitResult | undefined;
  const questions = (location.state?.questions ?? []) as Question[];
  const examTitle = location.state?.examTitle as string | undefined;

  useEffect(() => {
    if (!result) navigate("/exam");
  }, [result]);

  if (!result) return null;

  const pct = Math.round((result.total_score / result.max_score) * 100);
  const correct = result.graded_items.filter((g) => g.is_correct).length;
  const total = result.graded_items.length;

  const questionMap = Object.fromEntries(questions.map((q) => [q.question_id, q]));

  return (
    <Layout showSidebar={false} title="Exam Result">
      <div className="max-w-3xl mx-auto py-8 space-y-6">

        {/* Score card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto text-3xl font-bold",
              pct >= 80 ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                : pct >= 60 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30"
            )}>
              {pct}%
            </div>
            <div>
              <h1 className="text-2xl font-bold">{examTitle ?? "Exam Result"}</h1>
              <p className="text-muted-foreground mt-1">{correct} / {total} correct · {result.total_score.toFixed(1)} / {result.max_score.toFixed(1)} pts</p>
            </div>
            <Progress value={pct} className="h-2 max-w-xs mx-auto" />
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/exam")}>
                <ArrowCounterClockwise className="w-4 h-4 mr-2" />New Exam
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link to="/exam-history">
                  <ClockCounterClockwise className="w-4 h-4 mr-2" />History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          {result.graded_items.map((item, i) => {
            const q = questionMap[item.question_id];
            return (
              <Card key={item.graded_item_id} className="border-none shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    {item.is_correct
                      ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" weight="fill" />
                      : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" weight="fill" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                        {q && <Badge variant="outline" className="rounded-full text-[10px]">{q.question_type}</Badge>}
                        {q && <Badge variant="secondary" className="rounded-full text-[10px]">{q.difficulty}</Badge>}
                        <span className="text-xs font-bold ml-auto">{item.score_attained.toFixed(1)} pt</span>
                      </div>
                      {q && <p className="text-sm font-medium">{q.question_text}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className={cn("p-3 rounded-lg", item.is_correct ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                      <p className="text-xs text-muted-foreground mb-0.5">Your answer</p>
                      <p className={cn("font-medium", item.is_correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                        {item.user_answer || <span className="italic text-muted-foreground">No answer</span>}
                      </p>
                    </div>
                    {item.feedback_note && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-0.5">Feedback</p>
                        <p className="text-foreground">{item.feedback_note}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="pb-8 text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/exam")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Exam Setup
          </Button>
        </div>
      </div>
    </Layout>
  );
}
