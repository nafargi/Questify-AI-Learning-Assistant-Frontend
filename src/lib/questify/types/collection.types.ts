export interface Collection {
  collection_id: string;
  user_id: string;
  title: string;
  confidence: number | null;
  created_at: string;
  material_ids: string[];
}

export interface Chapter {
  chapter_id: string;
  collection_id: string;
  title: string;
  summary: string;
  order: number;
}
