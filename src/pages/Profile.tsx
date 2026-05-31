import { useState, useEffect, useRef, useMemo } from "react";
import {
  Envelope,
  PencilSimple,
  Trash,
  Clock,
  Stack,
  Warning,
  CircleNotch,
  Calendar,
  FileText,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { cn, getAvatarUrl } from "@/lib/utils";
import { examResults } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalState } from "@/contexts/GlobalStateContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collectionsService, Collection } from "@/services/collectionsService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { avatarUrl } = useGlobalState();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Avatar Management State
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memoizedAvatarUrl = useMemo(() => avatarUrl || getAvatarUrl(user?.avatar_url), [avatarUrl, user?.avatar_url]);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const data = await collectionsService.getCollections();
      setCollections(data);
    } catch (error: any) {
      console.error("Failed to fetch collections:", error);
      toast.error("Failed to load your collections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleDelete = async (collectionId: string) => {
    setIsDeleting(collectionId);
    try {
      await collectionsService.deleteCollection(collectionId);
      toast.success("Collection deleted successfully");
      setCollections(prev => prev.filter(c => c.collection_id !== collectionId));
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to delete collection";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 lg:p-12 max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Clean Profile Header */}
        <div className="relative mb-12">
          <div className="h-32 md:h-48 rounded-2xl md:rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 w-full overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
          </div>

          <div className="px-4 md:px-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 -mt-12 md:-mt-16 relative z-10 text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-background border-4 border-background shadow-2xl flex items-center justify-center overflow-hidden relative group">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={memoizedAvatarUrl} alt={user?.full_name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-3xl md:text-4xl font-black text-primary">
                  {user?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              {isAvatarUploading && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20 backdrop-blur-sm">
                  <CircleNotch className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">{user?.full_name || "Student"}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-2"><Envelope weight="bold" className="shrink-0" /> <span className="truncate max-w-[200px]">{user?.email}</span></span>
              </div>
            </div>

            <Button
              variant="outline"
              className="mb-2 rounded-full font-bold w-full md:w-auto"
              onClick={() => navigate("/settings")}
            >
              <PencilSimple className="mr-2" /> Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Exam History */}
          <div className="bg-card border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Clock className="text-primary" weight="bold" />
                Recent Exams
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/exam-history')} className="text-xs font-bold text-primary">View All</Button>
            </div>
            <div className="space-y-4">
              {examResults.slice(0, 4).map(exam => (
                <div key={exam.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-muted/5 hover:bg-muted/30 transition-all group">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-transform group-hover:scale-105",
                    exam.score >= 90 ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                  )}>
                    {exam.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm md:text-base truncate">{exam.courseName}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {new Date(exam.date).toLocaleDateString()}
                    </div>
                  </div>
                  {exam.improvement > 0 && (
                    <Badge className="bg-green-500/10 text-green-600 border-none text-[10px]">+{exam.improvement}%</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* My Collections Section */}
          <div className="bg-card border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Stack className="text-primary" weight="bold" />
                My Collections
              </h3>
              <Badge variant="secondary" className="font-bold">{collections.length} Total</Badge>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse border border-dashed" />
                ))}
              </div>
            ) : collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed rounded-2xl bg-muted/5">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">No collections yet</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Upload materials to build your study library</p>
                </div>
                <Button size="sm" onClick={() => navigate('/upload')} className="rounded-full font-bold">Start Uploading</Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {collections.map(collection => (
                  <div key={collection.collection_id} className="group relative p-4 rounded-2xl border bg-card hover:border-primary/30 transition-all hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                        {collection.icon || <FileText weight="fill" />}
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h4 className="font-bold text-sm md:text-base truncate group-hover:text-primary transition-colors">{collection.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{collection.description || "No description provided"}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(collection.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => setDeleteConfirmId(collection.collection_id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning weight="fill" className="text-destructive w-6 h-6" />
              Delete Collection?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. All materials associated with this collection will remain in the library, but the collection itself will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Collection"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
