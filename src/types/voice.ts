export interface EnhancedAssistantRequest {
  user_id: string;
  message?: string;
  session_id?: string;
  audio_file?: File;
  file_upload?: File;
  query?: string;
  response_format?: 'text' | 'audio' | 'both' | 'auto';
  context?: Record<string, any>;
  conversation_history?: VoiceMessage[];
  preferences?: {
    generate_audio?: boolean;
    response_style?: 'conversational' | 'educational' | 'formal' | 'creative';
    max_tokens?: number;
    language?: string;
  };
}

export interface EnhancedAssistantResponse {
  message?: string;
  ai_response?: string;
  session_id?: string;
  audio_url?: string | null;
  audio_file_path?: string | null;
  audio_filename?: string | null;
  transcript?: string | null;
  status?: string;
  metadata?: {
    processing_time?: number;
    model?: string;
    confidence?: number;
    tokens_used?: number;
  };
  suggestions?: string[];
  follow_up_questions?: string[];
  attachments?: ChatAttachment[];
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  audio_url?: string | null;
  metadata?: Record<string, any>;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'text';
  url: string;
  size: number;
  mimeType: string;
  preview?: string;
}

export interface TextRequest {
  user_id: string;
  message: string;
  session_id?: string;
  context?: Record<string, any>;
  generate_audio?: boolean;
}
