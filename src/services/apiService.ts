import apiClient from '../lib/api';
import {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  QuizRequest,
  QuizResponse,
  ActivityRequest,
  EducationResponse,
  VisualAidRequest,
  VisualAidResponse,
  InteractiveStoryRequest,
  InteractiveStoryResponse,
  ARSceneRequest,
  ARSceneResponse,
  LessonPlanRequest,
  LessonPlanResponse,
  TextRequest,
  EnhancedAssistantRequest,
  EnhancedAssistantResponse,
  VoiceSession,
  BadgeAssignmentRequest,
  UserBadge,
  TeacherDashboardResponse,
  PersonalizationResponse,
  PerformanceUpdateRequest,
  ScoreRequest
} from '../types';

// Authentication Service
export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/v1/auth/login', credentials);
  }

  static async signup(userData: SignupRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/v1/auth/signup', userData);
  }

  static async refreshToken(refreshToken: string): Promise<any> {
    return apiClient.post('/api/v1/auth/refresh-token', {
      refresh_token: refreshToken
    });
  }

  static async resetPassword(email: string): Promise<any> {
    return apiClient.post('/api/v1/auth/reset-password', { email });
  }

  static async verifyToken(): Promise<any> {
    return apiClient.get('/api/v1/auth/verify-token');
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/auth/health');
  }
}

// Assessment Service
export class AssessmentService {
  static async createQuiz(request: QuizRequest): Promise<QuizResponse> {
    return apiClient.post<QuizResponse>('/api/v1/assessment/quiz', request);
  }

  static async scoreAnswer(request: ScoreRequest): Promise<any> {
    return apiClient.post('/api/v1/assessment/score', request);
  }

  static async updatePerformance(request: PerformanceUpdateRequest): Promise<any> {
    return apiClient.post('/api/v1/assessment/performance', request);
  }

  static async getRecommendations(): Promise<any> {
    return apiClient.get('/api/v1/assessment/recommendations');
  }
}

// Education Service
export class EducationService {
  static async createActivity(request: ActivityRequest): Promise<EducationResponse> {
    return apiClient.post<EducationResponse>('/api/v1/education/activities', request);
  }

  static async createVisualAid(request: any): Promise<EducationResponse> {
    return apiClient.post<EducationResponse>('/api/v1/education/visual-aids', request);
  }

  static async createLessonPlan(request: any): Promise<EducationResponse> {
    return apiClient.post<EducationResponse>('/api/v1/education/lesson-plans', request);
  }

  static async getTemplates(): Promise<any> {
    return apiClient.get('/api/v1/education/templates');
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/education/health');
  }
}

// Activities Service
export class ActivitiesService {
  static async createInteractiveStory(request: InteractiveStoryRequest): Promise<InteractiveStoryResponse> {
    return apiClient.post<InteractiveStoryResponse>('/api/v1/activities/interactive-story', request);
  }

  static async createARScene(request: ARSceneRequest): Promise<ARSceneResponse> {
    return apiClient.post<ARSceneResponse>('/api/v1/activities/ar-scene', request);
  }

  static async assignBadge(request: BadgeAssignmentRequest): Promise<any> {
    return apiClient.post('/api/v1/activities/assign-badge', request);
  }

  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    return apiClient.get<UserBadge[]>(`/api/v1/activities/badges/${userId}`);
  }

  static async getMyBadges(): Promise<UserBadge[]> {
    return apiClient.get<UserBadge[]>('/api/v1/activities/my-badges');
  }

  static async getUserActivityHistory(userId: string, limit?: number, activityType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (activityType) params.append('activity_type', activityType);
    
    return apiClient.get<any[]>(`/api/v1/activities/user/${userId}?${params.toString()}`);
  }

  static async getMyActivities(limit?: number, activityType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (activityType) params.append('activity_type', activityType);
    
    return apiClient.get<any[]>(`/api/v1/activities/my-activities?${params.toString()}`);
  }
}

// Visual Aids Service
export class VisualAidsService {
  static async generateVisualAid(request: VisualAidRequest): Promise<VisualAidResponse> {
    return apiClient.post<VisualAidResponse>('/api/v1/visual-aids/generate', request);
  }

  static async createInfographic(request: any): Promise<any> {
    return apiClient.post('/api/v1/visual-aids/infographic', request);
  }

  static async getUserVisualAids(userId: string, limit?: number, assetType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (assetType) params.append('asset_type', assetType);
    
    return apiClient.get<any[]>(`/api/v1/visual-aids/user/${userId}?${params.toString()}`);
  }

  static async getMyVisualAids(limit?: number, assetType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (assetType) params.append('asset_type', assetType);
    
    return apiClient.get<any[]>(`/api/v1/visual-aids/my-visual-aids?${params.toString()}`);
  }

  static async searchVisualAids(topic: string, assetType?: string, gradeLevel?: number, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('topic', topic);
    if (assetType) params.append('asset_type', assetType);
    if (gradeLevel) params.append('grade_level', gradeLevel.toString());
    if (limit) params.append('limit', limit.toString());
    
    return apiClient.get<any[]>(`/api/v1/visual-aids/search?${params.toString()}`);
  }

  static async deleteVisualAid(visualAidId: string): Promise<any> {
    return apiClient.delete(`/api/v1/visual-aids/${visualAidId}`);
  }

  static async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/api/v1/visual-aids/categories');
  }

  static async getUserStats(userId: string): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>(`/api/v1/visual-aids/stats/${userId}`);
  }
}

// Planning Service
export class PlanningService {
  static async createLessonPlan(request: LessonPlanRequest): Promise<LessonPlanResponse> {
    return apiClient.post<LessonPlanResponse>('/api/v1/planning/lesson-plan', request);
  }

  static async createCurriculumPlan(request: any): Promise<any> {
    return apiClient.post('/api/v1/planning/curriculum-plan', request);
  }

  static async getLessonPlan(planId: string): Promise<any> {
    return apiClient.get(`/api/v1/planning/lesson-plan/${planId}`);
  }

  static async updateLessonPlan(planId: string, update: any): Promise<any> {
    return apiClient.put(`/api/v1/planning/lesson-plan/${planId}`, update);
  }

  static async deleteLessonPlan(planId: string): Promise<any> {
    return apiClient.delete(`/api/v1/planning/lesson-plan/${planId}`);
  }

  static async getClassPlans(classId: string, limit?: number, planType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (planType) params.append('plan_type', planType);
    
    return apiClient.get<any[]>(`/api/v1/planning/class/${classId}/plans?${params.toString()}`);
  }

  static async getMyPlans(limit?: number, planType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (planType) params.append('plan_type', planType);
    
    return apiClient.get<any[]>(`/api/v1/planning/my-plans?${params.toString()}`);
  }

  static async getTemplates(category?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    return apiClient.get<any[]>(`/api/v1/planning/templates?${params.toString()}`);
  }

  static async getSubjects(): Promise<string[]> {
    return apiClient.get<string[]>('/api/v1/planning/subjects');
  }

  static async getPlanTypes(): Promise<any[]> {
    return apiClient.get<any[]>('/api/v1/planning/plan-types');
  }
}

// Personalization Service
export class PersonalizationService {
  static async getDashboard(): Promise<PersonalizationResponse> {
    return apiClient.get<PersonalizationResponse>('/api/v1/personalization/dashboard');
  }

  static async getRecommendations(): Promise<PersonalizationResponse> {
    return apiClient.get<PersonalizationResponse>('/api/v1/personalization/recommendations');
  }

  static async getTeacherSummary(request: any): Promise<PersonalizationResponse> {
    return apiClient.post<PersonalizationResponse>('/api/v1/personalization/teacher-summary', request);
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/personalization/health');
  }
}

// Voice Assistant Service
export class VoiceService {
  // Enhanced ChatGPT-like universal assistant
  static async universalAssistant(request: EnhancedAssistantRequest): Promise<EnhancedAssistantResponse> {
    const formData = new FormData();
    
    // Add text message if provided
    if (request.message) {
      formData.append('message', request.message);
    }
    
    // Add user and session info
    formData.append('user_id', request.user_id);
    if (request.session_id) {
      formData.append('session_id', request.session_id);
    }
    
    // Add files if provided
    if (request.files && request.files.length > 0) {
      request.files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }
    
    // Add preferences and context
    if (request.preferences) {
      formData.append('preferences', JSON.stringify(request.preferences));
    }
    
    if (request.context) {
      formData.append('context', JSON.stringify(request.context));
    }
    
    // Add conversation history for context
    if (request.conversation_history && request.conversation_history.length > 0) {
      formData.append('conversation_history', JSON.stringify(request.conversation_history));
    }
    
    return apiClient.uploadFile('/api/v1/voice/assistant', formData as any);
  }

  // Legacy method for backward compatibility (deprecated)
  static async textChat(request: TextRequest): Promise<any> {
    // Convert legacy request to enhanced format
    const enhancedRequest: EnhancedAssistantRequest = {
      user_id: request.user_id,
      message: request.message,
      session_id: request.session_id,
      context: request.context,
      preferences: {
        generate_audio: request.generate_audio || false
      }
    };
    
    return this.universalAssistant(enhancedRequest);
  }

  // Legacy transcribe method (use universalAssistant with audio files instead)
  static async transcribeAudio(formData: FormData): Promise<any> {
    console.warn('transcribeAudio is deprecated. Use universalAssistant with audio files instead.');
    return apiClient.uploadFile('/api/v1/voice/transcribe', formData as any);
  }

  // Session management methods
  static async createSession(userId: string): Promise<VoiceSession> {
    return apiClient.post('/api/v1/voice/sessions', { user_id: userId });
  }

  static async getUserSessions(userId: string, limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    return apiClient.get(`/api/v1/voice/sessions/${userId}?${params.toString()}`);
  }

  static async getSession(userId: string, sessionId: string): Promise<any> {
    return apiClient.get(`/api/v1/voice/sessions/${userId}/${sessionId}`);
  }

  static async deleteSession(sessionId: string): Promise<any> {
    return apiClient.delete(`/api/v1/voice/sessions/${sessionId}`);
  }

  static async downloadAudio(filename: string): Promise<any> {
    return apiClient.get(`/api/v1/voice/audio/${filename}`);
  }

  static async getSupportedFormats(): Promise<any> {
    return apiClient.get('/api/v1/voice/supported-formats');
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/voice/health');
  }

  // Enhanced chat utilities
  static async getChatSuggestions(context: string): Promise<string[]> {
    return apiClient.post('/api/v1/voice/suggestions', { context });
  }

  static async getFollowUpQuestions(message: string): Promise<string[]> {
    return apiClient.post('/api/v1/voice/follow-up', { message });
  }
}

// Teacher Dashboard Service
export class TeacherDashboardService {
  static async getDashboard(classId?: string, includeAIRecommendations?: boolean): Promise<TeacherDashboardResponse> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (includeAIRecommendations !== undefined) params.append('include_ai_recommendations', includeAIRecommendations.toString());
    
    return apiClient.get<TeacherDashboardResponse>(`/api/v1/teacher-dashboard/dashboard?${params.toString()}`);
  }

  static async getStudentHistory(
    studentId: string, 
    options?: {
      includeAssessments?: boolean;
      includeActivities?: boolean;
      includePlans?: boolean;
      includeConversations?: boolean;
      limit?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options?.includeAssessments !== undefined) params.append('include_assessments', options.includeAssessments.toString());
    if (options?.includeActivities !== undefined) params.append('include_activities', options.includeActivities.toString());
    if (options?.includePlans !== undefined) params.append('include_plans', options.includePlans.toString());
    if (options?.includeConversations !== undefined) params.append('include_conversations', options.includeConversations.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    return apiClient.get(`/api/v1/teacher-dashboard/student-history/${studentId}?${params.toString()}`);
  }

  static async getClassAnalytics(classId?: string, days?: number): Promise<TeacherDashboardResponse> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (days) params.append('days', days.toString());
    
    return apiClient.get<TeacherDashboardResponse>(`/api/v1/teacher-dashboard/class-analytics?${params.toString()}`);
  }

  static async getStudentsList(classId?: string, includePerformance?: boolean, sortBy?: string): Promise<any> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (includePerformance !== undefined) params.append('include_performance', includePerformance.toString());
    if (sortBy) params.append('sort_by', sortBy);
    
    return apiClient.get(`/api/v1/teacher-dashboard/students-list?${params.toString()}`);
  }

  static async getPerformanceTrends(classId?: string, period?: string): Promise<TeacherDashboardResponse> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (period) params.append('period', period);
    
    return apiClient.get<TeacherDashboardResponse>(`/api/v1/teacher-dashboard/performance-trends?${params.toString()}`);
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/teacher-dashboard/health');
  }
}

// Orchestration Service (Agentic)
export class OrchestrationService {
  static async getPipelineStatus(): Promise<any> {
    return apiClient.get('/api/v1/agentic/pipeline/status');
  }

  static async orchestrateFlow(payload: Record<string, any>): Promise<any> {
    return apiClient.post('/api/v1/agentic/orchestrate', payload);
  }

  static async createCompleteLesson(request: any): Promise<any> {
    return apiClient.post('/api/v1/agentic/lesson/complete', request);
  }

  static async createLessonPlanOnly(
    teacherId: string,
    classId: string,
    topic: string,
    gradeLevel?: string,
    duration?: number
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('teacher_id', teacherId);
    params.append('class_id', classId);
    params.append('topic', topic);
    if (gradeLevel) params.append('grade_level', gradeLevel);
    if (duration) params.append('duration', duration.toString());
    
    return apiClient.post(`/api/v1/agentic/lesson/plan-only?${params.toString()}`);
  }

  static async generateContent(topic: string, gradeLevel?: string, contentType?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('topic', topic);
    if (gradeLevel) params.append('grade_level', gradeLevel);
    if (contentType) params.append('content_type', contentType);
    
    return apiClient.post(`/api/v1/agentic/content/generate?${params.toString()}`);
  }

  static async createAssessment(topic: string, gradeLevel?: string, assessmentType?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('topic', topic);
    if (gradeLevel) params.append('grade_level', gradeLevel);
    if (assessmentType) params.append('assessment_type', assessmentType);
    
    return apiClient.post(`/api/v1/agentic/assessment/create?${params.toString()}`);
  }

  static async generateVisualAids(topic: string, gradeLevel?: string, visualType?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('topic', topic);
    if (gradeLevel) params.append('grade_level', gradeLevel);
    if (visualType) params.append('visual_type', visualType);
    
    return apiClient.post(`/api/v1/agentic/visual-aids/generate?${params.toString()}`);
  }
}

// Health Service
export class HealthService {
  static async globalHealthCheck(): Promise<any> {
    return apiClient.get('/health');
  }

  static async getRootInfo(): Promise<any> {
    return apiClient.get('/');
  }
}

// Export all services as default
const ApiService = {
  Auth: AuthService,
  Assessment: AssessmentService,
  Education: EducationService,
  Activities: ActivitiesService,
  VisualAids: VisualAidsService,
  Planning: PlanningService,
  Personalization: PersonalizationService,
  Voice: VoiceService,
  TeacherDashboard: TeacherDashboardService,
  Orchestration: OrchestrationService,
  Health: HealthService,
};

export default ApiService;
