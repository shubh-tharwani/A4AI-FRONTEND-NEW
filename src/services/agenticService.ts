import axios from 'axios';
import {
  AgenticPipelineStatus,
  LessonPlanRequest,
  LessonPlanOnlyRequest,
  LessonPlanResponse,
  ContentGenerationRequest,
  ContentGenerationResponse,
  AssessmentRequest,
  AssessmentResponse,
  VisualAidRequest,
  VisualAidResponse,
} from '../types/agentic';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const agenticApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/agentic`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => status >= 200 && status < 500, // Handle 4xx errors gracefully
});

// Add auth interceptor
agenticApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AgenticService = {
  getPipelineStatus: async (): Promise<AgenticPipelineStatus> => {
    try {
      const response = await agenticApi.get('/pipeline/status');
      return response.data;
    } catch (error) {
      console.error('Pipeline status check failed:', error);
      // Return a safe fallback status
      return {
        status: 'failed',
        error: 'Unable to connect to AI service',
        timestamp: new Date().toISOString(),
      };
    }
  },

  orchestratePipeline: async (data: Record<string, unknown>): Promise<void> => {
    try {
      const response = await agenticApi.post('/orchestrate', data);
      if (!response.data) {
        throw new Error('No response from orchestration service');
      }
    } catch (error: any) {
      console.error('Pipeline orchestration failed:', error);
      throw new Error(error?.response?.data?.message || 'Failed to orchestrate AI pipeline');
    }
  },

  createCompleteLessonPlan: async (data: LessonPlanRequest): Promise<LessonPlanResponse> => {
    try {
      // Get current user info from localStorage or auth context
      const teacherId = localStorage.getItem('teacher_id') || '';
      const classId = localStorage.getItem('class_id') || '';

      if (!teacherId || !classId) {
        throw new Error('Teacher ID and Class ID are required. Please ensure you are properly logged in.');
      }

      const requestData: LessonPlanRequest & { teacher_id: string; class_id: string } = {
        ...data,
        teacher_id: teacherId,
        class_id: classId
      };

      const response = await agenticApi.post<LessonPlanResponse>('/lesson/complete', requestData);
      
      if (!response.data || !response.data.plan) {
        throw new Error('Invalid lesson plan response');
      }
      
      // Validate required fields in response
      if (!response.data.plan.title || !response.data.plan.objectives) {
        throw new Error('Incomplete lesson plan response from server');
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Lesson plan creation failed:', error.message);
      }

      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        const details = error.response.data.detail;
        const missingFields = details
          .filter((d: { type: string; loc: string[] }) => d.type === 'missing')
          .map((d: { loc: string[] }) => d.loc[1])
          .join(', ');
        throw new Error(`Missing required fields: ${missingFields}`);
      }

      throw new Error(
        axios.isAxiosError(error) 
          ? error.response?.data?.message || 'Failed to create lesson plan'
          : 'Failed to create lesson plan'
      );
    }
  },

  createLessonPlanOnly: async (data: LessonPlanOnlyRequest): Promise<LessonPlanResponse> => {
    try {
      const params = new URLSearchParams({
        teacher_id: data.teacher_id,
        class_id: data.class_id,
        topic: data.topic,
        grade_level: data.grade_level || 'elementary',
        duration: (data.duration || 60).toString()
      });

      const response = await agenticApi.post<LessonPlanResponse>(`/lesson/plan-only?${params}`);
      
      if (!response.data) {
        throw new Error('Invalid lesson plan response');
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Lesson plan creation failed:', error.message);
      }

      throw new Error(
        axios.isAxiosError(error) 
          ? error.response?.data?.message || 'Failed to create lesson plan'
          : 'Failed to create lesson plan'
      );
    }
  },

  generateContent: async (data: ContentGenerationRequest): Promise<ContentGenerationResponse> => {
    try {
      const params = new URLSearchParams({
        topic: data.topic,
        grade_level: data.grade_level || 'elementary',
        content_type: data.content_type || 'comprehensive'
      });

      const response = await agenticApi.post<ContentGenerationResponse>(`/content/generate?${params}`);
      
      if (!response.data) {
        throw new Error('Invalid content generation response');
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Content generation failed:', error.message);
      }

      throw new Error(
        axios.isAxiosError(error) 
          ? error.response?.data?.message || 'Failed to generate content'
          : 'Failed to generate content'
      );
    }
  },

  createAssessment: async (data: AssessmentRequest): Promise<AssessmentResponse> => {
    try {
      const params = new URLSearchParams({
        topic: data.topic,
        grade_level: data.grade_level || 'elementary',
        assessment_type: data.assessment_type || 'comprehensive'
      });

      const response = await agenticApi.post<AssessmentResponse>(`/assessment/create?${params}`);
      
      if (!response.data) {
        throw new Error('Invalid assessment response');
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Assessment creation failed:', error.message);
      }

      throw new Error(
        axios.isAxiosError(error) 
          ? error.response?.data?.message || 'Failed to create assessment'
          : 'Failed to create assessment'
      );
    }
  },

  generateVisualAids: async (data: VisualAidRequest): Promise<VisualAidResponse> => {
    try {
      const params = new URLSearchParams({
        topic: data.topic,
        grade_level: data.grade_level || 'elementary',
        visual_type: data.visual_type || 'comprehensive'
      });

      const response = await agenticApi.post<VisualAidResponse>(`/visual-aids/generate?${params}`);
      
      if (!response.data) {
        throw new Error('Invalid visual aid response');
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Visual aid generation failed:', error.message);
      }

      throw new Error(
        axios.isAxiosError(error) 
          ? error.response?.data?.message || 'Failed to generate visual aids'
          : 'Failed to generate visual aids'
      );
    }
  },
};

export default AgenticService;
