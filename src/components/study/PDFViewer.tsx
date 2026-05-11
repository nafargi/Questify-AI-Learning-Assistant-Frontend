import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Highlighter,
    MagnifyingGlassPlus,
    MagnifyingGlassMinus,
    ArrowsOut,
    ArrowsIn,
    CircleNotch,
    FilePdf,
    Warning,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
    /** Authenticated blob URL or direct URL to the PDF */
    pdfUrl?: string | null;
    /** Display name shown in the toolbar */
    title?: string;
    /** Optional highlight callback */
    onHighlight?: (text: string) => void;
    className?: string;
}

export function PDFViewer({ pdfUrl, title = "Document", onHighlight, className }: PDFViewerProps) {
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    // Reset loaded state when URL changes
    useEffect(() => {
        setIframeLoaded(false);
    }, [pdfUrl]);

    const zoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
    const zoomOut = () => setZoom(prev => Math.max(prev - 20, 50));
    const resetZoom = () => setZoom(100);

    return (
        <div
            className={cn(
                "flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden border rounded-lg",
                isFullscreen
                    ? "fixed inset-0 z-[200] rounded-none border-none"
                    : "h-full",
                className
            )}
        >
            {/* ── Toolbar ── */}
            <div className="h-12 bg-white dark:bg-slate-800 border-b flex items-center justify-between px-3 shrink-0 z-10 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FilePdf className="w-4 h-4 text-red-500 shrink-0" weight="fill" />
                    <span className="text-xs font-semibold truncate text-muted-foreground">
                        {title}
                    </span>
                    {pdfUrl && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5 shrink-0">
                            {zoom}%
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {onHighlight && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onHighlight("Highlighted from: " + title)}
                            title="Highlight"
                            className="h-8 w-8"
                        >
                            <Highlighter className="w-4 h-4 text-yellow-500" />
                        </Button>
                    )}
                    <div className="w-px h-4 bg-border/50 mx-0.5" />
                    <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8" disabled={!pdfUrl}>
                        <MagnifyingGlassMinus className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetZoom}
                        className="h-8 w-8 text-[10px] font-bold"
                        disabled={!pdfUrl}
                    >
                        1:1
                    </Button>
                    <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8" disabled={!pdfUrl}>
                        <MagnifyingGlassPlus className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-border/50 mx-0.5" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsFullscreen(f => !f)}
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen
                            ? <ArrowsIn className="w-4 h-4" />
                            : <ArrowsOut className="w-4 h-4" />
                        }
                    </Button>
                </div>
            </div>

            {/* ── PDF Content ── */}
            <div className="flex-1 relative overflow-auto bg-slate-200 dark:bg-slate-950 flex items-start justify-center p-4">
                {!pdfUrl ? (
                    /* No PDF loaded */
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                            <FilePdf className="w-8 h-8 opacity-30" />
                        </div>
                        <p className="text-sm font-medium text-center">
                            PDF not available.<br />
                            <span className="text-xs opacity-60">The document could not be loaded from the server.</span>
                        </p>
                    </div>
                ) : (
                    <div
                        className="relative origin-top shadow-2xl bg-white transition-all duration-200"
                        style={{
                            width: `${zoom}%`,
                            minWidth: zoom < 100 ? '100%' : undefined,
                        }}
                    >
                        {/* Loading spinner overlay */}
                        {!iframeLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white z-10" style={{ minHeight: '400px' }}>
                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                    <CircleNotch className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-xs font-medium">Loading document...</span>
                                </div>
                            </div>
                        )}
                        <iframe
                            src={pdfUrl}
                            className="w-full border-none min-h-[calc(100vh-100px)]"
                            style={{ height: '100%' }}
                            title={title}
                            onLoad={() => setIframeLoaded(true)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
