export type StudyMethod = 'pomodoro' | 'feynman' | 'leitner' | 'sq3r' | 'active-recall';

export interface BaseStudy {
  study_id: string;
  collection_id: string;
  created_at: string;
}

export interface PomodoroSession { task: string; duration_min: number; break_min: number; }
export interface PomodoroSchedule extends BaseStudy {
  sessions: PomodoroSession[];
}

export interface FeynmanExplanation extends BaseStudy {
  topic: string;
  simple_explanation: string;
  gaps: string[];
  analogies: string[];
}

export interface LeitnerCard { question: string; answer: string; box: number; }
export interface LeitnerSystem extends BaseStudy {
  cards: LeitnerCard[];
}

export interface SQ3RGuide extends BaseStudy {
  survey: string[];
  questions: string[];
  read_notes: string;
  recite: string[];
  review: string;
}

export interface ActiveRecallItem { question: string; hint: string; }
export interface ActiveRecallSession extends BaseStudy {
  items: ActiveRecallItem[];
}

export type AnyStudy = PomodoroSchedule | FeynmanExplanation | LeitnerSystem | SQ3RGuide | ActiveRecallSession;
