export type NoteMethod = 'cornell' | 'sentence' | 'boxing' | 'outline' | 'mind-map' | 'charting';

export interface BaseNote {
  note_id: string;
  collection_id: string;
  created_at: string;
}

export interface CornellNote extends BaseNote {
  cue_column: string[];
  notes_column: string;
  summary: string;
}

export interface SentenceNote extends BaseNote {
  sentences: string[];
}

export interface BoxingNote extends BaseNote {
  boxes: Array<{ title: string; content: string }>;
}

export interface OutlineNote extends BaseNote {
  outline: Array<{ heading: string; points: string[] }>;
}

export interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
}

export interface MindMapNote extends BaseNote {
  root: MindMapNode;
}

export interface ChartingNote extends BaseNote {
  headers: string[];
  rows: string[][];
}

export type AnyNote = CornellNote | SentenceNote | BoxingNote | OutlineNote | MindMapNote | ChartingNote;
