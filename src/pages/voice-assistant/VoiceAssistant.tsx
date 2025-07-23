import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  PauseIcon,
  ChatBubbleLeftEllipsisIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { TextRequest, VoiceMessage } from '../../types';
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
}

export default function VoiceAssistant() {
  const [state, setState] = useState<VoiceAssistantState>({
    messages: [],
    isListening: false,
    recordingState: 'idle',
    playbackState: 'idle',
    currentPlayingId: null,
    sessionId: `session_${Date.now()}`,
  });
  
  const [textMessage, setTextMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

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
        await processVoiceInput(audioBlob);
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

  const processVoiceInput = async (_audioBlob: Blob) => {
    try {
      setLoading(true);
      
      // For now, we'll simulate speech-to-text processing
      // In a real implementation, you'd send the audio to a speech-to-text API
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll use a predefined message
      const transcribedText = "What are the main causes of World War II?";
      
      await sendMessage(transcribedText, 'voice');
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process voice input');
    } finally {
      setState(prev => ({ ...prev, recordingState: 'idle' }));
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, type: 'text' | 'voice' = 'text') => {
    if (!message.trim()) return;

    const userMessage: VoiceMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    if (type === 'text') {
      setTextMessage('');
    }

    try {
      setLoading(true);
      
      const request: TextRequest = {
        user_id: 'current_user', // This should come from auth context
        message,
        session_id: state.sessionId,
        generate_audio: true,
      };

      const response = await ApiService.Voice.textChat(request);
      
      // Handle the response based on the backend format
      if (response) {
        const assistantMessage: VoiceMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: response.message || response.text || 'I received your message.',
          timestamp: new Date().toISOString(),
          audio_url: response.audio_url,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Add error message to chat
      const errorMessage: VoiceMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    if (state.currentPlayingId === messageId && state.playbackState === 'playing') {
      // Pause current audio
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
    }));
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

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
          "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-900"
        )}>
          <p className="text-sm">{message.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-70">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {!isUser && message.audio_url && (
              <button
                onClick={() => playAudio(message.audio_url!, message.id)}
                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Assistant</h1>
              <p className="text-gray-600">
                Chat with your AI learning companion using voice or text
              </p>
            </div>
            {state.messages.length > 0 && (
              <button
                onClick={clearChat}
                className="btn-secondary flex items-center"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Clear Chat
              </button>
            )}
          </motion.div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-col h-[calc(100%-8rem)] max-w-4xl mx-auto">
          {/* Messages Area */}
          <div className="flex-1 bg-white rounded-t-xl border border-gray-200 p-6 overflow-y-auto">
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
                  Welcome to Your AI Assistant
                </h3>
                <p className="text-gray-600 mb-6">
                  Start a conversation by typing a message or using voice input
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Try asking:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• "Explain photosynthesis"</li>
                      <li>• "Help me with algebra"</li>
                      <li>• "What is the water cycle?"</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Voice recognition</li>
                      <li>• Audio responses</li>
                      <li>• Educational content</li>
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
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-b-xl border-x border-b border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              {/* Voice Input Button */}
              <motion.button
                onClick={state.recordingState === 'recording' ? stopRecording : startRecording}
                disabled={loading || state.recordingState === 'processing'}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  state.recordingState === 'recording'
                    ? "bg-red-500 text-white animate-pulse"
                    : state.recordingState === 'processing'
                    ? "bg-yellow-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {state.recordingState === 'processing' ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <MicrophoneIcon className="w-6 h-6" />
                )}
              </motion.button>

              {/* Text Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(textMessage);
                    }
                  }}
                  placeholder="Type your message here..."
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => sendMessage(textMessage)}
                disabled={!textMessage.trim() || loading}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
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
      </div>
    </Navigation>
  );
}
