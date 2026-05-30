export type NoteMethod = 'cornell' | 'sentence' | 'boxing' | 'outline' | 'mind-map' | 'charting';

export interface BaseNote {
  id: string;
  collection_id: string;
  method: NoteMethod;
  created_at: string;
}

export interface CornellNote extends BaseNote {
  method: 'cornell';
  cues: string[];
  notes: string;
  summary: string;
}

export interface SentenceNote extends BaseNote {
  method: 'sentence';
  sentences: string[];
}

export interface BoxingNote extends BaseNote {
  method: 'boxing';
  boxes: { title: string; content: string[] }[];
}

export interface OutlineNote extends BaseNote {
  method: 'outline';
  outline: { topic: string; subtopics: string[] }[];
}

export interface MindMapNote extends BaseNote {
  method: 'mind-map';
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string }[];
}

export interface ChartingNote extends BaseNote {
  method: 'charting';
  headers: string[];
  rows: string[][];
}

export type AnyNote = 
  | CornellNote 
  | SentenceNote 
  | BoxingNote 
  | OutlineNote 
  | MindMapNote 
  | ChartingNote;
