export type QuizType = 'SNOT22' | 'NOSE' | 'HHIA' | 'EPWORTH' | 'DHI' | 'STOP' | 'TNSS' | 'SNOT12' | 'SYMPTOM_CHECKER' | 'NOSE_SNOT';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  type?: 'multiple_choice' | 'likert_scale';
}

export interface Quiz {
  id: QuizType;
  title: string;
  description: string;
  questions: QuizQuestion[];
  maxScore: number;
  scoring: Object;
}

export interface QuizResult {
  score: number;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  interpretation: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  quiz_type: string;
  score: number;
  submitted_at: string;
  doctor_id: string;
  lead_status?: string;
  lead_source?: string;
  answers?: any;
  created_at?: string;
  scheduled_date?: string;
  incident_source?: string;
  custom_quiz_id?: string;
  quiz_title?: string;
}

export interface QuizIncident {
  id: string;
  name: string;
  description?: string;
  doctor_id: string;
  created_at?: string;
}
