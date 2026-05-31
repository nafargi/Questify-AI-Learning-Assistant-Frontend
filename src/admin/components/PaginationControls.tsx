import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  hasMore: boolean;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  pageSize?: number;
}

export function PaginationControls({
  page,
  hasMore,
  loading = false,
  onPrev,
  onNext,
  pageSize = 50,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <span className="text-sm text-muted-foreground">
        Page {page + 1} · {pageSize} per page
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page === 0 || loading}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasMore || loading}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
