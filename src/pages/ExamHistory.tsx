import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ClockCounterClockwise,
  Calendar,
  Target,
  TrendUp,
  CaretRight,
  FileText,
  CircleNotch,
  Warning,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ExamResult {
  submission_id: string;
  exam_id: string;
  exam_title: string;
  total_score: number;
  max_score: number;
  status: string;
  created_at: string;
}

export default function ExamHistory() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ExamResult[]>("/exam/results").then((res) => {
      if (res.success) setResults(res.data);
      else setError(res.message);
      setLoading(false);
    });
  }, []);

  const totalExams = results.length;
  const averageScore = totalExams
    ? Math.round(results.reduce((acc, r) => acc + (r.total_score / r.max_score) * 100, 0) / totalExams)
    : 0;
  const bestScore = totalExams
    ? Math.round(Math.max(...results.map((r) => (r.total_score / r.max_score) * 100)))
    : 0;

  const trendData = [...results]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: Math.round((r.total_score / r.max_score) * 100),
    }));

  return (
    <DashboardLayout title="Exam History">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                <ClockCounterClockwise className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : totalExams}</p>
                <p className="text-sm text-muted-foreground">Total Exams</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : `${averageScore}%`}</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <TrendUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : `${bestScore}%`}</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClockCounterClockwise className="w-5 h-5" />Past Exams
            </CardTitle>
            <CardDescription>Your submitted exam results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}

            {!loading && error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
                <Warning className="w-5 h-5 shrink-0" />{error}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
                <FileText className="w-5 h-5 shrink-0" />No exams submitted yet.{" "}
                <Link to="/exam" className="text-primary underline ml-1">Start one</Link>
              </div>
            )}

            {!loading && results.map((r) => {
              const pct = Math.round((r.total_score / r.max_score) * 100);
              return (
                <div key={r.submission_id} className="p-5 rounded-2xl border bg-card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0",
                      pct >= 80 ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600"
                        : pct >= 60 ? "bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-600"
                          : "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-600"
                    )}>
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{r.exam_title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-medium">{r.total_score.toFixed(1)} / {r.max_score.toFixed(1)} pts</span>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-2 max-w-xs" />
                    </div>
                    <Badge variant="outline" className={cn(
                      "shrink-0",
                      r.status === "graded" ? "border-green-500/50 text-green-600" : "border-border text-muted-foreground"
                    )}>
                      {r.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
