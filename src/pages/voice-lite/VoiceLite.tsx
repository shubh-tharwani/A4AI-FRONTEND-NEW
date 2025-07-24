import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface VoiceLiteState {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function VoiceLite() {
  const [state, setState] = useState<VoiceLiteState>({
    messages: [],
    isLoading: false,
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || state.isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    const currentMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // Use the API service for cleaner error handling
      const data = await ApiService.Voice.simpleLiteChat(currentMessage);
      
      console.log('📤 API Response received:', data);
      
      // Extract the response message (try multiple possible field names)
      let responseText = '';
      if (data.ai_response) {
        responseText = data.ai_response;
      } else if (data.response) {
        responseText = data.response;
      } else if (data.message && data.message !== currentMessage) {
        // Ensure we don't use the user's message as the response
        responseText = data.message;
      } else if (data.text) {
        responseText = data.text;
      } else if (data.content) {
        responseText = data.content;
      } else {
        responseText = 'Sorry, I received an empty response from the server.';
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));

      toast.success('Message sent successfully!');
    } catch (error: any) {
      console.error('Error sending message to text-chat API:', error);
      console.error('Error response data:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      
      // Check if we should fall back to demo mode
      const isBackendError = error?.response?.status >= 400 || error.code === 'ECONNREFUSED' || error.message?.includes('Network');
      
      if (isBackendError) {
        // Demo mode fallback
        console.log('🎭 Falling back to demo mode');
        
        const demoResponses = [
          `I received your message: "${currentMessage}". This is a demo response because the backend API is not available or configured correctly.`,
          `Thank you for your message: "${currentMessage}". I'm running in demo mode. Please check your backend server connection.`,
          `Message received: "${currentMessage}". Currently in offline demo mode. Your backend server may need to be started or the API endpoint may need configuration.`
        ];
        
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        
        const demoMessage: ChatMessage = {
          id: `demo_${Date.now()}`,
          type: 'assistant',
          content: `🎭 ${randomResponse}`,
          timestamp: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, demoMessage],
          isLoading: false,
        }));

        toast('Running in demo mode - backend not available');
        return;
      }
      
      // Provide detailed error message for non-backend errors
      let errorMessage = 'Failed to send message. ';
      
      if (error?.response?.status === 422) {
        const detail = error?.response?.data?.detail;
        if (detail) {
          if (Array.isArray(detail)) {
            // FastAPI validation errors are usually arrays
            const fieldErrors = detail.map(d => `${d.loc?.join('.')} - ${d.msg || d.message}`).join('; ');
            errorMessage += `API expects different fields: ${fieldErrors}`;
          } else {
            errorMessage += `API Error: ${detail}`;
          }
        } else {
          errorMessage += 'The request format is not valid for the API endpoint. Please check your backend API documentation.';
        }
      } else if (error?.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please verify your backend server has the /api/v1/voice/text-chat endpoint.';
      } else if (error?.response?.status >= 500) {
        errorMessage += 'Backend server error. Please check your backend server logs.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      // Create error message in chat
      const errorChatMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: `❌ ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorChatMessage],
        isLoading: false,
      }));

      toast.error(errorMessage);
    }
  };

  const clearChat = () => {
    setState(prev => ({
      ...prev,
      messages: [],
    }));
    toast.success('Chat cleared!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';

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
          "max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg shadow-sm",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
        )}>
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          <div className="mt-2 text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    );
  };

  const suggestions = [
    "Hello, how can you help me?",
    "What can you do?",
    "Tell me a joke",
    "What's the weather like?",
    "Help me with my homework",
    "Explain quantum physics",
  ];

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mr-3 text-blue-500" />
                Voice Assistant Lite
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Simple text-to-text conversation with AI assistant
              </p>
            </div>
            
            {state.messages.length > 0 && (
              <button
                onClick={clearChat}
                className="btn-secondary flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Clear Chat
              </button>
            )}
          </motion.div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-col h-[calc(100%-8rem)] max-w-4xl mx-auto">
          {/* Messages Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            {state.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Voice Assistant Lite
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start a simple text conversation with the AI assistant
                </p>
                
                {/* Suggestions */}
                <div className="max-w-2xl mx-auto">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Try these suggestions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(suggestion)}
                        className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg p-3 text-sm text-left transition-colors border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Simple text-to-text conversation</li>
                    <li>• Fast response times</li>
                    <li>• Clean, minimal interface</li>
                    <li>• No file upload complexity</li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {state.messages.map(renderMessage)}
                </AnimatePresence>
                {state.isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <LoadingSpinner size="sm" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-end space-x-4">
              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
                  disabled={state.isLoading}
                  rows={inputMessage.split('\n').length || 1}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[3rem] max-h-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || state.isLoading}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[3rem] flex items-center"
              >
                {state.isLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* API Info */}
            <div className="mt-3 text-center text-xs text-gray-500">
              Connected to: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000/api/v1/voice/text-chat</code>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
