import axios from 'axios';
import {
  AgenticPipelineStatus,
  LessonPlanRequest,
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
    const response = await agenticApi.get('/pipeline/status');
    return response.data;
  },

  orchestratePipeline: async (data: any): Promise<void> => {
    await agenticApi.post('/orchestrate', data);
  },

  createCompleteLessonPlan: async (data: LessonPlanRequest): Promise<LessonPlanResponse> => {
    const response = await agenticApi.post('/lesson/complete', data);
    return response.data;
  },

  createLessonPlanOnly: async (data: LessonPlanRequest): Promise<LessonPlanResponse> => {
    const response = await agenticApi.post('/lesson/plan-only', data);
    return response.data;
  },

  generateContent: async (data: ContentGenerationRequest): Promise<ContentGenerationResponse> => {
    const response = await agenticApi.post('/content/generate', data);
    return response.data;
  },

  createAssessment: async (data: AssessmentRequest): Promise<AssessmentResponse> => {
    const response = await agenticApi.post('/assessment/create', data);
    return response.data;
  },

  generateVisualAids: async (data: VisualAidRequest): Promise<VisualAidResponse> => {
    const response = await agenticApi.post('/visual-aids/generate', data);
    return response.data;
  },
};

export default AgenticService;
