import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  PhotoIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  PaintBrushIcon,
  Squares2X2Icon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Navigation from '../../components/layout/Navigation';
import { VisualAidRequest, VisualAidResponse } from '../../types';
import { cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { validateObject, VisualAidValidationSchema, showValidationErrors } from '../../utils/validation';

type ViewMode = 'create' | 'gallery';

interface VisualAidsState {
  currentAid: VisualAidResponse | null;
  savedAids: VisualAidResponse[];
  likedAids: Set<string>;
  selectedVisualType: 'infographic' | 'illustration' | 'diagram' | 'chart';
}

export default function VisualAids() {
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [loading, setLoading] = useState(false);
  const [visualAidsState, setVisualAidsState] = useState<VisualAidsState>({
    currentAid: null,
    savedAids: [],
    likedAids: new Set(),
    selectedVisualType: 'infographic',
  });

  const { register, handleSubmit, formState: { errors } } = useForm<VisualAidRequest>({
    defaultValues: {
      topic: '',
      grade: '5',
      subject: 'Science',
      visualType: 'infographic',
      style: 'modern',
      color_scheme: 'blue'
    }
  });

  const generateVisualAid = async (data: VisualAidRequest) => {
    try {
      setLoading(true);
      console.log('📤 Making visual aid request with data:', data);

      // Comprehensive input validation
      const validation = validateObject(data, VisualAidValidationSchema);
      
      if (!validation.isValid) {
        showValidationErrors(validation.errors);
        return;
      }

      // Additional business logic validation
      if (!data.topic || data.topic.trim().length < 1) {
        toast.error('Please provide a topic (at least 1 character).');
        return;
      }

      if (data.topic.trim().length > 200) {
        toast.error('Topic is too long. Please keep it under 200 characters.');
        return;
      }

      if (!data.grade) {
        toast.error('Please select a grade level.');
        return;
      }

      const requestData: VisualAidRequest = {
        topic: data.topic?.trim() || '',
        grade: data.grade?.toString() || '5',
        subject: data.subject?.trim() || 'Science',
        visualType: visualAidsState.selectedVisualType,
        style: 'modern',
        color_scheme: 'blue'
      };
      
      // Final validation before sending
      if (!requestData.topic || requestData.topic.length < 1 || requestData.topic.length > 200) {
        toast.error('Topic must be between 1-200 characters');
        return;
      }
      
      if (!requestData.grade) {
        toast.error('Grade level is required');
        return;
      }
      
      if (!requestData.subject || requestData.subject.length === 0) {
        toast.error('Subject is required');
        return;
      }
      
      console.log('📤 Sending Visual Aid Request:', requestData);
      
      const response = await ApiService.VisualAids.generateVisualAid(requestData);
      
      console.log('📥 Visual Aid API response:', response);
      
      // Enhanced response validation with detailed logging
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Log the complete response structure for debugging
      console.log('🔍 Complete Response Structure:', JSON.stringify(response, null, 2));
      console.log('🔍 Response Keys:', Object.keys(response));
      console.log('🔍 Response Type:', typeof response);
      
      // Use flexible response checking with type assertion
      const flexibleResponse = response as any;
      
      // Check for the actual backend response structure: { success, message, data: { id, image_url, ... } }
      if (flexibleResponse.success && flexibleResponse.data && flexibleResponse.data.id) {
        console.log('✅ Backend response structure detected (success + data.id)');
        
        const backendData = flexibleResponse.data;
        
        // Normalize the response to match our expected format
        const normalizedResponse = {
          visual_aid_id: backendData.id,
          status: flexibleResponse.success ? 'success' : 'error',
          prompt: requestData.topic,
          asset_type: requestData.visualType || 'infographic',
          image_url: backendData.image_url || '',
          filename: backendData.filename || `visual-aid-${Date.now()}.png`,
          topic: backendData.metadata?.topic || requestData.subject || 'Educational Content',
          metadata: {
            generation_model: backendData.metadata?.generation_model || 'AI Model',
            prompt_length: requestData.topic.length,
            image_size: backendData.metadata?.image_size || 0,
            generated_at: backendData.metadata?.created_at || new Date().toISOString(),
            dimensions: backendData.metadata?.dimensions || '800x600',
            visual_type: backendData.metadata?.visual_type || requestData.visualType
          }
        };
        
        console.log('🔧 Normalized Response:', normalizedResponse);
        
        const validatedAid = normalizedResponse;

        console.log('✅ Final validated aid:', validatedAid);
        console.log('🖼️ Final image_size:', validatedAid.metadata.image_size);

        setVisualAidsState(prev => ({
          ...prev,
          currentAid: validatedAid,
          savedAids: [...prev.savedAids, validatedAid],
        }));
        setViewMode('gallery');
        toast.success(`${visualAidsState.selectedVisualType} generated successfully! 🎨`);
        
        // Highlight that this is a NEW result
        console.log('🎉 NEW VISUAL AID GENERATED SUCCESSFULLY!');
        console.log('📍 This is a fresh, unique result based on your topic.');
        console.log('🖼️ Check the gallery to see your new visual aid!');
      } else {
        // Handle different error scenarios
        console.error('🚨 Unexpected backend response structure');
        console.error('📋 Expected: { success: true, data: { id, image_url, ... } }');
        console.error('📋 Actual response:', response);
        console.error('📋 Available keys:', Object.keys(response || {}));
        
        // Check for backend error messages
        if (flexibleResponse.success === false) {
          const errorMsg = flexibleResponse.message || flexibleResponse.error || 'Visual aid generation failed';
          console.error('🚨 Backend reported failure:', errorMsg);
          toast.error(`Backend error: ${errorMsg}`);
        } else if (flexibleResponse.message && !flexibleResponse.success) {
          toast.error(`Backend message: ${flexibleResponse.message}`);
        } else {
          toast.error('Unexpected response structure from server. Please check console for details.');
        }
      }
    } catch (error: any) {
      console.error('Visual aid generation error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to generate ${visualAidsState.selectedVisualType}`;
      toast.error(`${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (aidId: string) => {
    setVisualAidsState(prev => {
      const newLiked = new Set(prev.likedAids);
      if (newLiked.has(aidId)) {
        newLiked.delete(aidId);
      } else {
        newLiked.add(aidId);
      }
      return { ...prev, likedAids: newLiked };
    });
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const shareAid = (aid: VisualAidResponse) => {
    if (navigator.share) {
      navigator.share({
        title: aid.topic,
        text: aid.prompt,
        url: aid.image_url,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(aid.image_url).then(() => {
        toast.success('Link copied to clipboard!');
      });
    }
  };

  const clearGallery = () => {
    setVisualAidsState(prev => ({
      ...prev,
      savedAids: [],
      currentAid: null,
      likedAids: new Set()
    }));
    toast.success('Gallery cleared!');
  };

  const generateNewAid = () => {
    setViewMode('create');
    // Don't clear current aid, just switch to create mode
  };

  const renderAssetTypeSelector = () => (
    <div className="flex space-x-4 mb-8">
      {[
        { type: 'infographic' as const, label: 'Infographics', icon: PhotoIcon, description: 'Visual information displays and educational posters' },
        { type: 'illustration' as const, label: 'Illustrations', icon: PaintBrushIcon, description: 'Educational drawings and artwork' },
        { type: 'diagram' as const, label: 'Diagrams', icon: Squares2X2Icon, description: 'Process flows and structural diagrams' },
        { type: 'chart' as const, label: 'Charts', icon: ChartBarIcon, description: 'Data visualization and graphs' },
      ].map((option) => (
        <motion.button
          key={option.type}
          onClick={() => setVisualAidsState(prev => ({ ...prev, selectedVisualType: option.type }))}
          className={cn(
            "flex-1 p-6 rounded-xl border-2 transition-all duration-200 text-left",
            visualAidsState.selectedVisualType === option.type
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center mb-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mr-3",
              visualAidsState.selectedVisualType === option.type
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            )}>
              <option.icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{option.label}</h3>
          </div>
          <p className="text-sm text-gray-600">{option.description}</p>
        </motion.button>
      ))}
    </div>
  );

  const renderCreateForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhotoIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Visual Aid</h2>
          <p className="text-gray-600">Create unique, AI-generated educational images based on your specific topic</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-800">
              💡 Each visual aid is generated uniquely based on your topic, grade level, and subject. Different topics will produce completely different images!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(generateVisualAid)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to visualize?
            </label>
            <textarea
              {...register('topic', { 
                required: 'Topic is required',
                minLength: { value: 1, message: 'Topic must be at least 1 character' },
                maxLength: { value: 200, message: 'Topic must be less than 200 characters' }
              })}
              rows={4}
              placeholder="e.g., A detailed diagram of the human heart showing all four chambers, major blood vessels, and the flow of oxygenated and deoxygenated blood"
              className="input-field resize-none"
            />
            {errors.topic && (
              <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <select
                {...register('grade', { required: 'Grade level is required' })}
                className="input-field"
              >
                <option value="">Select Grade Level</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                  <option key={grade} value={grade.toString()}>
                    Grade {grade}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                type="text"
                placeholder="e.g., Biology, Physics, History"
                className="input-field"
              />
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-3" />
                Generating Image...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 mr-3" />
                Generate Visual Aid
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderCurrentAid = () => {
    if (!visualAidsState.currentAid) return null;

    const aid = visualAidsState.currentAid;
    const isLiked = visualAidsState.likedAids.has(aid.visual_aid_id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Image Display */}
          <div className="aspect-video bg-gray-100 relative">
            <img
              src={aid.image_url}
              alt={aid.topic}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/api/placeholder/800/600';
              }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{aid.topic}</h3>
            <p className="text-gray-600 mb-4">{aid.prompt}</p>

            {/* Enhanced Prompt */}
            {aid.enhanced_prompt && aid.enhanced_prompt !== aid.prompt && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Enhanced Description:</h4>
                <p className="text-sm text-blue-800">{aid.enhanced_prompt}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Type</div>
                <div className="text-sm text-gray-600 capitalize">{aid.asset_type}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Model</div>
                <div className="text-sm text-gray-600">{aid.metadata.generation_model}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Size</div>
                <div className="text-sm text-gray-600">{(aid.metadata.image_size / 1024).toFixed(1)}KB</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Generated</div>
                <div className="text-sm text-gray-600">
                  {new Date(aid.metadata.generated_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleLike(aid.visual_aid_id)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                    isLiked
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {isLiked ? (
                    <HeartSolidIcon className="w-4 h-4" />
                  ) : (
                    <HeartIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm">{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  onClick={() => downloadImage(aid.image_url, aid.filename)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </button>

                <button
                  onClick={() => shareAid(aid)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ShareIcon className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              <button
                onClick={() => setVisualAidsState(prev => ({ ...prev, currentAid: null }))}
                className="btn-secondary"
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderGallery = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Visual Aids</h2>
          <p className="text-sm text-gray-600 mt-1">
            {visualAidsState.savedAids.length} visual aid{visualAidsState.savedAids.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <div className="flex space-x-3">
          {visualAidsState.savedAids.length > 0 && (
            <button
              onClick={clearGallery}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear Gallery
            </button>
          )}
          <button
            onClick={generateNewAid}
            className="btn-primary"
          >
            Create New
          </button>
        </div>
      </div>

      {visualAidsState.savedAids.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visual aids created</h3>
          <p className="text-gray-600 mb-6">Generate your first visual aid to get started</p>
          <button
            onClick={() => setViewMode('create')}
            className="btn-primary"
          >
            Create Visual Aid
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualAidsState.savedAids.map((aid, index) => {
            const isCurrentAid = visualAidsState.currentAid?.visual_aid_id === aid.visual_aid_id;
            const isNewest = index === visualAidsState.savedAids.length - 1;
            
            return (
            <motion.div
              key={aid.visual_aid_id}
              className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative",
                isCurrentAid && "ring-2 ring-blue-500 ring-opacity-50"
              )}
              whileHover={{ y: -2 }}
            >
              {isNewest && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    NEW
                  </span>
                </div>
              )}
              <div className="aspect-video bg-gray-100">
                <img
                  src={aid.image_url}
                  alt={aid.topic}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/400/300';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">{aid.topic}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{aid.prompt}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {new Date(aid.metadata.generated_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => {
                      setVisualAidsState(prev => ({ ...prev, currentAid: aid }));
                      setViewMode('create');
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const renderNavigation = () => (
    <div className="flex space-x-4 mb-8">
      {[
        { id: 'create' as ViewMode, name: 'Create', icon: SparklesIcon },
        { id: 'gallery' as ViewMode, name: 'Gallery', icon: MagnifyingGlassIcon },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setViewMode(tab.id)}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
            viewMode === tab.id
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <tab.icon className="w-5 h-5" />
          <span>{tab.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Visual Aids</h1>
            <p className="text-gray-600">
              Generate AI-powered educational images and visual content to enhance learning
            </p>
          </motion.div>
        </div>

        {/* Navigation */}
        {renderNavigation()}

        {/* Content */}
        {viewMode === 'create' && (
          <>
            {renderAssetTypeSelector()}
            {visualAidsState.currentAid ? renderCurrentAid() : renderCreateForm()}
          </>
        )}
        
        {viewMode === 'gallery' && renderGallery()}
      </div>
    </Navigation>
  );
}
