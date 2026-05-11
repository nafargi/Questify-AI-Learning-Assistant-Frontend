export interface NoteContent {
    note_id: string;
    collection_id: string;
    title: string;
    method: 'cornell' | 'outline' | 'mind_map' | 'boxing' | 'charting' | 'sentence';
    created_at: string;
    
    // Cornell
    cues?: { keyword: string; content: string }[];
    summary?: string;
    
    // Sentence
    sections?: {
        content: string;
        heading?: string; // Used in Outline
        bullets?: string[]; // Used in Outline
    }[];
    
    // Boxing
    boxes?: {
        title: string;
        items: string[];
        color?: string;
    }[];
    
    // Charting
    columns?: string[];
    rows?: string[][];
    
    // Mind Map
    root?: MindMapNode;
}

export interface MindMapNode {
    label: string;
    notes?: string;
    children: MindMapNode[];
}
