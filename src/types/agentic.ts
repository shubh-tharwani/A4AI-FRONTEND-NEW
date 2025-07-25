export interface AgenticPipelineStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  current_task?: string;
  progress?: number;
  error?: string;
  timestamp: string;
}

export interface LessonPlanRequest {
  topic: string;
  grade_level: string;
  duration: number;
  learning_objectives: string[];
  subject_area: string;
}

export interface ContentGenerationRequest {
  topic: string;
  grade_level: string;
  content_type: 'text' | 'interactive' | 'multimedia';
  format: 'markdown' | 'html';
  length: 'short' | 'medium' | 'long';
}

export interface AssessmentRequest {
  topic: string;
  grade_level: string;
  assessment_type: 'quiz' | 'test' | 'assignment';
  question_count: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface VisualAidRequest {
  topic: string;
  grade_level: string;
  aid_type: 'diagram' | 'infographic' | 'chart';
  style: 'modern' | 'classic' | 'playful';
  description: string;
}

export interface LessonPlanResponse {
  id: string;
  plan: {
    title: string;
    objectives: string[];
    materials: string[];
    activities: Array<{
      title: string;
      duration: number;
      description: string;
      instructions: string[];
    }>;
    assessment: {
      type: string;
      description: string;
    };
  };
  metadata: {
    grade_level: string;
    subject: string;
    duration: number;
    created_at: string;
  };
}

export interface ContentGenerationResponse {
  id: string;
  content: string;
  format: 'markdown' | 'html';
  metadata: {
    topic: string;
    grade_level: string;
    type: string;
    created_at: string;
  };
}

export interface AssessmentResponse {
  id: string;
  assessment: {
    title: string;
    instructions: string;
    questions: Array<{
      id: string;
      type: 'multiple_choice' | 'short_answer' | 'essay';
      question: string;
      options?: string[];
      correct_answer?: string;
      points: number;
    }>;
  };
  metadata: {
    topic: string;
    grade_level: string;
    difficulty: string;
    total_points: number;
    estimated_duration: number;
  };
}

export interface VisualAidResponse {
  id: string;
  visual_aid: {
    url: string;
    alt_text: string;
    caption: string;
    type: string;
  };
  metadata: {
    topic: string;
    grade_level: string;
    style: string;
    created_at: string;
  };
}
