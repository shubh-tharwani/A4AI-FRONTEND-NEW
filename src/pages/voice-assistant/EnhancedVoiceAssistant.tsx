import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  PauseIcon,
  SparklesIcon,
  XMarkIcon,
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { 
  VoiceMessage, 
  ChatAttachment, 
  EnhancedAssistantRequest
} from '../../types';
import { cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';

type RecordingState = 'idle' | 'recording' | 'processing';
type PlaybackState = 'idle' | 'playing' | 'paused';

interface VoiceAssistantState {
  messages: VoiceMessage[];
  isListening: boolean;
  recordingState: RecordingState;
  playbackState: PlaybackState;
  currentPlayingId: string | null;
  sessionId: string;
  attachments: ChatAttachment[];
  suggestions: string[];
  followUpQuestions: string[];
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'text';
}

export default function EnhancedVoiceAssistant() {
  const [state, setState] = useState<VoiceAssistantState>({
    messages: [],
    isListening: false,
    recordingState: 'idle',
    playbackState: 'idle',
    currentPlayingId: null,
    sessionId: `session_${Date.now()}`,
    attachments: [],
    suggestions: [
      "Explain quantum physics in simple terms",
      "Help me write a research paper",
      "Create a study plan for calculus",
      "Analyze this document for key points",
      "Generate creative writing prompts",
      "Code review and optimization",
      "Creative storytelling assistance",
      "Data analysis and visualization"
    ],
    followUpQuestions: []
  });
  
  const [textMessage, setTextMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'error' | 'idle'>('idle');
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [responseStyle, setResponseStyle] = useState<'educational' | 'conversational' | 'formal' | 'creative'>('conversational');
  const [maxTokens, setMaxTokens] = useState(1500);
  const [generateAudio, setGenerateAudio] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Check API health and initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setApiStatus('connecting');
        
        // Check API health
        await ApiService.Voice.healthCheck();
        setApiStatus('connected');
        toast.success('🟢 Voice Assistant API connected');
        
        // Load conversation history if session exists
        try {
          const conversationHistory = await ApiService.Voice.loadConversationHistory(state.sessionId);
          if (conversationHistory.length > 0) {
            setState(prev => ({
              ...prev,
              messages: conversationHistory
            }));
            console.log('📜 Loaded conversation history:', conversationHistory.length, 'messages');
          }
        } catch (historyError) {
          console.log('📝 Starting with fresh conversation session');
        }
        
      } catch (error) {
        setApiStatus('error');
        console.warn('Voice Assistant API not available:', error);
        toast.error('🔴 Voice Assistant API offline - using demo mode');
      }
    };

    initializeSession();
  }, [state.sessionId]);

  // File handling utilities
  const getFileType = (file: File): 'image' | 'document' | 'audio' | 'video' | 'text' => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('text') || type.includes('pdf') || type.includes('doc') || type.includes('docx')) return 'document';
    return 'text';
  };

  const createFilePreview = useCallback((file: File): Promise<FilePreview> => {
    return new Promise((resolve) => {
      const fileType = getFileType(file);
      
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file,
            preview: e.target?.result as string,
            type: fileType
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          file,
          preview: URL.createObjectURL(file),
          type: fileType
        });
      }
    });
  }, []);

  // Session management functions
  const createNewSession = async () => {
    try {
      const userId = 'current_user'; // This should come from auth context
      const newSessionId = await ApiService.Voice.createSession(userId);
      
      setState(prev => ({
        ...prev,
        sessionId: newSessionId,
        messages: [],
        suggestions: [
          "Explain quantum physics in simple terms",
          "Help me write a research paper",
          "Create a study plan for calculus",
          "Analyze this document for key points",
          "Generate creative writing prompts",
          "Code review and optimization",
          "Creative storytelling assistance",
          "Data analysis and visualization"
        ],
        followUpQuestions: []
      }));
      
      toast.success('🆕 New conversation started');
      console.log('🆕 Created new session:', newSessionId);
    } catch (error) {
      console.error('Failed to create new session:', error);
      toast.error('Failed to create new session');
    }
  };

  const deleteCurrentSession = async () => {
    try {
      await ApiService.Voice.deleteSession(state.sessionId);
      await createNewSession(); // Create a new session after deletion
      toast.success('🗑️ Session deleted successfully');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    const maxSize = 25 * 1024 * 1024; // 25MB
    const maxFiles = 10;

    // Validate file constraints
    if (fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 25MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const previews = await Promise.all(validFiles.map(createFilePreview));
      setFilePreviews(prev => [...prev, ...previews]);
      toast.success(`${validFiles.length} file(s) added successfully`);
    } catch (error) {
      console.error('Error creating file previews:', error);
      toast.error('Error processing files');
    }
  };

  const removeFile = (index: number) => {
    setFilePreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        toast.success('All files removed');
      }
      return updated;
    });
  };

  const clearAllFiles = () => {
    setFilePreviews([]);
    toast.success('All files cleared');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const startRecording = async () => {
    if (apiStatus === 'error') {
      toast.error('🔴 Voice recording requires API connection. Please retry connection first.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_recording_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        console.log("Audi recorded")
        await processVoiceInput(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setState(prev => ({ ...prev, recordingState: 'recording', isListening: true }));
      toast.success('🎤 Recording started. Speak clearly!');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, recordingState: 'processing', isListening: false }));
      toast.success('Processing your voice input...');
    }
  };

  const processVoiceInput = async (audioFile: File) => {
    try {
      setLoading(true);
      setState(prev => ({ ...prev, recordingState: 'processing' }));
      
      // Send audio directly to the enhanced assistant
      await sendMessage('[Voice message]', 'voice', [audioFile]);
      console.log(audioFile)
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process voice input');
    } finally {
      setState(prev => ({ ...prev, recordingState: 'idle' }));
      setLoading(false);
    }
  };

  // Fix: Normalize API response to expected format in sendMessage
  const sendMessage = async (message: string, type: 'text' | 'voice' = 'text', audioFiles: File[] = []) => {
    if (!message.trim() && filePreviews.length === 0 && audioFiles.length === 0) {
      toast.error('Please enter a message or attach files');
      return;
    }

    // Enhanced input validation
    if (message.length > 4000) {
      toast.error('Message is too long. Please keep it under 4000 characters.');
      return;
    }

    const allFiles = [...filePreviews.map(fp => fp.file), ...audioFiles];
    const sanitizedMessage = message.trim();

    // Create user message with enhanced metadata
    const userMessage: VoiceMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: sanitizedMessage || (allFiles.length > 0 ? `📎 Shared ${allFiles.length} file(s)` : ''),
      timestamp: new Date().toISOString(),
      attachments: filePreviews.map((fp, index) => ({
        id: `attachment_${index}_${Date.now()}`,
        name: fp.file.name,
        type: fp.type,
        url: fp.preview,
        size: fp.file.size,
        mimeType: fp.file.type,
        preview: fp.preview
      })),
      metadata: {
        input_type: type,
        file_count: allFiles.length,
        character_count: sanitizedMessage.length
      }
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    if (type === 'text') {
      setTextMessage('');
    }
    setFilePreviews([]);

    try {
      setLoading(true);
      const request: EnhancedAssistantRequest = {
        user_id: 'current_user',
        message: sanitizedMessage,
        session_id: state.sessionId,
        files: allFiles,
        preferences: {
          generate_audio: generateAudio,
          response_style: responseStyle,
          max_tokens: maxTokens,
          language: 'en'
        },
        conversation_history: state.messages.slice(-15),
        context: {
          timestamp: new Date().toISOString(),
          user_preferences: { responseStyle, maxTokens, generateAudio }
        }
      };

      console.log('📤 Sending enhanced assistant request:', {
        ...request,
        files: request.files?.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      // Use the real API endpoint: http://localhost:8000/api/v1/voice/assistant
      let response;
      
      try {
        response = await ApiService.Voice.universalAssistant(request);
        setApiStatus('connected');
        
        // If we get "Response received", poll for the actual response
        if (response.message === 'Response received' || response.message === 'Waiting for AI response...') {
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds timeout
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
              const pollResponse = await ApiService.Voice.universalAssistant({
                ...request,
                message: 'poll', // Indicate this is a poll request
              });
              
              if (pollResponse.message !== 'Response received' && pollResponse.message !== 'Waiting for AI response...') {
                response = pollResponse;
                break;
              }
            } catch (pollError) {
              console.warn('Polling attempt failed:', pollError);
            }
            
            attempts++;
          }
          
          if (attempts >= maxAttempts) {
            throw new Error('Response timeout after 30 seconds');
          }
        }
      } catch (apiError: any) {
        console.warn('API call failed, using fallback response:', apiError);
        setApiStatus('error');
        
        // Fallback response when API is unavailable
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
        response = {
          message: `I received your ${type === 'voice' ? 'voice input' : 'message'}${sanitizedMessage ? `: "${sanitizedMessage}"` : ''} with ${allFiles.length} file(s). 

⚠️ **Note:** The Voice Assistant API (http://localhost:8000/api/v1/voice/assistant) is currently unavailable. This is a fallback response.

**Your request details:**
- Input type: ${type}
- Files: ${allFiles.length}
- Response style: ${responseStyle}
- Max tokens: ${maxTokens}

**Capabilities when API is available:**
- Advanced file analysis (documents, images, audio, video)
- Voice transcription and processing
- Contextual AI responses
- Code assistance and review
- Creative writing and storytelling
- Educational content generation
- Multi-language support

Please ensure the backend server is running at http://localhost:8000`,
          session_id: state.sessionId,
          metadata: {
            processing_time: 1000,
            model: 'fallback-mode',
            confidence: 0.8,
            tokens_used: 150
          },
          suggestions: [
            "Check backend server status",
            "Try again when API is available",
            "Test with a simple text message"
          ],
          follow_up_questions: [
            "Is the backend server running on port 8000?",
            "Would you like me to help troubleshoot the connection?"
          ]
        };
      }
      
      console.log('📥 Enhanced Voice Assistant API response:', response);
      
      // --- Normalize response ---
      // If response is not in expected format, map fields
      let content = '';
      
      // First try to get meaningful content from either ai_response or message
      content = response.ai_response || response.message;
      
      // If content is "Response received" or empty, try transcript
      if (!content || content === 'Response received') {
        content = response.transcript || 'No response content available';
      }
      
      let audioUrl = response.audio_url || response.audio_file_path || response.audio || response.voice_url || undefined;
      
      // Update session ID if it changed
      if (response.session_id && response.session_id !== state.sessionId) {
        setState(prev => ({ ...prev, sessionId: response.session_id }));
      }
      let attachments = response.attachments || response.files || [];
      let metadata = response.metadata || {};
      let suggestions = response.suggestions || response.hints || [];
      let followUpQuestions = response.follow_up_questions || response.followups || response.questions || [];
      // --- End normalization ---
      const assistantMessage: VoiceMessage = {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: content, // Use the normalized content variable we created above
        timestamp: new Date().toISOString(),
        audio_url: audioUrl,
        attachments: attachments,
        metadata: metadata
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        suggestions: suggestions.length ? suggestions : prev.suggestions,
        followUpQuestions: followUpQuestions
      }));

      toast.success('✨ Response generated successfully!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send message';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    if (state.currentPlayingId === messageId && state.playbackState === 'playing') {
      audioElementRef.current?.pause();
      setState(prev => ({ ...prev, playbackState: 'paused' }));
      toast.success('Audio paused');
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;

    audio.onplay = () => {
      setState(prev => ({ 
        ...prev, 
        playbackState: 'playing', 
        currentPlayingId: messageId 
      }));
      toast.success('🔊 Playing audio response');
    };

    audio.onpause = () => {
      setState(prev => ({ ...prev, playbackState: 'paused' }));
    };

    audio.onended = () => {
      setState(prev => ({ 
        ...prev, 
        playbackState: 'idle', 
        currentPlayingId: null 
      }));
      toast.success('Audio playback completed');
    };

    audio.onerror = () => {
      toast.error('Failed to play audio');
      setState(prev => ({ 
        ...prev, 
        playbackState: 'idle', 
        currentPlayingId: null 
      }));
    };

    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    });
  };

  const clearChat = () => {
    setState(prev => ({
      ...prev,
      messages: [],
      sessionId: `session_${Date.now()}`,
      followUpQuestions: []
    }));
    setFilePreviews([]);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    toast.success('Chat cleared successfully');
  };

  const useSuggestion = (suggestion: string) => {
    setTextMessage(suggestion);
    toast.success('Suggestion applied to input');
  };

  const exportChat = () => {
    const chatData = {
      session_id: state.sessionId,
      messages: state.messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      })),
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat exported successfully');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <PhotoIcon className="w-5 h-5 text-green-600" />;
      case 'audio': return <MusicalNoteIcon className="w-5 h-5 text-purple-600" />;
      case 'video': return <VideoCameraIcon className="w-5 h-5 text-red-600" />;
      case 'document': return <DocumentIcon className="w-5 h-5 text-blue-600" />;
      default: return <DocumentIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderAttachment = (attachment: ChatAttachment) => (
    <div key={attachment.id} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 mt-2 border border-gray-200">
      {getFileIcon(attachment.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
        <p className="text-xs text-gray-500">
          {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
        </p>
      </div>
      {attachment.type === 'image' && attachment.preview && (
        <img src={attachment.preview} alt={attachment.name} className="w-12 h-12 object-cover rounded" />
      )}
      <button
        onClick={() => window.open(attachment.url, '_blank')}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        title="View file"
      >
        <EyeIcon className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );

  const renderMessage = (message: VoiceMessage) => {
    const isUser = message.type === 'user';
    const isPlaying = state.currentPlayingId === message.id && state.playbackState === 'playing';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex w-full",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div className={cn(
          "max-w-xs lg:max-w-3xl px-4 py-3 rounded-lg shadow-sm",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        )}>
          <div className="text-sm whitespace-pre-wrap max-w-none leading-relaxed">
            {message.content === 'Response received' ? '' : message.content}
          </div>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mt-3">
              {message.attachments.map(renderAttachment)}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50">
            <div className="flex items-center space-x-3">
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
              {message.metadata?.processing_time && (
                <span className="text-xs opacity-70">
                  {message.metadata.processing_time}ms
                </span>
              )}
              {message.metadata?.tokens_used && (
                <span className="text-xs opacity-70">
                  {message.metadata.tokens_used} tokens
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isUser && message.audio_url && (
                <button
                  onClick={() => playAudio(message.audio_url!, message.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-4 h-4" />
                  ) : (
                    <SpeakerWaveIcon className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)]">
        {/* Enhanced Header */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Enhanced AI Assistant</h1>
                {/* API Status Indicator */}
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  apiStatus === 'connected' && "bg-green-100 text-green-800",
                  apiStatus === 'connecting' && "bg-yellow-100 text-yellow-800",
                  apiStatus === 'error' && "bg-red-100 text-red-800",
                  apiStatus === 'idle' && "bg-gray-100 text-gray-800"
                )}>
                  {apiStatus === 'connected' && '🟢 API Online'}
                  {apiStatus === 'connecting' && '🟡 Connecting...'}
                  {apiStatus === 'error' && '🔴 API Offline'}
                  {apiStatus === 'idle' && '⚪ Initializing...'}
                </div>
              </div>
              <p className="text-gray-600">
                Advanced ChatGPT-like AI with file upload, voice processing, and intelligent responses
                {apiStatus === 'error' && (
                  <span className="text-red-600 font-medium"> - Using fallback mode</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Session Management Controls */}
              <div className="flex items-center space-x-2 text-sm">
                <button
                  onClick={createNewSession}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center space-x-1"
                  title="Start new conversation"
                >
                  <SparklesIcon className="h-3 w-3" />
                  <span>New Chat</span>
                </button>
                
                <button
                  onClick={deleteCurrentSession}
                  disabled={state.messages.length === 0}
                  className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-800 disabled:text-gray-400 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center space-x-1"
                  title="Delete current session"
                >
                  <XMarkIcon className="h-3 w-3" />
                  <span>Clear</span>
                </button>
                
                <div className="text-xs text-gray-500 px-2">
                  Session: {state.sessionId.split('_').pop()?.substring(0, 8)}...
                </div>
              </div>
              
              {/* Settings Panel */}
              <div className="flex items-center space-x-2 text-sm">
                <select
                  value={responseStyle}
                  onChange={(e) => setResponseStyle(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="conversational">💬 Conversational</option>
                  <option value="educational">📚 Educational</option>
                  <option value="formal">🎩 Formal</option>
                  <option value="creative">🎨 Creative</option>
                </select>
                
                <select
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={500}>Short (500)</option>
                  <option value={1500}>Medium (1500)</option>
                  <option value={3000}>Long (3000)</option>
                </select>
              </div>
              
              {state.messages.length > 0 && (
                <>
                  <button
                    onClick={exportChat}
                    className="btn-secondary flex items-center"
                    title="Export chat"
                  >
                    <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  {apiStatus === 'error' && (
                    <button
                      onClick={async () => {
                        try {
                          setApiStatus('connecting');
                          await ApiService.Voice.healthCheck();
                          setApiStatus('connected');
                          toast.success('🟢 API reconnected successfully!');
                        } catch (error) {
                          setApiStatus('error');
                          toast.error('🔴 Still unable to connect to API');
                        }
                      }}
                      className="btn-secondary flex items-center bg-red-50 hover:bg-red-100 text-red-700"
                      title="Retry API connection"
                    >
                      🔄 Retry API
                    </button>
                  )}
                  <button
                    onClick={clearChat}
                    className="btn-secondary flex items-center"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Clear Chat
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Enhanced Chat Container */}
        <div className="flex flex-col h-[calc(100%-8rem)] max-w-7xl mx-auto">
          {/* Messages Area */}
          <div 
            className={cn(
              "flex-1 bg-gray-50 rounded-t-xl border border-gray-200 p-6 overflow-y-auto transition-all duration-200",
              isDragOver && "border-blue-500 bg-blue-50 border-2 border-dashed"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {state.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Welcome to Enhanced AI Assistant
                </h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Experience the next generation of AI assistance with advanced file processing, voice recognition, and intelligent conversations. Drag & drop files anywhere or start typing!
                </p>
                
                {/* Enhanced Suggestions */}
                <div className="max-w-5xl mx-auto">
                  <h4 className="text-lg font-medium text-gray-900 mb-6">✨ Try these suggestions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {state.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => useSuggestion(suggestion)}
                        className="bg-white hover:bg-gray-50 rounded-lg p-4 text-sm text-left transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-sm"
                      >
                        <LightBulbIcon className="w-5 h-5 text-yellow-500 mb-2" />
                        <div className="font-medium text-gray-900 mb-1">{suggestion.split(' ').slice(0, 3).join(' ')}</div>
                        <div className="text-gray-600 text-xs">{suggestion}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">📁 File Support</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Images & Videos</li>
                      <li>• Documents & PDFs</li>
                      <li>• Audio files</li>
                      <li>• Code files</li>
                      <li>• Up to 25MB each</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">🎤 Voice Features</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• High-quality recording</li>
                      <li>• Real-time processing</li>
                      <li>• Audio responses</li>
                      <li>• Multiple languages</li>
                      <li>• Noise cancellation</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">🧠 AI Capabilities</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Document analysis</li>
                      <li>• Code assistance</li>
                      <li>• Creative writing</li>
                      <li>• Data visualization</li>
                      <li>• Problem solving</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">⚙️ Customization</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Response styles</li>
                      <li>• Token limits</li>
                      <li>• Audio generation</li>
                      <li>• Export options</li>
                      <li>• Session management</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {state.messages.map(renderMessage)}
                </AnimatePresence>
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-gray-600">Generating response...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Enhanced Follow-up Questions */}
            {state.followUpQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 border-t pt-6"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-4">💡 Follow-up questions:</h4>
                <div className="flex flex-wrap gap-3">
                  {state.followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => useSuggestion(question)}
                      className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-full transition-colors border border-blue-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced File Previews */}
          {filePreviews.length > 0 && (
            <div className="bg-white border-x border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  📎 Attached Files ({filePreviews.length}/{10})
                </h4>
                <button
                  onClick={clearAllFiles}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {filePreviews.map((filePreview, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex flex-col items-center space-y-2">
                      {getFileIcon(filePreview.type)}
                      <div className="text-center min-w-0 w-full">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {filePreview.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(filePreview.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    {filePreview.type === 'image' && (
                      <img
                        src={filePreview.preview}
                        alt={filePreview.file.name}
                        className="w-full h-16 object-cover rounded mt-2"
                      />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Input Area */}
          <div className="bg-white rounded-b-xl border-x border-b border-gray-200 p-4">
            {/* Audio Settings */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={generateAudio}
                    onChange={(e) => setGenerateAudio(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Generate audio response</span>
                </label>
              </div>
              <div className="text-xs text-gray-500">
                Session: {state.sessionId.split('_')[1]}
              </div>
            </div>

            <div className="flex items-end space-x-4">
              {/* Enhanced File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Upload files (max 25MB each)"
              >
                <PaperClipIcon className="w-6 h-6 text-gray-600" />
              </button>

              {/* Enhanced Voice Input Button */}
              <motion.button
                onClick={state.recordingState === 'recording' ? stopRecording : startRecording}
                disabled={loading || state.recordingState === 'processing'}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  state.recordingState === 'recording'
                    ? "bg-red-500 text-white animate-pulse"
                    : state.recordingState === 'processing'
                    ? "bg-yellow-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                )}
                whileTap={{ scale: 0.95 }}
                title="Voice input with noise cancellation"
              >
                {state.recordingState === 'processing' ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6" />
                )}
              </motion.button>

              {/* Enhanced Text Input */}
              <div className="flex-1">
                <textarea
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(textMessage);
                    }
                  }}
                  placeholder="Type your message here... (Shift+Enter for new line, max 4000 chars)"
                  disabled={loading}
                  rows={Math.min(textMessage.split('\n').length || 1, 4)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[3rem] max-h-32"
                />
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>{textMessage.length}/4000 characters</span>
                  <span>Shift+Enter for new line</span>
                </div>
              </div>

              {/* Enhanced Send Button */}
              <button
                onClick={() => sendMessage(textMessage)}
                disabled={(!textMessage.trim() && filePreviews.length === 0) || loading}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[3rem] flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>

            {/* Enhanced Recording Status */}
            {state.recordingState === 'recording' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <div className="inline-flex items-center text-red-600 text-sm bg-red-50 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3" />
                  🎤 Recording with noise cancellation... Tap microphone to stop
                </div>
              </motion.div>
            )}

            {state.recordingState === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <div className="inline-flex items-center text-yellow-600 text-sm bg-yellow-50 px-4 py-2 rounded-full">
                  <LoadingSpinner size="sm" className="mr-3" />
                  🧠 Processing your voice input with AI...
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Enhanced Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </Navigation>
  );
}
