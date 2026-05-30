export interface Material {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
}

export interface AnalysisJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error?: string;
  progress?: number;
}

export interface AnalysisJob {
  job_id: string;
  status: string;
  message: string;
}
