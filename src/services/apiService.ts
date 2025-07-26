// Updated API Service implementation aligned with OpenAPI 3.1.0 specification
import apiClient from '../lib/api';
import { logApiCall } from '../utils/logging';
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
  LessonPlanResponse,
  TextRequest,
  EnhancedAssistantRequest,
  EnhancedAssistantResponse,
  BadgeAssignmentRequest,
  UserBadge,
  TeacherDashboardResponse,
  PersonalizationResponse,
  PerformanceUpdateRequest,
  ScoreRequest,
  VoiceMessage
} from '../types';

// Authentication Service
export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/v1/auth/login', credentials);
  }

  static async signup(userData: SignupRequest): Promise<AuthResponse> {
    // Transform firstName and lastName to display_name if needed
    const payload: SignupRequest = {
      email: userData.email,
      password: userData.password,
      role: userData.role || 'student'
    };
    
    // Combine firstName and lastName into display_name if provided
    if (userData.firstName || userData.lastName) {
      payload.display_name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    } else if (userData.display_name) {
      payload.display_name = userData.display_name;
    }
    
    return apiClient.post<AuthResponse>('/api/v1/auth/signup', payload);
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

  static async logout(): Promise<any> {
    return apiClient.post('/api/v1/auth/logout');
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/auth/health');
  }
}

// Education Service
export class EducationService {
  static async createActivity(request: ActivityRequest): Promise<EducationResponse> {
    return apiClient.post<EducationResponse>('/api/v1/education/activities', request);
  }

  static async createVisualAid(request: any): Promise<EducationResponse> {
    // Note: This is the education-specific visual aid endpoint
    // For general visual aids, use VisualAidsService.generateVisualAid() instead
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
    // Enhanced logging for debugging
    console.log('🎨 Visual Aid Request (Original):', request);
    console.log('🔗 API URL:', '/api/v1/visual-aids/generate');
    
    // Normalize request according to backend OpenAPI schema
    // Backend expects: topic, grade, subject (all required), visualType?, style?, color_scheme? (optional)
    
    // Add variety based on topic to encourage unique results
    const topicLower = (request.topic || '').toLowerCase();
    
    // Determine style based on topic content to add variety
    let dynamicStyle = request.style || 'modern';
    let dynamicColorScheme = request.color_scheme || 'blue';
    
    if (topicLower.includes('space') || topicLower.includes('solar') || topicLower.includes('planet')) {
      dynamicStyle = 'cosmic';
      dynamicColorScheme = 'purple';
    } else if (topicLower.includes('nature') || topicLower.includes('plant') || topicLower.includes('animal')) {
      dynamicStyle = 'natural';
      dynamicColorScheme = 'green';
    } else if (topicLower.includes('ocean') || topicLower.includes('water') || topicLower.includes('marine')) {
      dynamicStyle = 'aquatic';
      dynamicColorScheme = 'blue';
    } else if (topicLower.includes('history') || topicLower.includes('ancient') || topicLower.includes('civilization')) {
      dynamicStyle = 'vintage';
      dynamicColorScheme = 'brown';
    } else if (topicLower.includes('math') || topicLower.includes('geometry') || topicLower.includes('algebra')) {
      dynamicStyle = 'geometric';
      dynamicColorScheme = 'orange';
    } else if (topicLower.includes('art') || topicLower.includes('paint') || topicLower.includes('creative')) {
      dynamicStyle = 'artistic';
      dynamicColorScheme = 'rainbow';
    } else {
      // Add some randomization for generic topics
      const styles = ['modern', 'minimalist', 'colorful', 'professional', 'playful'];
      const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal'];
      const topicHash = request.topic?.length || 0;
      dynamicStyle = styles[topicHash % styles.length];
      dynamicColorScheme = colors[topicHash % colors.length];
    }
    
    const backendRequest = {
      topic: request.topic?.trim() || '',
      grade: request.grade?.toString() || '5',
      subject: request.subject?.trim() || 'Science',
      visualType: request.visualType || 'infographic',
      style: dynamicStyle,
      color_scheme: dynamicColorScheme
    };

    // Ensure required fields are present
    if (!backendRequest.topic) {
      throw new Error('Topic is required');
    }
    if (!backendRequest.grade) {
      throw new Error('Grade is required');
    }
    if (!backendRequest.subject) {
      throw new Error('Subject is required');
    }

    console.log('🔧 Backend-Compliant Request:', backendRequest);
    console.log('🎯 KEY REQUEST DETAILS FOR UNIQUENESS:');
    console.log(`  🏷️  Topic: "${backendRequest.topic}" (${backendRequest.topic.length} chars)`);
    console.log(`  🎓 Grade: "${backendRequest.grade}"`);
    console.log(`  📚 Subject: "${backendRequest.subject}"`);
    console.log(`  🎨 Visual Type: "${backendRequest.visualType}"`);
    console.log(`  ✨ Style: "${backendRequest.style}"`);
    console.log(`  🌈 Color Scheme: "${backendRequest.color_scheme}"`);
    console.log('📋 Expected Backend Schema:');
    console.log('  - topic: string (required) - THIS SHOULD DRIVE UNIQUENESS');
    console.log('  - grade: string (required)');
    console.log('  - subject: string (required)');
    console.log('  - visualType: string (optional, default: "infographic")');
    console.log('  - style: string (optional, default: "modern")');
    console.log('  - color_scheme: string (optional, default: "blue")');
    
    try {
      const response = await apiClient.post<VisualAidResponse>('/api/v1/visual-aids/generate', backendRequest);
      console.log('✅ Visual Aid Response:', response);
      
      // CRITICAL: Check if backend is generating unique results based on topic
      const responseData = (response as any).data || response;
      console.log('🔍 UNIQUENESS ANALYSIS:');
      console.log(`  📝 Request Topic: "${backendRequest.topic}"`);
      console.log(`  🆔 Response ID: "${responseData?.id || 'NO_ID'}"`);
      console.log(`  🖼️  Image URL: "${responseData?.image_url || 'NO_URL'}"`);
      console.log(`  📁 Filename: "${responseData?.filename || 'NO_FILENAME'}"`);
      console.log(`  📊 Image Size: ${responseData?.metadata?.image_size || 'NO_SIZE'} bytes`);
      console.log(`  ⏰ Created At: "${responseData?.metadata?.created_at || 'NO_TIMESTAMP'}"`);
      
      // Track filename patterns to see if they're topic-specific
      const filename = responseData?.filename || '';
      const topicInFilename = filename.includes(backendRequest.topic.replace(/\s+/g, '_'));
      console.log(`  🎯 Topic "${backendRequest.topic}" found in filename "${filename}": ${topicInFilename}`);
      
      // Check if the image URL contains topic-specific information
      const imageUrl = responseData?.image_url || '';
      const topicInUrl = imageUrl.includes(backendRequest.topic.replace(/\s+/g, '_'));
      console.log(`  🎯 Topic "${backendRequest.topic}" found in image URL "${imageUrl}": ${topicInUrl}`);
      
      // Detailed analysis of the response structure
      console.log('🔍 Response Structure Analysis:');
      console.log('  - Full response keys:', Object.keys(response || {}));
      console.log('  - Response data keys:', Object.keys(responseData || {}));
      console.log('  - Metadata keys:', Object.keys(responseData?.metadata || {}));
      
      // Check if image URL is accessible
      if (responseData?.image_url) {
        console.log('🖼️ Image URL provided:', responseData.image_url);
        
        // Try to fetch image info (non-blocking)
        fetch(responseData.image_url, { method: 'HEAD' })
          .then(res => {
            console.log('📏 Image HEAD request result:');
            console.log('  - Status:', res.status);
            console.log('  - Content-Length:', res.headers.get('content-length'));
            console.log('  - Content-Type:', res.headers.get('content-type'));
            console.log('  - Last-Modified:', res.headers.get('last-modified'));
          })
          .catch(err => {
            console.warn('⚠️ Could not fetch image info:', err.message);
          });
      } else {
        console.warn('⚠️ No image_url provided in response');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Visual Aid API Error:', error);
      console.error('❌ Error Response:', error.response?.data);
      console.error('❌ Error Status:', error.response?.status);
      console.error('❌ Request that failed:', backendRequest);
      
      // Enhanced error logging for 422 validation errors
      if (error.response?.status === 422) {
        console.error('🚨 VALIDATION ERROR DETAILS:');
        console.error('  - Backend expected schema (from OpenAPI):');
        console.error('    ✓ topic: string (required)');
        console.error('    ✓ grade: string (required)');  
        console.error('    ✓ subject: string (required)');
        console.error('    ✓ visualType: string (optional, default: "infographic")');
        console.error('    ✓ style: string (optional, default: "modern")');
        console.error('    ✓ color_scheme: string (optional, default: "blue")');
        console.error('  - Our request:', JSON.stringify(backendRequest, null, 2));
        
        if (error.response?.data?.detail) {
          console.error('  - Backend validation details:', error.response.data.detail);
        }
      }
      
      throw error;
    }
  }

  static async createInfographic(request: {
    topic: string;
    data_points: string[];
    grade_level?: number;
  }): Promise<any> {
    console.log('📊 Infographic Request:', request);
    console.log('🔗 API URL:', '/api/v1/visual-aids/infographic');
    
    try {
      const response = await apiClient.post('/api/v1/visual-aids/infographic', request);
      console.log('✅ Infographic Response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Infographic API Error:', error);
      console.error('❌ Error Response:', error.response?.data);
      console.error('❌ Error Status:', error.response?.status);
      throw error;
    }
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
    
    console.log('📂 Getting My Visual Aids with params:', { limit, assetType });
    
    try {
      const response = await apiClient.get<any[]>(`/api/v1/visual-aids/my-visual-aids?${params.toString()}`);
      console.log('✅ My Visual Aids Response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Get My Visual Aids Error:', error);
      throw error;
    }
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
  static async createLessonPlan(request: {
    class_id: string;
    plan_type?: 'daily' | 'weekly' | 'monthly';
    duration?: number;
    curriculum_standards?: string[];
    learning_objectives?: string[];
  }): Promise<LessonPlanResponse> {
    return apiClient.post<LessonPlanResponse>('/api/v1/planning/lesson-plan', request);
  }

  static async createCurriculumPlan(request: {
    class_id: string;
    subject: string;
    grade_level: number;
    semester_duration?: number;
  }): Promise<any> {
    return apiClient.post('/api/v1/planning/curriculum-plan', request);
  }

  static async getLessonPlan(planId: string): Promise<any> {
    return apiClient.get(`/api/v1/planning/lesson-plan/${planId}`);
  }

  static async updateLessonPlan(planId: string, updates: {
    title?: string;
    description?: string;
    content?: Record<string, any>;
    notes?: string;
  }): Promise<any> {
    return apiClient.put(`/api/v1/planning/lesson-plan/${planId}`, updates);
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

  static async getPlanTypes(): Promise<Array<Record<string, string>>> {
    return apiClient.get<Array<Record<string, string>>>('/api/v1/planning/plan-types');
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

  static async getTeacherSummary(request: { class_id: string }): Promise<PersonalizationResponse> {
    return apiClient.post<PersonalizationResponse>('/api/v1/personalization/teacher-summary', request);
  }

  static async healthCheck(): Promise<any> {
    return apiClient.get('/api/v1/personalization/health');
  }
}

// Voice Assistant Service
export class VoiceService {
  // Enhanced ChatGPT-like universal assistant with session management
  static async universalAssistant(request: EnhancedAssistantRequest): Promise<EnhancedAssistantResponse> {
    const formData = new FormData();
    
    // Required field
    formData.append('user_id', request.user_id);
    
    // Optional fields as per OpenAPI spec
    if (request.message) {
      formData.append('message', request.message);
    }
    
    if (request.session_id) {
      formData.append('session_id', request.session_id);
    }
    
    // Response format based on preferences
    const responseFormat = request.preferences?.generate_audio ? 'both' : 'text';
    formData.append('response_format', responseFormat);
    
    // Context with preferences and history
    const context = {
      preferences: {
        response_style: request.preferences?.response_style || 'conversational',
        max_tokens: request.preferences?.max_tokens || 1500,
        language: request.preferences?.language || 'en',
        generate_audio: request.preferences?.generate_audio || false
      },
      conversation_history: request.conversation_history || [],
      timestamp: new Date().toISOString()
    };
    formData.append('context', JSON.stringify(context));
    const contextData = {
      ...request.context,
      conversation_history: request.conversation_history || [],
      preferences: {
        response_style: request.preferences?.response_style || 'conversational',
        max_tokens: request.preferences?.max_tokens || 1500,
        language: request.preferences?.language || 'en',
        generate_audio: request.preferences?.generate_audio || false
      },
      timestamp: new Date().toISOString(),
      session_context: {
        session_id: request.session_id,
        user_id: request.user_id
      }
    };
    formData.append('context', JSON.stringify(contextData));
    
    // Add audio file if provided
    if (request.files && request.files.length > 0) {
      console.log("Checking if audio file is present!")
      for (const file of request.files) {
        if (file.type.includes("audio")){
          console.log("Added audio file")
          formData.append('audio_file', file);
    }
  }
}
    
    // Handle audio file if provided
    if (request.audio_file) {
      formData.append('audio_file', request.audio_file);
    }
    
    // Handle file upload if provided
    if (request.file_upload) {
      formData.append('file_upload', request.file_upload);
      
      // Add query about the file if provided
      if (request.query) {
        formData.append('query', request.query);
      }
    }
    
    logApiCall('Voice Assistant Request', {
      user_id: request.user_id,
      session_id: request.session_id,
      has_message: !!request.message,
      has_audio: !!request.audio_file,
      has_file: !!(request.file_upload || (request.files && request.files.length > 0)),
      response_format: request.preferences?.generate_audio ? 'both' : 'text',
      context_keys: Object.keys(contextData)
    });
    
    try {
      // Use the multipart form method with proper error handling
      const response = await apiClient.uploadMultiPartForm('/api/v1/voice/assistant', formData);
      
      // Transform and normalize the response according to OpenAPI spec
      const normalizedResponse: EnhancedAssistantResponse = {
        // Handle message field
        message: response.message,
        // If message is "Response received", treat it as a pending response
        ai_response: response.message === 'Response received' ? 
          'Processing your request...' : 
          response.ai_response || response.message,
        session_id: response.session_id || request.session_id,
        audio_url: response.audio_url,
        audio_file_path: response.audio_file_path,
        audio_filename: response.audio_filename,
        transcript: response.transcript,
        status: response.status,
        metadata: {
          processing_time: response.metadata?.processing_time || 0,
          model: response.metadata?.model || 'unknown',
          confidence: response.metadata?.confidence || 1.0,
          tokens_used: response.metadata?.tokens_used || 0
        },
        suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
        follow_up_questions: Array.isArray(response.follow_up_questions) ? response.follow_up_questions : [],
        attachments: Array.isArray(response.attachments) ? response.attachments : []
      };

      // Log the normalized response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Normalized API Response:', normalizedResponse);
      }

      return normalizedResponse;
    } catch (error: any) {
      // Enhanced error handling with session context
      console.error('🚨 Voice Assistant API Error:', error);
      
      // Re-throw with enhanced error info
      throw new Error(`Voice Assistant API Error: ${error.message || 'Unknown error'}`);
    }
  }

  // Text-only chat with enhanced session handling
  static async textChat(request: TextRequest): Promise<any> {
    const payload = {
      user_id: request.user_id,
      message: request.message,
      session_id: request.session_id || null,
      context: request.context || {},
      generate_audio: request.generate_audio || false
    };
    
    console.log('📝 Text chat request:', payload);
    return apiClient.post('/api/v1/voice/text-chat', payload);
  }

  // Simple text chat for Voice Lite (minimal payload)
  static async simpleLiteChat(message: string): Promise<any> {
    // As per OpenAPI spec, user_id and message are required
    const payload = {
      user_id: 'voice_lite_user',
      message: message
    };
    console.log('💬 Voice Lite chat request:', payload);
    return apiClient.post('/api/v1/voice/text-chat', payload);
  }

  // Speech-to-text transcription
  static async transcribeAudio(audioFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    
    return apiClient.uploadMultiPartForm('/api/v1/voice/transcribe', formData);
  }

  // Session management methods - Enhanced with proper typing and error handling
  static async getUserSessions(userId: string, limit: number = 50): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      const response = await apiClient.get(`/api/v1/voice/sessions/${userId}?${params.toString()}`);
      console.log('📂 User sessions retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error);
      throw error;
    }
  }

  static async getSession(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/v1/voice/sessions/current_user/${sessionId}`);
      console.log('💬 Session details retrieved:', { sessionId, messageCount: response?.messages?.length || 0 });
      return response;
    } catch (error) {
      console.error('❌ Failed to get session:', error);
      throw error;
    }
  }

  static async deleteSession(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/v1/voice/sessions/${sessionId}`);
      console.log('🗑️ Session deleted:', sessionId);
      return response;
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      throw error;
    }
  }

  // Create a new session (helper method)
  static async createSession(userId: string): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆕 Created new session:', sessionId);
    return sessionId;
  }

  // Load conversation history for a session
  static async loadConversationHistory(sessionId: string): Promise<VoiceMessage[]> {
    try {
      const sessionData = await this.getSession(sessionId);
      
      // Transform API response to VoiceMessage format
      const messages: VoiceMessage[] = (sessionData?.messages || []).map((msg: any, index: number) => ({
        id: msg.id || `msg_${index}_${Date.now()}`,
        type: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || msg.message || '',
        timestamp: new Date(msg.timestamp || Date.now()),
        audio_url: msg.audio_url || null,
        metadata: msg.metadata || {},
        attachments: msg.attachments || []
      }));
      
      console.log('📜 Conversation history loaded:', { sessionId, messageCount: messages.length });
      return messages;
    } catch (error) {
      console.warn('⚠️ Could not load conversation history, starting fresh:', error);
      return [];
    }
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

  static async createCompleteLesson(request: {
    teacher_id: string;
    class_id: string;
    topic: string;
    grade_level?: string;
    duration?: number;
    lesson_type?: string;
    curriculum_standards?: any[];
    learning_objectives?: any[];
    student_data?: Record<string, any>;
    include_visual_aids?: boolean;
    assessment_required?: boolean;
    preferences?: Record<string, any>;
  }): Promise<any> {
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
