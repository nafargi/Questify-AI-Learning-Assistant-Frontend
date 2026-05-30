export type StudyMethod = 'pomodoro' | 'feynman' | 'leitner' | 'sq3r' | 'active-recall';

export interface BaseStudySession {
  id: string;
  collection_id: string;
  method: StudyMethod;
  created_at: string;
}

export interface PomodoroPlan extends BaseStudySession {
  method: 'pomodoro';
  sessions: { topic: string; duration_minutes: number }[];
}

export interface FeynmanExplanation extends BaseStudySession {
  method: 'feynman';
  concept: string;
  explanation: string;
  analogies: string[];
}

export interface LeitnerSystem extends BaseStudySession {
  method: 'leitner';
  boxes: Record<string, { front: string; back: string }[]>;
}

export interface SQ3RGuide extends BaseStudySession {
  method: 'sq3r';
  survey: string[];
  question: string[];
  read: string[];
  recite: string[];
  review: string[];
}

export interface ActiveRecallSession extends BaseStudySession {
  method: 'active-recall';
  prompts: string[];
}

export type AnyStudySession =
  | PomodoroPlan
  | FeynmanExplanation
  | LeitnerSystem
  | SQ3RGuide
  | ActiveRecallSession;
