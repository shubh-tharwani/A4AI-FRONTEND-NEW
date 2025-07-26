import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface PlanCardProps {
  plan: any;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Extract lesson plan details safely based on the backend response structure
  const lessonPlan = plan.lesson_plan?.lesson_plan || plan;
  const curriculumPlan = lessonPlan.curriculum_plan || plan.curriculum_plan || [];
  const learningObjectives = lessonPlan.learning_objectives || plan.learning_objectives || [];
  
  // List view fields - these should come from the top level or lesson_plan.lesson_plan
  const duration = lessonPlan.duration || plan.duration || '-';
  const grade = lessonPlan.grade || plan.grade || '-';
  const startTime = lessonPlan.start_time || plan.start_time || '-';
  const subject = lessonPlan.subject || plan.subject || '-';
  const topic = lessonPlan.topic || plan.topic || '-';

  console.log('Plan Card Data:', {
    duration,
    grade,
    startTime,
    subject,
    topic,
    curriculumPlanLength: curriculumPlan.length
  });

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 hover:shadow-lg transition-shadow">
      {/* List View Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6 flex-1">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{lessonPlan.date || plan.date || new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>{startTime}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <AcademicCapIcon className="w-4 h-4" />
            <span>Grade {grade}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BookOpenIcon className="w-4 h-4" />
            <span>{subject}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>{duration} min</span>
          </div>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ChevronRightIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} />
        </button>
      </div>

      {/* Topic (main title) */}
      <div className="text-blue-700 font-medium text-lg mb-3">
        {topic}
      </div>

      {/* Learning Objectives - Always visible */}
      <div className="mb-3">
        <span className="font-semibold text-gray-700 text-sm">Learning Objectives:</span>
        <ul className="list-disc list-inside text-gray-600 text-sm mt-1 space-y-1">
          {learningObjectives.map((obj: string, idx: number) => (
            <li key={idx}>{obj}</li>
          ))}
        </ul>
      </div>

      {/* Expanded Details: Curriculum Plan */}
      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-3">Curriculum Plan Details</h4>
          {curriculumPlan.length > 0 ? (
            <div className="space-y-3">
              {curriculumPlan.map((unit: any, index: number) => {
                const schedule = unit.schedule || {};
                const unitTopic = schedule.topic || `Unit ${index + 1}`;
                
                return (
                  <div 
                    key={index} 
                    className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow transition-shadow"
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedUnit(expandedUnit === unitTopic ? null : unitTopic)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 text-sm font-mono bg-blue-100 px-2 py-1 rounded">
                          {schedule.start_time || 'No time'}
                        </span>
                        <h3 className="font-semibold text-blue-900">{unitTopic}</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {schedule.duration || 0} min
                        </span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform text-gray-400 ${
                          expandedUnit === unitTopic ? 'transform rotate-180' : ''
                        }`} />
                      </div>
                    </div>
                    
                    {expandedUnit === unitTopic && (
                      <div className="mt-4 space-y-3">
                        {/* Activity Description */}
                        {schedule.activity && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Activity</h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{schedule.activity}</p>
                          </div>
                        )}
                        
                        {/* Content */}
                        {unit.content && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-700 mb-2">Content</h4>
                            <p className="text-blue-800 text-sm leading-relaxed">{unit.content}</p>
                          </div>
                        )}
                        
                        {/* Materials */}
                        {schedule.materials && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-green-700 mb-2">Materials Needed</h4>
                            <p className="text-green-800 text-sm">{schedule.materials}</p>
                          </div>
                        )}
                        
                        {/* Notes if available */}
                        {unit.notes && (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-yellow-700 mb-2">Notes</h4>
                            <p className="text-yellow-800 text-sm">{unit.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
              <BookOpenIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No detailed curriculum plan available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  LightBulbIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { LessonPlanFormRequest, LessonPlan } from '../../types';
import { getGradeLabel, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { validateObject, LessonPlanValidationSchema, showValidationErrors } from '../../utils/validation';

interface PlanningState {
  currentPlan: LessonPlan | null;
  savedPlans: LessonPlan[];
  selectedPlan: string | null;
}

export default function Planning() {
  const [view, setView] = useState<'create' | 'view'>('create');
  const [loading, setLoading] = useState(false);
  const [planningState, setPlanningState] = useState<PlanningState>({
    currentPlan: null,
    savedPlans: [],
    selectedPlan: null
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LessonPlanFormRequest>({
    defaultValues: {
      grade: 9,
      subject: '',
      topic: '',
      duration: 45,
      date: new Date().toISOString().slice(0, 10),
      start_time: '09:00',
    }
  });

  const generateLessonPlan = async (data: LessonPlanFormRequest) => {
    try {
      setLoading(true);
      console.log('📤 Making lesson plan request with data:', data);
      
      // Comprehensive input validation
      const validation = validateObject(data, LessonPlanValidationSchema);
      
      if (!validation.isValid) {
        showValidationErrors(validation.errors);
        return;
      }

      // Additional business logic validation
      if (!data.topic || data.topic.trim().length < 2) {
        toast.error('Please provide a valid topic (at least 2 characters).');
        return;
      }

      if (!data.subject || data.subject.trim().length < 2) {
        toast.error('Please provide a valid subject (at least 2 characters).');
        return;
      }

      if (!data.duration || data.duration < 15 || data.duration > 180) {
        toast.error('Please select a valid duration between 15 and 180 minutes.');
        return;
      }
      
      // Get user_id from localStorage user key
      let user_id = '';
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          user_id = user.id;
        }
        
        if (!user_id) {
          toast.error('Please login to create a lesson plan');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        toast.error('Please login to create a lesson plan');
        setLoading(false);
        return;
      }

      // Convert form data to the format expected by the backend
      const planRequest = {
        class_id: 'default-class', // Use a default class ID for now
        plan_type: 'daily' as const,
        duration: data.duration,
       // Daily plan duration
        learning_objectives: [`Learn about ${data.topic.trim()} for grade ${data.grade}`],
        curriculum_standards: [`${data.subject.trim()} - Grade ${data.grade}`],
        date: data.date,
        start_time: data.start_time,
        user_id,
      };

      const response = await ApiService.Planning.createLessonPlan(planRequest);
      
      // Enhanced response validation
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (response.status === 'success' && response.lesson_plan) {
        // Validate lesson plan structure - updated to match actual backend response
        const responseData = response as any; // Use any type to handle actual backend structure
        if (!responseData.lesson_plan.lesson_plan) {
          throw new Error('Lesson plan missing essential content');
        }

        // Convert backend response to our LessonPlan format with better error handling
        const lessonPlanData = responseData.lesson_plan.lesson_plan;
        const newPlan: LessonPlan = {
          id: response.plan_id || Date.now().toString(),
          title: `${lessonPlanData.subject || data.subject.trim()} - ${lessonPlanData.topic || data.topic.trim()}`,
          grade: lessonPlanData.grade || data.grade,
          subject: lessonPlanData.subject || data.subject.trim(),
          topic: lessonPlanData.topic || data.topic.trim(),
          duration: lessonPlanData.duration || data.duration,
          start_time: lessonPlanData.start_time || data.start_time,
          language: 'English', // Default language since form field was removed
          learning_objectives: lessonPlanData.learning_objectives || 
                              [`Learn about ${data.topic.trim()}`],
          curriculum_plan: lessonPlanData.curriculum_plan || [],
          assessment: 'Ongoing observation and student participation',
          resources: ['Basic classroom materials'],
          created_at: new Date().toISOString(),
          date: data.date,
        };
        
        setPlanningState(prev => ({
          ...prev,
          currentPlan: newPlan,
          savedPlans: [...prev.savedPlans, newPlan],
        }));
        setView('view');
        toast.success('🎉 Your lesson plan is ready! Check out the detailed curriculum below.');
      } else {
        console.error('Invalid lesson plan structure:', response);
        toast.error('Invalid lesson plan data received from server. Please try again.');
      }
    } catch (error: any) {
      console.error('Lesson plan generation error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate lesson plan';
      toast.error(`Lesson plan generation failed: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      setLoading(true);
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        toast.error('Please login to view plans');
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userJson);
      console.log('Fetching plans for user:', user.id);
      const response = await ApiService.Planning.getCurrentPlan(user.id);
      
      if (!response || !Array.isArray(response.curriculum) || response.curriculum.length === 0) {
        toast.error('No lesson plans found');
        setPlanningState(prev => ({ ...prev, savedPlans: [] }));
        setLoading(false);
        return;
      }
      
      console.log('Raw backend response:', response);
      
      // Parse curriculum array based on the actual backend structure
      const convertedPlans = response.curriculum.map((curriculumItem: any) => {
        // Extract nested lesson plan data
        const lessonPlanData = curriculumItem.lesson_plan?.lesson_plan || curriculumItem.lesson_plan || {};
        
        // Extract list view fields with proper fallbacks
        const start_time = lessonPlanData.start_time || curriculumItem.start_time || '09:00';
        const subject = lessonPlanData.subject || curriculumItem.subject || 'Subject';
        const duration = lessonPlanData.duration || curriculumItem.duration || 45;
        const grade = lessonPlanData.grade || curriculumItem.grade || 9;
        const topic = lessonPlanData.topic || curriculumItem.topic || 'Topic';
        
        // Extract learning objectives
        const learning_objectives = lessonPlanData.learning_objectives || 
                                   curriculumItem.learning_objectives || 
                                   [];
        
        // Extract curriculum plan for detailed view
        const curriculum_plan = lessonPlanData.curriculum_plan || [];
        
        console.log('Converted plan data:', {
          id: curriculumItem.id,
          subject,
          topic,
          grade,
          duration,
          start_time,
          curriculum_plan_length: curriculum_plan.length
        });
        
        return {
          id: curriculumItem.id || String(Date.now()),
          title: `${subject} - ${topic}`,
          grade,
          subject,
          topic,
          duration,
          start_time,
          learning_objectives,
          curriculum_plan,
          assessment: 'Ongoing assessment and participation',
          resources: ['Standard classroom materials'],
          created_at: curriculumItem.created_at || new Date().toISOString(),
          date: curriculumItem.date || new Date().toISOString().slice(0, 10),
          language: 'English'
        };
      });
      
      setPlanningState(prev => ({ ...prev, savedPlans: convertedPlans }));
      setView('view');
      toast.success(`Loaded ${convertedPlans.length} lesson plan(s) successfully!`);
      
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderNavigation = () => (
    <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setView('create')}
        className={cn(
          "flex-1 py-3 px-6 rounded-md font-medium transition-all duration-200",
          view === 'create'
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        Create Plan
      </button>
      <button
        onClick={() => setView('view')}
        className={cn(
          "flex-1 py-3 px-6 rounded-md font-medium transition-all duration-200",
          view === 'view'
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        )}
      >
        View Plans
      </button>
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
          <LightBulbIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Lesson Plan</h2>
          <p className="text-gray-600">
            Generate a comprehensive lesson plan tailored to your curriculum needs
          </p>
        </div>

        <form onSubmit={handleSubmit(generateLessonPlan)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Duration (minutes)
              </label>
              <select
                {...register('duration', { required: 'Duration is required' })}
                className="input-field"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              {...register('subject', { 
                required: 'Subject is required',
                minLength: { value: 2, message: 'Subject must be at least 2 characters' }
              })}
              type="text"
              placeholder="e.g., Mathematics, Science, History, English"
              className="input-field"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <input
              {...register('topic', { 
                required: 'Topic is required',
                minLength: { value: 2, message: 'Topic must be at least 2 characters' }
              })}
              type="text"
              placeholder="e.g., Quadratic Equations, Cell Division, World War II"
              className="input-field"
            />
            {errors.topic && (
              <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              {...register('date', { required: 'Date is required' })}
              type="date"
              className="input-field"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              {...register('start_time', { required: 'Start time is required' })}
              type="time"
              className="input-field"
            />
            {errors.start_time && (
              <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-3" />
                Generating Lesson Plan...
              </>
            ) : (
              <>
                <LightBulbIcon className="w-6 h-6 mr-3" />
                Generate Lesson Plan
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderLessonPlan = () => {
    if (planningState.savedPlans.length === 0) {
      return (
        <div className="text-center py-12">
          <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans found</h3>
          <p className="text-gray-600 mb-6">Create a new lesson plan or try refreshing the page</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setView('create')}
              className="btn-primary"
            >
              Create New Plan
            </button>
            <button
              onClick={fetchCurrentPlan}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Refresh Plans</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={fetchCurrentPlan}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <ArrowPathIcon className={cn("w-5 h-5", loading && "animate-spin")} />
            <span>{loading ? "Refreshing..." : "Refresh Plans"}</span>
          </button>
        </div>

        {/* Plans Content */}
        <div className="space-y-4">
          {planningState.savedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </motion.div>
    );
  };

  // Removed manage view

  // Effect to fetch plans when first switching to view
  React.useEffect(() => {
    if (view === 'view' && planningState.savedPlans.length === 0) {
      fetchCurrentPlan();
    }
  }, [view]);

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Planning</h1>
            <p className="text-gray-600">
              Create comprehensive lesson plans with AI-powered curriculum suggestions
            </p>
          </motion.div>
        </div>

        {/* Navigation */}
        {renderNavigation()}

        {/* Content */}
        {view === 'create' && renderCreateForm()}
        {view === 'view' && renderLessonPlan()}
      </div>
    </Navigation>
  );
}
