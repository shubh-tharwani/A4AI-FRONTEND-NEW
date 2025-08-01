// API Types based on backend OpenAPI specification

export interface User {
  id: string;
  email: string;
  display_name?: string;
  role: 'student' | 'teacher' | 'admin';
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  display_name?: string;
  role?: 'student' | 'teacher' | 'admin';
  firstName?: string;  // Keep for compatibility
  lastName?: string;   // Keep for compatibility
}

export interface AuthResponse {
  status: string;
  message: string;
  user_data?: Record<string, any>;
  tokens?: Record<string, any>;
}

// Education Types
export interface ActivityRequest {
  grade: number;
  topic: string;
  activity_type?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
}

export interface Story {
  id?: string;
  title: string;
  content: string;
  summary: string;
  grade: number;
  topic: string;
  language: string;
  learning_objectives?: string[];
  discussion_questions?: string[];
  vocabulary_words?: string[];
  audio_filename?: string;
  created_at?: string;
}

export interface EducationResponse {
  status: string;
  message: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

// Assessment Types
export interface QuizRequest {
  grade: number;
  topic: string;
  language?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// Quiz Response - Backend returns direct structure
export interface QuizResponse {
  questions: QuizQuestion[];
  assessment_id: string;
}

export interface ScoreRequest {
  answer: string;
  rubric: string;
}

export interface PerformanceUpdateRequest {
  correct_count: number;
  total_questions: number;
}

// Voice Assistant Types
export interface TextRequest {
  user_id: string;
  message: string;
  session_id?: string;
  context?: Record<string, any>;
  generate_audio?: boolean;
}

export interface VoiceSession {
  session_id: string;
  user_id: string;
  messages: VoiceMessage[];
  created_at: string;
  updated_at: string;
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  audio_url?: string;
  audio_file_path?: string;
  audio_filename?: string;
  ai_response?: string;
  transcript?: string;
  status?: string;
  session_id?: string;
  attachments?: ChatAttachment[];
  metadata?: MessageMetadata;
}

// Enhanced ChatGPT-like Assistant Types
export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'text';
  url: string;
  size: number;
  mimeType: string;
  preview?: string;
}

export interface MessageMetadata {
  tokens?: number;
  model?: string;
  processing_time?: number;
  confidence?: number;
  language?: string;
  input_type?: string;
  tokens_used?: number;
  file_count?: number;
  character_count?: number;
}

export interface EnhancedAssistantRequest {
  user_id: string;
  message: string;
  session_id: string;
  audio_url?: string;
  audio_file?: File;
  file_upload?: File;
  attachments?: ChatAttachment[];
  metadata?: any;
  suggestions?: string[];
  follow_up_questions?: string[];
  ai_response?: string;
  files?: File[];  // Keep for compatibility
  conversation_history?: any[];  // Keep for compatibility
  context?: Record<string, any>;
  query?: string;
  preferences?: {
    response_format?: 'text' | 'audio' | 'both' | 'auto';
    generate_audio?: boolean;
    language?: string;
    response_style?: 'educational' | 'conversational' | 'formal' | 'creative';
    max_tokens?: number;
  };
}

export interface EnhancedAssistantResponse {
  message: string;
  session_id: string;
  audio_url?: string;
  audio?: string;
  voice_url?: string;
  audio_file_path?: string;
  audio_filename?: string;
  transcript?: string;
  status?: string;
  attachments?: ChatAttachment[];
  files?: ChatAttachment[];
  metadata: MessageMetadata;
  suggestions?: string[];
  hints?: string[];
  follow_up_questions?: string[];
  followups?: string[];
  questions?: string[];
  ai_response?: string;
}

// Visual Aids Types (Backend OpenAPI 3.1.0 compliant)
export interface VisualAidRequest {
  topic: string;                     // Required: Topic for the visual aid
  grade: string;                     // Required: Grade level
  subject: string;                   // Required: Subject area
  visualType?: string;               // Optional: Type of visual aid (default: "infographic")
  style?: string;                    // Optional: Visual style (default: "modern") 
  color_scheme?: string;             // Optional: Color scheme (default: "blue")
  dimensions?: string;               // Optional: Image dimensions for Gemini (default: "1024x1024")
}

export interface VisualAidResponse {
  visual_aid_id: string;
  status: string;
  prompt: string;
  enhanced_prompt?: string;
  asset_type: string;
  image_url: string;
  filename: string;
  topic: string;
  metadata: VisualAidMetadata;
}

export interface VisualAidMetadata {
  generation_model: string;
  prompt_length: number;
  image_size: number;
  generated_at: string;
  aspect_ratio?: string;
  fallback_reason?: string;
}

// Planning Types
export interface LessonPlanRequest {
  class_id: string;
  plan_type?: 'daily' | 'weekly' | 'monthly';
  duration?: number;
  curriculum_standards?: string[];
  learning_objectives?: string[];
}

// Form-specific Lesson Plan Request (for creating lesson plans via form)
export interface LessonPlanFormRequest {
  grade: number;
  subject: string;
  topic: string;
  duration: number;
  language: string;
  date: string;
  start_time: string;
}

// Lesson Plan Model
export interface LessonPlan {
  id?: string;
  title: string;
  grade: number;
  subject: string;
  topic: string;
  duration: number;
  language: string;
  date?: string;
  start_time?: string;
  learning_objectives?: string[];
  curriculum_plan?: CurriculumUnit[];
  activities?: LessonActivity[];
  assessment?: string;
  resources?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumUnit {
  content: string;
  schedule: {
    start_time: string;
    materials: string;
    duration: number;
    activity: string;
    topic: string;
  };
  notes?: string;
}

export interface LessonActivity {
  name: string;
  description: string;
  duration: number;
  materials?: string[];
}

export interface LessonPlanResponse {
  status: string;
  plan_id: string;
  lesson_plan: LessonPlanContent;
  metadata: Record<string, any>;
  class_info?: Record<string, string>;
}

export interface LessonPlanContent {
  plan_overview: PlanOverview;
  daily_schedule: DailySchedule[];
  assessment_plan?: AssessmentPlan;
  resources?: Resources;
  differentiation?: Differentiation;
}

export interface PlanOverview {
  title: string;
  description: string;
  total_days: number;
  subjects_covered?: string[];
  key_themes?: string[];
  learning_outcomes?: string[];
}

export interface DailySchedule {
  day: number;
  date: string;
  is_holiday?: boolean;
  activities: Activity[];
  homework?: string;
  notes?: string;
}

export interface Activity {
  time: string;
  subject: string;
  topic: string;
  activity_type?: string;
  description: string;
  materials_needed?: string[];
  learning_objective?: string;
  assessment_method?: string;
}

export interface AssessmentPlan {
  formative_assessments?: string[];
  summative_assessments?: string[];
  grading_criteria?: string[];
}

export interface Resources {
  required_materials?: string[];
  digital_tools?: string[];
  reference_books?: string[];
}

export interface Differentiation {
  advanced_learners?: string[];
  struggling_learners?: string[];
  english_language_learners?: string[];
}

// Activities Types
export interface InteractiveStoryRequest {
  grade: number;
  topic: string;
}

export interface InteractiveStoryResponse {
  story_id: string;
  title: string;
  story_text: string;
  think_about_it?: string;              // Additional field from actual backend
  what_you_learn?: string;              // Additional field from actual backend
  learning_objectives: string[];
  vocabulary_words: string[];
  audio_filename: string;
  grade_level: number;
  topic: string;
  language?: string;                    // Additional field from actual backend
  subject?: string;                     // Additional field from actual backend
}

export interface ARSceneRequest {
  topic: string;
  grade_level?: number;
}

export interface ARSceneResponse {
  scene_id: string;
  scene_name: string;
  educational_objective: string;
  environment: AREnvironment;
  objects: ARObject[];
  interactions: ARInteraction[];
  technical_requirements?: string[];
  assessment_opportunities?: string[];
  grade_level?: number;
  subject_area?: string;
}

export interface AREnvironment {
  setting: string;
  lighting?: string;
  atmosphere?: string;
  size_scale?: string;
}

export interface ARObject {
  name: string;
  description: string;
  interactions: string[];
  learning_purpose: string;
}

export interface ARInteraction {
  type: string;
  description: string;
  learning_outcome: string;
  feedback_mechanism: string;
}

// Badge Types
export interface BadgeAssignmentRequest {
  user_id: string;
  badge_name: string;
  criteria_met?: Record<string, any>;
}

export interface UserBadge {
  badge_id: string;
  badge: string;
  assigned_at: string;
  badge_type: string;
  points_earned: number;
  description: string;
  rarity: string;
  display_name: string;
  icon_url: string;
  achievement_date?: string;
}

// Dashboard Types
export interface TeacherDashboardResponse {
  status: string;
  message: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface StudentHistoryResponse {
  status: string;
  message: string;
  student_data: Record<string, any>;
  metadata: Record<string, any>;
}

// Utility Types
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Common API Response
export interface BaseResponse {
  status: string;
  message: string;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

// Personalization Types
export interface PersonalizationResponse {
  status: string;
  message: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface TeacherSummaryRequest {
  class_id: string;
}
