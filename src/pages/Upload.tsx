import { useState, useCallback, useRef } from "react";
import { Upload as UploadIcon, FileText, X, Check, CircleNotch, CaretRight, Sparkle, Warning } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useGlobalState, Material } from "@/contexts/GlobalStateContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Chapter {
  chapter_number: number;
  chapter_title: string;
  chapter_description: string;
  keywords: string[];
}

interface AnalysisResult {
  document_title: string;
  main_description: string;
  total_chapters: number;
  chapters: Chapter[];
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

const getConfidenceMessage = (v: number) => {
  if (v < 30) return "It's okay to start from the basics. We'll guide you step by step.";
  if (v < 50) return "You have some foundation. Let's build on it together.";
  if (v < 70) return "Good understanding! We'll help you master the details.";
  if (v < 90) return "You seem comfortable — we'll challenge you appropriately.";
  return "Excellent confidence! Let's verify and push your limits.";
};

export default function Upload() {
  const navigate = useNavigate();
  const { refreshMaterials, refreshCollections } = useGlobalState();

  // Step 1 state
  const [uploadedMaterials, setUploadedMaterials] = useState<(Material & { uploading?: boolean })[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preprocessing, setPreprocessing] = useState(false);

  // Step 2 state
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState([50]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Step 3 state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [step, setStep] = useState<"upload" | "confidence" | "result">("upload");

  // ── File upload ────────────────────────────────────────────────────────────

  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.postForm<Material>("/material/upload", form);
    if (!res.success) { toast.error(res.message); return null; }
    return res.data;
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      // Add placeholder
      const placeholder = { material_id: `tmp-${Date.now()}-${file.name}`, file_name: file.name, file_size: file.size, file_type: file.type, status: "processing" as const, collection_id: null, created_at: "", uploading: true };
      setUploadedMaterials((prev) => [...prev, placeholder]);

      const material = await uploadFile(file);

      setUploadedMaterials((prev) =>
        prev.map((m) =>
          m.material_id === placeholder.material_id
            ? material ? { ...material, uploading: false } : { ...placeholder, status: "failed" as const, uploading: false }
            : m
        )
      );
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const removeMaterial = async (id: string) => {
    if (!id.startsWith("tmp-")) await api.delete(`/material/${id}`);
    setUploadedMaterials((prev) => prev.filter((m) => m.material_id !== id));
  };

  // ── Step 1 → 2: Preprocess ─────────────────────────────────────────────────

  const handlePreprocess = async () => {
    const ids = uploadedMaterials.filter((m) => !m.uploading && m.status !== "failed").map((m) => m.material_id);
    if (!ids.length) return;

    setPreprocessing(true);
    const res = await api.post<{ collection_id: string }>("/material/preprocess", { material_ids: ids });
    setPreprocessing(false);

    if (!res.success) { toast.error(res.message); return; }
    setCollectionId(res.data.collection_id);
    await refreshMaterials();
    setStep("confidence");
  };

  // ── Step 2 → 3: Analyze (async poll) ──────────────────────────────────────

  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleAnalyze = async () => {
    if (!collectionId) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    const res = await api.post<{ job_id: string; status: string }>("/material/analyze", {
      collection_id: collectionId,
      confidence: confidence[0] / 100,
    });

    if (!res.success) {
      setAnalyzing(false);
      setAnalyzeError(res.message);
      toast.error(res.message);
      return;
    }

    const jobId = res.data.job_id;

    pollInterval.current = setInterval(async () => {
      const poll = await api.get<{ job_id: string; status: string; data?: AnalysisResult; error?: string }>(
        `/material/analyze/${jobId}/status`
      );

      if (!poll.success) {
        clearInterval(pollInterval.current!);
        setAnalyzing(false);
        setAnalyzeError("Failed to check analysis status.");
        return;
      }

      if (poll.data.status === "done") {
        clearInterval(pollInterval.current!);
        setAnalysisResult(poll.data.data!);
        await refreshCollections();
        setAnalyzing(false);
        setStep("result");
      } else if (poll.data.status === "failed") {
        clearInterval(pollInterval.current!);
        setAnalyzing(false);
        setAnalyzeError(poll.data.error ?? "Analysis failed.");
        toast.error(poll.data.error ?? "Analysis failed.");
      }
    }, 3000);
  };

  // ── UI ─────────────────────────────────────────────────────────────────────

  const readyMaterials = uploadedMaterials.filter((m) => !m.uploading && m.status !== "failed");
  const allUploaded = uploadedMaterials.length > 0 && uploadedMaterials.every((m) => !m.uploading);

  return (
    <Layout>
      <div className="container py-6 max-w-5xl">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["Upload", "Confidence", "Review"].map((label, index) => {
            const current = step === "upload" ? 0 : step === "confidence" ? 1 : 2;
            const isActive = index === current;
            const isComplete = index < current;
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isComplete ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {isComplete ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={cn("text-sm font-medium hidden sm:block", isActive ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                </div>
                {index < 2 && <div className="h-[2px] w-8 bg-muted mx-4" />}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Upload Materials</h1>
              <p className="text-muted-foreground mt-2">Questy will analyze your documents to build a personalized study plan</p>
            </div>

            <Card
              className={cn("border-2 border-dashed transition-all duration-300 rounded-xl", isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted hover:border-primary/50")}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center text-center">
                  <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-colors", isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <UploadIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{isDragOver ? "Drop files here" : "Drag & drop files to upload"}</h3>
                  <p className="text-sm text-muted-foreground mb-8">PDF, DOCX, PPTX, TXT</p>
                  <label>
                    <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
                    <Button variant="outline" className="cursor-pointer rounded-full px-8 h-12" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {uploadedMaterials.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 px-2">
                  <div className="w-1 h-4 bg-primary rounded-full" /> Uploaded Documents
                </h4>
                {uploadedMaterials.map((m) => (
                  <Card key={m.material_id} className="rounded-lg border-none shadow-sm overflow-hidden group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{m.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(m.file_size)}</p>
                        {m.uploading && <Progress value={undefined} className="h-1.5 mt-2 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-3">
                        {m.uploading && <Badge variant="secondary" className="gap-2 rounded-full py-1"><CircleNotch className="w-3 h-3 animate-spin" />Uploading</Badge>}
                        {!m.uploading && m.status !== "failed" && <Badge className="bg-success/10 text-success border-none rounded-full py-1"><Check className="w-3 h-3 mr-1" />Ready</Badge>}
                        {m.status === "failed" && <Badge className="bg-destructive/10 text-destructive border-none rounded-full py-1"><Warning className="w-3 h-3 mr-1" />Failed</Badge>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" onClick={() => removeMaterial(m.material_id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center bg-card p-4 rounded-xl border mt-8">
              <div className="hidden md:block">
                <p className="text-sm font-bold">{uploadedMaterials.length} file{uploadedMaterials.length !== 1 ? "s" : ""} selected</p>
                <p className="text-xs text-muted-foreground">{readyMaterials.length} ready for analysis</p>
              </div>
              <Button
                size="lg"
                className="w-full md:w-auto rounded-full px-12 h-12 font-bold shadow-lg shadow-primary/20"
                disabled={!allUploaded || readyMaterials.length === 0 || preprocessing}
                onClick={handlePreprocess}
              >
                {preprocessing ? <><CircleNotch className="mr-2 w-5 h-5 animate-spin" />Processing…</> : <>Analyze Content <CaretRight className="ml-2 w-5 h-5" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confidence ── */}
        {step === "confidence" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">Sync Baseline</h1>
              <p className="text-muted-foreground mt-2">How confident are you with these materials?</p>
            </div>

            <Card className="rounded-xl border-primary/10 overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="max-w-md mx-auto space-y-12">
                  <div className="space-y-6">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Beginner</span><span>Expert</span>
                    </div>
                    <Slider value={confidence} onValueChange={setConfidence} max={100} step={1} className="[&_[role=slider]]:w-8 [&_[role=slider]]:h-8" />
                  </div>
                  <div>
                    <div className={cn("text-8xl font-black mb-4", confidence[0] < 40 ? "text-destructive" : confidence[0] < 70 ? "text-warning" : "text-success")}>
                      {confidence[0]}%
                    </div>
                    <p className="text-lg font-bold text-muted-foreground">{getConfidenceMessage(confidence[0])}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analyzeError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <Warning className="w-4 h-4 flex-shrink-0" />{analyzeError}
              </div>
            )}

            <div className="flex justify-between gap-4 pt-4">
              <Button variant="ghost" className="rounded-full px-8" onClick={() => setStep("upload")}>Back</Button>
              <Button size="lg" className="rounded-full px-12 h-14 font-bold shadow-xl shadow-primary/20" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <><CircleNotch className="mr-2 w-5 h-5 animate-spin" />Analyzing…</> : <>Start Neural Analysis <Sparkle className="ml-2 w-5 h-5" weight="fill" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === "result" && analysisResult && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">{analysisResult.document_title}</h1>
              <p className="text-muted-foreground mt-2">{analysisResult.main_description}</p>
            </div>

            <div className="grid gap-4">
              {analysisResult.chapters.map((ch) => (
                <Card key={ch.chapter_number} className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        {ch.chapter_number}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold">{ch.chapter_title}</h3>
                        <p className="text-sm text-muted-foreground">{ch.chapter_description}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ch.keywords.map((kw) => (
                            <Badge key={kw} variant="secondary" className="rounded-full px-3 py-1">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <Button variant="ghost" className="rounded-full px-8" onClick={() => setStep("confidence")}>Back</Button>
              <Button className="rounded-full px-12 h-14 font-bold shadow-xl shadow-primary/20 group" onClick={() => navigate("/exam")}>
                Begin Study Protocol
                <CaretRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
