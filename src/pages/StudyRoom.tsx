import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { StudyMethodId } from "@/types/study";
import { StudyMethodSelector } from "@/components/study/StudyMethodSelector";
import { BookSelector } from "@/components/study/BookSelector";
import { PomodoroMethod } from "@/components/study/methods/PomodoroMethod";
import { FeynmanMethod } from "@/components/study/methods/FeynmanMethod";
import { SQ3RMethod } from "@/components/study/methods/SQ3RMethod";
import { LeitnerSystem } from "@/components/study/methods/LeitnerSystem";
import { ActiveRecall } from "@/components/study/methods/ActiveRecall";
import { Layout } from "@/components/layout/Layout";
import { Collection } from "@/services/collectionsService";
import { studyService } from "@/services/studyService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkle, CircleNotch, ArrowLeft, Warning } from "@phosphor-icons/react";

const SUPPORTED_METHODS: StudyMethodId[] = [
  "pomodoro",
  "feynman",
  "leitner",
  "sq3r",
  "active_recall",
];

// Methods that are self-contained (e.g. a timer) and can render
// even when no backend session data exists yet.
const SELF_STARTING_METHODS: StudyMethodId[] = ["pomodoro"];

// Maps a StudyMethodId to the matching named GET and POST service methods
const methodServiceMap: Record<
  StudyMethodId,
  {
    generate: (id: string) => Promise<any>;
    fetch: (id: string) => Promise<any>;
  }
> = {
  pomodoro: {
    generate: studyService.generatePomodoro,
    fetch: studyService.getPomodoro,
  },
  feynman: {
    generate: studyService.generateFeynman,
    fetch: studyService.getFeynman,
  },
  leitner: {
    generate: studyService.generateLeitner,
    fetch: studyService.getLeitner,
  },
  sq3r: {
    generate: studyService.generateSQ3R,
    fetch: studyService.getSQ3R,
  },
  active_recall: {
    generate: studyService.generateActiveRecall,
    fetch: studyService.getActiveRecall,
  },
};

export default function StudyRoom() {
  const location = useLocation();
  const { chapterId, courseId } = location.state || {};

  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [activeMethod, setActiveMethod] = useState<StudyMethodId | null>(null);

  // API Data States
  const [studyData, setStudyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // ── Fetch existing data for the selected method + collection ──────────────
  const fetchStudyData = useCallback(
    async (method: StudyMethodId, collectionId: string) => {
      if (!SUPPORTED_METHODS.includes(method)) return;

      setIsLoading(true);
      setStudyData(null);
      try {
        const data = await methodServiceMap[method].fetch(collectionId);
        setStudyData(data ?? null);
        console.log(`[StudyRoom] GET ${method} success`, data);
      } catch (error: any) {
        console.error(`[StudyRoom] GET ${method} failed:`, error);
        if (error.response?.status === 404) {
          if (SELF_STARTING_METHODS.includes(method as StudyMethodId)) {
            // Self-starting methods (e.g. Pomodoro timer) work without prior data.
            // Set an empty object so the component still renders.
            setStudyData({});
          } else {
            // Other methods need generated content — show the "Initialize" prompt.
            toast.info(
              "No study session found yet. Click Initialize to generate content."
            );
            setStudyData(null);
          }
        } else {
          toast.error(
            error.response?.data?.message || "Failed to load study data."
          );
          setStudyData(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── POST to generate, then GET to show ────────────────────────────────────
  const handleInitialize = async () => {
    if (!activeMethod || !activeCollection) return;

    const collectionId = activeCollection.collection_id;
    const svc = methodServiceMap[activeMethod];

    setIsInitializing(true);
    try {
      console.log(
        `[StudyRoom] Generating ${activeMethod} for collection ${collectionId}…`
      );
      await svc.generate(collectionId);
      toast.success("Study session initialized!");

      // Immediately fetch the freshly generated data
      const data = await svc.fetch(collectionId);
      setStudyData(data ?? null);
      console.log(`[StudyRoom] POST+GET ${activeMethod} success`, data);
    } catch (error: any) {
      console.error(`[StudyRoom] Initialize ${activeMethod} failed:`, error);
      if (error.response?.status === 404) {
        toast.error(
          "This study technique is not yet available for this collection."
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to initialize technique."
        );
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // ── Auto-fetch when collection or method changes ──────────────────────────
  useEffect(() => {
    if (activeCollection && activeMethod) {
      fetchStudyData(activeMethod, activeCollection.collection_id);
    } else {
      setStudyData(null);
    }
  }, [activeCollection, activeMethod, fetchStudyData]);

  // ── Clear study data when user picks a different collection ───────────────
  const handleCollectionSelect = (collection: Collection) => {
    setStudyData(null);
    setActiveMethod(null);
    setActiveCollection(collection);
  };

  // ── UI Flow ───────────────────────────────────────────────────────────────
  if (!activeCollection) {
    return <BookSelector onSelect={handleCollectionSelect} />;
  }

  if (!activeMethod) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setActiveCollection(null)}
          className="absolute top-8 left-8 z-50 gap-2"
        >
          <ArrowLeft /> Change Collection
        </Button>
        <StudyMethodSelector onSelect={setActiveMethod} />
      </div>
    );
  }

  // ── Active Session Layout ─────────────────────────────────────────────────
  const renderMethodContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <CircleNotch className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">
            Retrieving cognitive assets…
          </p>
        </div>
      );
    }

    // Self-starting methods always render even if studyData is empty
    const needsInit = !studyData && !SELF_STARTING_METHODS.includes(activeMethod);

    if (needsInit) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] max-w-xl mx-auto text-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/40">
            <Sparkle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Technique Not Initialized</h2>
            <p className="text-muted-foreground">
              You haven't generated study assets for{" "}
              <strong>{activeMethod.replace("_", " ")}</strong> using{" "}
              <strong>{activeCollection.title}</strong> yet.
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleInitialize}
            disabled={isInitializing}
            className="rounded-xl px-8 h-12 gap-2 font-bold shadow-lg"
          >
            {isInitializing ? (
              <CircleNotch className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkle className="w-4 h-4" />
            )}
            {isInitializing
              ? "Generating…"
              : `Initialize ${activeMethod.replace("_", " ")}`}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveMethod(null)}
            className="text-muted-foreground"
          >
            Choose different method
          </Button>
        </div>
      );
    }

    const commonProps = {
      chapterId: chapterId || "demo-chapter",
      courseId: courseId || "demo-course",
      bookFilename: activeCollection.title,
      collectionId: activeCollection.collection_id,
      studyData,
      onBack: () => setActiveMethod(null),
    };

    switch (activeMethod) {
      case "pomodoro":
        return <PomodoroMethod {...commonProps} />;
      case "feynman":
        return <FeynmanMethod {...commonProps} />;
      case "sq3r":
        return <SQ3RMethod {...commonProps} />;
      case "leitner":
        return <LeitnerSystem {...commonProps} />;
      case "active_recall":
        return <ActiveRecall {...commonProps} />;
      default:
        return (
          <div className="p-20 text-center space-y-4">
            <Warning className="w-12 h-12 mx-auto text-amber-500" />
            <h3 className="text-xl font-bold">Technique Integration Pending</h3>
            <p className="text-muted-foreground">
              The <strong>{activeMethod}</strong> method is not yet fully
              integrated with the production API.
            </p>
            <Button onClick={() => setActiveMethod(null)}>
              Back to Selection
            </Button>
          </div>
        );
    }
  };

  return (
    <Layout showSidebar={false} title="Study Immersion Room">
      {renderMethodContent()}
    </Layout>
  );
}
