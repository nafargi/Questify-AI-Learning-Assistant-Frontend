export interface Material {
  material_id: string;
  user_id: string;
  file_name: string;
  file_key: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface AnalysisJob {
  job_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

export interface AnalysisJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  data?: unknown;
  error?: string;
}

export type ProgressCallback = (progress: number) => void;
