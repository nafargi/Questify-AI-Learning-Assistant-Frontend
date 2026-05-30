import { Material } from './material.types';

export interface Chapter {
  id: string;
  collection_id: string;
  title: string;
  summary?: string;
  page_start?: number;
  page_end?: number;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  materials?: Material[];
  chapters?: Chapter[];
}
