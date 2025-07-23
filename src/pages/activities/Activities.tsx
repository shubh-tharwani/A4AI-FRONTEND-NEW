import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  SparklesIcon,
  BookOpenIcon,
  PlayIcon,
  HeartIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Navigation from '../../components/layout/Navigation';
import { ActivityRequest, Story } from '../../types';
import { getGradeLabel, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';

type ActivityType = 'story' | 'game' | 'exercise';

interface ActivityState {
  currentStory: Story | null;
  likedStories: Set<string>;
  bookmarkedStories: Set<string>;
}

export default function Activities() {
  const [activityType, setActivityType] = useState<ActivityType>('story');
  const [loading, setLoading] = useState(false);
  const [activityState, setActivityState] = useState<ActivityState>({
    currentStory: null,
    likedStories: new Set(),
    bookmarkedStories: new Set(),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ActivityRequest>({
    defaultValues: {
      grade: 9,
      topic: '',
      language: 'English',
    }
  });

  const generateStory = async (data: ActivityRequest) => {
    try {
      setLoading(true);
      
      // Convert ActivityRequest to InteractiveStoryRequest format
      const storyRequest = {
        grade: data.grade,
        topic: data.topic
      };
      
      const response = await ApiService.Activities.createInteractiveStory(storyRequest);
      
      // Backend returns InteractiveStoryResponse directly
      if (response.story_id && response.story_text) {
        // Convert to our Story format
        const story: Story = {
          id: response.story_id,
          title: response.title,
          content: response.story_text,
          summary: response.title, // Use title as summary
          grade: response.grade_level,
          topic: response.topic,
          language: 'English', // Default language
          learning_objectives: response.learning_objectives,
          vocabulary_words: response.vocabulary_words
        };
        
        setActivityState(prev => ({
          ...prev,
          currentStory: story,
        }));
        toast.success('Interactive story generated successfully!');
      } else {
        toast.error('Invalid story data received from server.');
      }
    } catch (error: any) {
      console.error('Story generation error:', error);
      toast.error('Failed to generate story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (storyId: string) => {
    setActivityState(prev => {
      const newLiked = new Set(prev.likedStories);
      if (newLiked.has(storyId)) {
        newLiked.delete(storyId);
      } else {
        newLiked.add(storyId);
      }
      return { ...prev, likedStories: newLiked };
    });
  };

  const toggleBookmark = (storyId: string) => {
    setActivityState(prev => {
      const newBookmarked = new Set(prev.bookmarkedStories);
      if (newBookmarked.has(storyId)) {
        newBookmarked.delete(storyId);
      } else {
        newBookmarked.add(storyId);
      }
      return { ...prev, bookmarkedStories: newBookmarked };
    });
  };

  const activityTypes = [
    {
      id: 'story' as ActivityType,
      name: 'Interactive Stories',
      description: 'Engaging stories that make learning fun and memorable',
      icon: BookOpenIcon,
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      id: 'game' as ActivityType,
      name: 'Learning Games',
      description: 'Gamified exercises to reinforce key concepts',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'exercise' as ActivityType,
      name: 'Practice Exercises',
      description: 'Interactive drills to build mastery',
      icon: PlayIcon,
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  const renderActivitySelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {activityTypes.map((type) => (
        <motion.button
          key={type.id}
          onClick={() => setActivityType(type.id)}
          className={cn(
            "relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500",
            activityType === type.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r mb-4",
            type.gradient
          )}>
            <type.icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
          <p className="text-sm text-gray-600">{type.description}</p>
          
          {activityType === type.id && (
            <motion.div
              className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
              layoutId="activitySelector"
            />
          )}
        </motion.button>
      ))}
    </div>
  );

  const renderStoryForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Interactive Story</h2>
          <p className="text-gray-600">Generate an engaging educational story</p>
        </div>

        <form onSubmit={handleSubmit(generateStory)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <select
              {...register('grade', { required: 'Grade level is required' })}
              className="input-field"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <option key={grade} value={grade}>
                  {getGradeLabel(grade)}
                </option>
              ))}
            </select>
            {errors.grade && (
              <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic or Theme
            </label>
            <input
              {...register('topic', { 
                required: 'Topic is required',
                minLength: { value: 2, message: 'Topic must be at least 2 characters' }
              })}
              type="text"
              placeholder="e.g., Space exploration, Friendship, Ancient civilizations"
              className="input-field"
            />
            {errors.topic && (
              <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              {...register('language')}
              className="input-field"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Mandarin">Mandarin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-3" />
                Creating Story...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 mr-3" />
                Generate Story
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderStory = () => {
    if (!activityState.currentStory) return null;

    const story = activityState.currentStory;
    const isLiked = activityState.likedStories.has(story.id || '');
    const isBookmarked = activityState.bookmarkedStories.has(story.id || '');

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Story Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">{story.title}</h2>
            <p className="text-pink-100 text-lg">{story.summary}</p>
          </div>

          {/* Story Content */}
          <div className="p-8">
            <div className="prose max-w-none mb-8">
              <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
                {story.content}
              </div>
            </div>

            {/* Learning Objectives */}
            {story.learning_objectives && story.learning_objectives.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  What You'll Learn
                </h3>
                <ul className="space-y-2">
                  {story.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start text-blue-800">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Discussion Questions */}
            {story.discussion_questions && story.discussion_questions.length > 0 && (
              <div className="bg-green-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2" />
                  Think About It
                </h3>
                <ul className="space-y-3">
                  {story.discussion_questions.map((question, index) => (
                    <li key={index} className="text-green-800">
                      <span className="font-medium">Q{index + 1}:</span> {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Story Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleLike(story.id || '')}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                    isLiked
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {isLiked ? (
                    <HeartSolidIcon className="w-5 h-5" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  onClick={() => toggleBookmark(story.id || '')}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                    isBookmarked
                      ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {isBookmarked ? (
                    <StarSolidIcon className="w-5 h-5" />
                  ) : (
                    <StarIcon className="w-5 h-5" />
                  )}
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              <button
                onClick={() => setActivityState(prev => ({ ...prev, currentStory: null }))}
                className="btn-secondary"
              >
                Create New Story
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderComingSoon = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <SparklesIcon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon!</h2>
        <p className="text-gray-600 mb-8">
          {activityType === 'game' 
            ? "Interactive learning games and gamified exercises are in development."
            : "Practice exercises and interactive drills are coming soon."
          }
        </p>
        <button
          onClick={() => setActivityType('story')}
          className="btn-primary"
        >
          Try Interactive Stories
        </button>
      </div>
    </motion.div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Activities</h1>
            <p className="text-gray-600">
              Engage with interactive content designed to make learning enjoyable and effective
            </p>
          </motion.div>
        </div>

        {/* Activity Type Selector */}
        {renderActivitySelector()}

        {/* Content */}
        {activityType === 'story' && (
          <>
            {!activityState.currentStory ? renderStoryForm() : renderStory()}
          </>
        )}
        
        {(activityType === 'game' || activityType === 'exercise') && renderComingSoon()}
      </div>
    </Navigation>
  );
}
