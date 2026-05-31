import { useState, useEffect } from "react";
import { X, Plus, ArrowRight, CircleNotch, FileText, Warning, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useGlobalState } from "@/contexts/GlobalStateContext";
import { NoteContent } from "@/data/mockNotes";

// Map method id → API path segment
const METHOD_PATH: Record<string, string> = {
  cornell: "cornell",
  outline: "outline",
  mindmap: "mind-map",
  boxing: "boxing",
  charting: "charting",
  sentence: "sentence",
};

// Map API response → NoteContent shape
function toNoteContent(raw: any, methodId: string): NoteContent {
  const base = {
    id: raw.note_id,
    courseId: raw.collection_id,
    title: raw.title ?? "Untitled",
    date: new Date(raw.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    method: methodId as NoteContent["method"],
  };
  switch (methodId) {
    case "cornell":
      return { ...base, cues: raw.cues ?? [], summary: raw.summary ?? "" };
    case "outline":
      return { ...base, sections: (raw.sections ?? []).map((s: any) => ({ heading: s.heading, level: 1, content: "", bullets: s.bullets ?? [] })) };
    case "mindmap":
      return {
        ...base, center: raw.root?.label ?? "",
        branches: (raw.root?.children ?? []).map((c: any) => ({
          title: c.label, color: "bg-primary/10 text-primary",
          items: (c.children ?? []).map((cc: any) => cc.label),
        })),
      };
    case "boxing":
      return { ...base, boxes: (raw.boxes ?? []).map((b: any) => ({ title: b.title, color: "border-primary bg-primary/5", items: b.items ?? [] })) };
    case "charting":
      return { ...base, headers: raw.columns ?? [], rows: raw.rows ?? [] };
    case "sentence":
      return { ...base, sections: (raw.sections ?? []).map((s: any) => ({ content: s.content })) };
    default:
      return base as NoteContent;
  }
}

interface NotesListSheetProps {
  methodId: string;
  methodName: string;
  methodIcon: string;
  onClose: () => void;
  onOpen: (note: NoteContent, methodId: string) => void;
}

export function NotesListSheet({ methodId, methodName, methodIcon, onClose, onOpen }: NotesListSheetProps) {
  const { collections, collectionsLoading } = useGlobalState();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null); // collection_id being generated
  const [showCollections, setShowCollections] = useState(false);

  const path = METHOD_PATH[methodId] ?? methodId;

  useEffect(() => {
    api.get<any[]>(`/notes/${path}`).then((res) => {
      if (res.success) setNotes(res.data);
      else setError(res.message);
      setLoading(false);
    });
  }, [path]);

  const handleGenerate = async (collectionId: string) => {
    setGenerating(collectionId);
    setShowCollections(false);
    const res = await api.post<any>(`/notes/${path}`, { collection_id: collectionId });
    setGenerating(null);
    if (!res.success) { setError(res.message); return; }
    const newNote = res.data;
    setNotes((prev) => [newNote, ...prev]);
    onOpen(toNoteContent(newNote, methodId), methodId);
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Sheet panel */}
      <div
        className="relative w-full max-w-md h-full bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{methodIcon}</span>
            <div>
              <h2 className="font-bold text-base">{methodName}</h2>
              <p className="text-xs text-muted-foreground">Your saved notes</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Generate new */}
        <div className="px-6 py-4 border-b bg-muted/30">
          {!showCollections ? (
            <Button
              className="w-full rounded-xl gap-2 font-bold"
              onClick={() => setShowCollections(true)}
              disabled={!!generating}
            >
              {generating ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {generating ? "Generating…" : "Generate New Note"}
              {!generating && <Sparkle className="w-3.5 h-3.5 ml-auto" weight="fill" />}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Select a collection</p>
              {collectionsLoading ? (
                <Skeleton className="h-10 rounded-xl" />
              ) : collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collections found.</p>
              ) : (
                collections.map((col) => (
                  <button
                    key={col.collection_id}
                    onClick={() => handleGenerate(col.collection_id)}
                    className="w-full text-left p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-semibold text-sm">{col.title ?? "Untitled"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{col.description ?? ""}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                  </button>
                ))
              )}
              <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setShowCollections(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}

          {!loading && error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/50 text-muted-foreground text-sm">
              <Warning className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">{methodIcon}</div>
              <p className="font-semibold text-sm">No {methodName} notes yet</p>
              <p className="text-xs text-muted-foreground">Generate your first note from a collection above.</p>
            </div>
          )}

          {!loading && notes.map((note) => {
            const col = collections.find((c) => c.collection_id === note.collection_id);
            return (
              <div
                key={note.note_id}
                className="p-4 rounded-xl border bg-card hover:shadow-md transition-all group cursor-pointer"
                onClick={() => onOpen(toNoteContent(note, methodId), methodId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{note.title ?? "Untitled"}</p>
                    {col && <p className="text-xs text-muted-foreground mt-0.5 truncate">{col.title}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="rounded-full text-[10px]">{methodName}</Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
