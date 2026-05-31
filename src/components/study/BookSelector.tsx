import { useEffect, useState } from "react";
import { Books, ArrowRight, Warning, CircleNotch } from "@phosphor-icons/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { collectionsService, Collection } from "@/services/collectionsService";
import { Link } from "react-router-dom";

interface BookSelectorProps {
  onSelect: (collection: Collection) => void;
}

export function BookSelector({ onSelect }: BookSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    collectionsService.getCollections()
      .then(setCollections)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center p-8 min-h-[80vh]">
        <div className="max-w-5xl w-full space-y-8">
          <div className="text-left space-y-2 border-b pb-6">
            <h1 className="text-3xl font-black tracking-tight">Select a Collection</h1>
            <p className="text-muted-foreground">Choose a study collection to begin your session.</p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
              <Warning className="w-5 h-5 shrink-0" />{error}
            </div>
          )}

          {!loading && !error && collections.length === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
              <Books className="w-5 h-5 shrink-0" />
              No collections found.{" "}
              <Link to="/upload" className="text-primary underline ml-1">Upload materials</Link> first.
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => (
                <button
                  key={col.collection_id}
                  onClick={() => onSelect(col)}
                  className="group relative flex flex-col items-start p-6 border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 text-left rounded-lg"
                >
                  <div className="p-3 rounded-xl bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                    <Books className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {col.title ?? "Untitled Collection"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{col.description ?? ""}</p>
                  <div className="mt-auto w-full pt-4 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    <span>{new Date(col.created_at).toLocaleDateString()}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
