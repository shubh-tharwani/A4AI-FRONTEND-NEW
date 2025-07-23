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
  LightBulbIcon
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { 
  VoiceMessage, 
  ChatAttachment, 
  EnhancedAssistantRequest,
  EnhancedAssistantResponse 
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

export default function VoiceAssistant() {
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
      "Generate creative writing prompts"
    ],
    followUpQuestions: []
  });
  
  const [textMessage, setTextMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [responseStyle, setResponseStyle] = useState<'educational' | 'conversational' | 'formal' | 'creative'>('conversational');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // File handling utilities
  const getFileType = (file: File): 'image' | 'document' | 'audio' | 'video' | 'text' => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('text') || type.includes('pdf') || type.includes('doc')) return 'document';
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

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    // Validate file constraints
    if (fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const previews = await Promise.all(validFiles.map(createFilePreview));
      setFilePreviews(prev => [...prev, ...previews]);
      toast.success(`${validFiles.length} file(s) added`);
    } catch (error) {
      console.error('Error creating file previews:', error);
      toast.error('Error processing files');
    }
  };

  const removeFile = (index: number) => {
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `recording_${Date.now()}.wav`, {
          type: 'audio/wav'
        });
        await processVoiceInput(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setState(prev => ({ ...prev, recordingState: 'recording', isListening: true }));
      toast.success('Recording started. Speak now!');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, recordingState: 'processing', isListening: false }));
    }
  };

  const processVoiceInput = async (audioFile: File) => {
    try {
      setLoading(true);
      setState(prev => ({ ...prev, recordingState: 'processing' }));
      
      // Send audio directly to the enhanced assistant
      await sendMessage('', 'voice', [audioFile]);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process voice input');
    } finally {
      setState(prev => ({ ...prev, recordingState: 'idle' }));
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, type: 'text' | 'voice' = 'text', audioFiles: File[] = []) => {
    if (!message.trim() && filePreviews.length === 0 && audioFiles.length === 0) {
      toast.error('Please enter a message or attach files');
      return;
    }

    // Enhanced input validation
    if (message.length > 2000) {
      toast.error('Message is too long. Please keep it under 2000 characters.');
      return;
    }

    const allFiles = [...filePreviews.map(fp => fp.file), ...audioFiles];
    const sanitizedMessage = message.trim();

    // Create user message
    const userMessage: VoiceMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: sanitizedMessage || (allFiles.length > 0 ? `Sent ${allFiles.length} file(s)` : ''),
      timestamp: new Date().toISOString(),
      attachments: filePreviews.map((fp, index) => ({
        id: `attachment_${index}`,
        name: fp.file.name,
        type: fp.type,
        url: fp.preview,
        size: fp.file.size,
        mimeType: fp.file.type,
        preview: fp.preview
      }))
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
        user_id: 'current_user', // This should come from auth context
        message: sanitizedMessage,
        session_id: state.sessionId,
        files: allFiles,
        preferences: {
          generate_audio: true,
          response_style: responseStyle,
          max_tokens: 1500
        },
        conversation_history: state.messages.slice(-10) // Last 10 messages for context
      };

      console.log('📤 Sending enhanced assistant request:', {
        ...request,
        files: request.files?.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      // For demo purposes, simulate API response when backend is not available
      const isBackendAvailable = false; // Change to true when backend is ready
      
      let response: EnhancedAssistantResponse;
      
      if (isBackendAvailable) {
        response = await ApiService.Voice.universalAssistant(request);
      } else {
        // Simulate API response for demo
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        response = {
          message: `I received your message: "${sanitizedMessage || 'file upload'}" with ${allFiles.length} file(s). This is a demo response since the backend is not connected. The assistant would normally process your request using advanced AI capabilities including file analysis, voice processing, and contextual understanding.`,
          session_id: state.sessionId,
          metadata: {
            processing_time: 1000,
            model: 'demo-model',
            confidence: 0.95
          },
          suggestions: [
            "Tell me more about this topic",
            "Can you explain this differently?",
            "What are the practical applications?"
          ],
          follow_up_questions: [
            "Would you like me to elaborate on any specific aspect?",
            "Do you have any questions about this explanation?"
          ]
        };
      }
      
      console.log('📥 Enhanced Voice Assistant API response:', response);
      
      // Enhanced response validation
      if (!response) {
        throw new Error('No response received from server');
      }
      
      const responseText = response.message;
      if (!responseText) {
        throw new Error('Invalid response: missing message content');
      }

      const assistantMessage: VoiceMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        audio_url: response.audio_url,
        attachments: response.attachments,
        metadata: response.metadata
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        suggestions: response.suggestions || prev.suggestions,
        followUpQuestions: response.follow_up_questions || []
      }));

      toast.success('Message sent successfully!');
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send message';
      toast.error(`Failed to send message: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    if (state.currentPlayingId === messageId && state.playbackState === 'playing') {
      audioElementRef.current?.pause();
      setState(prev => ({ ...prev, playbackState: 'paused' }));
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
  };

  const useSuggestion = (suggestion: string) => {
    setTextMessage(suggestion);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <PhotoIcon className="w-5 h-5" />;
      case 'audio': return <MusicalNoteIcon className="w-5 h-5" />;
      case 'video': return <VideoCameraIcon className="w-5 h-5" />;
      default: return <DocumentIcon className="w-5 h-5" />;
    }
  };

  const renderAttachment = (attachment: ChatAttachment) => (
    <div key={attachment.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2 mt-2">
      {getFileIcon(attachment.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
        <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
      </div>
      {attachment.type === 'image' && attachment.preview && (
        <img src={attachment.preview} alt={attachment.name} className="w-10 h-10 object-cover rounded" />
      )}
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
          "max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-900"
        )}>
          <div className="text-sm whitespace-pre-wrap max-w-none">
            {message.content}
          </div>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mt-2">
              {message.attachments.map(renderAttachment)}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs opacity-70">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            <div className="flex items-center space-x-2">
              {message.metadata?.processing_time && (
                <span className="text-xs opacity-70">
                  {message.metadata.processing_time}ms
                </span>
              )}
              {!isUser && message.audio_url && (
                <button
                  onClick={() => playAudio(message.audio_url!, message.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
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
        {/* Header */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant</h1>
              <p className="text-gray-600">
                ChatGPT-like AI assistant with file upload, voice input, and advanced features
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Response Style Selector */}
              <select
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="conversational">Conversational</option>
                <option value="educational">Educational</option>
                <option value="formal">Formal</option>
                <option value="creative">Creative</option>
              </select>
              
              {state.messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="btn-secondary flex items-center"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Clear Chat
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-col h-[calc(100%-8rem)] max-w-6xl mx-auto">
          {/* Messages Area */}
          <div 
            className={cn(
              "flex-1 bg-white rounded-t-xl border border-gray-200 p-6 overflow-y-auto transition-all duration-200",
              isDragOver && "border-blue-500 bg-blue-50"
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
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Your Enhanced AI Assistant
                </h3>
                <p className="text-gray-600 mb-6">
                  Start a conversation by typing, speaking, or uploading files. Drag & drop files anywhere!
                </p>
                
                {/* Suggestions */}
                <div className="max-w-4xl mx-auto">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Try these suggestions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {state.suggestions.slice(0, 6).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => useSuggestion(suggestion)}
                        className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-sm text-left transition-colors border border-gray-200"
                      >
                        <LightBulbIcon className="w-4 h-4 text-yellow-500 mb-2" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">File Support:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Images, Documents</li>
                      <li>• Audio, Video files</li>
                      <li>• Drag & drop upload</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Voice Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Voice recognition</li>
                      <li>• Audio responses</li>
                      <li>• Real-time processing</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">AI Capabilities:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Document analysis</li>
                      <li>• Code assistance</li>
                      <li>• Creative writing</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {state.messages.map(renderMessage)}
                </AnimatePresence>
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Follow-up Questions */}
            {state.followUpQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border-t pt-4"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-3">Follow-up questions:</h4>
                <div className="flex flex-wrap gap-2">
                  {state.followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => useSuggestion(question)}
                      className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* File Previews */}
          {filePreviews.length > 0 && (
            <div className="bg-gray-50 border-x border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Attached Files ({filePreviews.length})
                </h4>
                <button
                  onClick={() => setFilePreviews([])}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filePreviews.map((filePreview, index) => (
                  <div key={index} className="relative bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(filePreview.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
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
                        className="w-full h-20 object-cover rounded mt-2"
                      />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white rounded-b-xl border-x border-b border-gray-200 p-4">
            <div className="flex items-end space-x-4">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Upload files"
              >
                <PaperClipIcon className="w-6 h-6 text-gray-600" />
              </button>

              {/* Voice Input Button */}
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
                title="Voice input"
              >
                {state.recordingState === 'processing' ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6" />
                )}
              </motion.button>

              {/* Text Input */}
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
                  placeholder="Type your message here... (Shift+Enter for new line)"
                  disabled={loading}
                  rows={textMessage.split('\n').length || 1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[3rem] max-h-32"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => sendMessage(textMessage)}
                disabled={(!textMessage.trim() && filePreviews.length === 0) || loading}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[3rem]"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <ArrowUpTrayIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Recording Status */}
            {state.recordingState === 'recording' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <div className="inline-flex items-center text-red-600 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                  Recording... Tap the microphone to stop
                </div>
              </motion.div>
            )}

            {state.recordingState === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <div className="inline-flex items-center text-yellow-600 text-sm">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing your voice input...
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
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
