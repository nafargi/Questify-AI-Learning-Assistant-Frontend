import { MindMapNode, NoteContent } from "@/types/notes";
import { cn } from "@/lib/utils";
import { TreeStructure, Info } from "@phosphor-icons/react";

interface MindMapProps {
  content: NoteContent;
}

const NodeRenderer = ({ node, level = 0 }: { node: MindMapNode; level?: number }) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "p-4 rounded-2xl border-2 transition-all hover:scale-105 shadow-sm group relative",
          level === 0 
            ? "bg-primary text-primary-foreground border-primary w-48 text-center font-black text-lg" 
            : "bg-card border-border min-w-[180px] max-w-[250px]"
        )}
      >
        <p className={cn("font-bold", level === 0 ? "text-xl" : "text-sm")}>{node.label}</p>
        {node.notes && (
          <div className="mt-2 text-[10px] opacity-70 italic line-clamp-2 border-t pt-2 border-black/5">
            {node.notes}
          </div>
        )}
        
        {/* Connection Line to Children */}
        {node.children && node.children.length > 0 && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border" />
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className="flex gap-8 mt-12 relative">
          {/* Horizontal Connector Line */}
          {node.children.length > 1 && (
            <div className="absolute -top-6 left-[10%] right-[10%] h-0.5 bg-border" />
          )}
          
          {node.children.map((child, idx) => (
            <div key={idx} className="relative pt-6">
              {/* Vertical Tick to Horizontal Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border" />
              <NodeRenderer node={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MindMapNote = ({ content }: MindMapProps) => {
  if (!content || !content.root) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 text-muted-foreground border-2 border-dashed rounded-[3rem]">
        <TreeStructure className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">Mind map data structure is invalid or missing.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-12 px-4 scrollbar-hide">
      <div className="flex flex-col items-center min-w-max mx-auto">
        <NodeRenderer node={content.root} />
      </div>

      <div className="mt-20 p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4 max-w-2xl mx-auto">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Cognitive Map Insight</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This mind map visualizes the hierarchical relationships between key concepts. 
            The central node represents your core topic, while branches represent sub-topics and details.
          </p>
        </div>
      </div>
    </div>
  );
};
