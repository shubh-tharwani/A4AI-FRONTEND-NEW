import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { LessonPlanFormRequest, LessonPlan } from '../../types';
import { getGradeLabel, formatDate, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';

type PlanningView = 'create' | 'view' | 'manage';

interface PlanningState {
  currentPlan: LessonPlan | null;
  savedPlans: LessonPlan[];
  selectedPlan: string | null;
}

export default function Planning() {
  const [view, setView] = useState<PlanningView>('create');
  const [loading, setLoading] = useState(false);
  const [planningState, setPlanningState] = useState<PlanningState>({
    currentPlan: null,
    savedPlans: [],
    selectedPlan: null,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LessonPlanFormRequest>({
    defaultValues: {
      grade: 9,
      subject: '',
      topic: '',
      duration: 45,
      language: 'English',
    }
  });

  const generateLessonPlan = async (data: LessonPlanFormRequest) => {
    try {
      setLoading(true);
      
      // Convert form data to the format expected by the backend
      const planRequest = {
        class_id: 'default-class', // Use a default class ID for now
        plan_type: 'daily' as const,
        duration: 1, // Daily plan duration
        learning_objectives: [`Learn about ${data.topic} for grade ${data.grade}`],
        curriculum_standards: [`${data.subject} - Grade ${data.grade}`]
      };
      
      const response = await ApiService.Planning.createLessonPlan(planRequest);
      
      if (response.status === 'success' && response.lesson_plan) {
        // Convert backend response to our LessonPlan format
        const newPlan: LessonPlan = {
          id: response.plan_id,
          title: response.lesson_plan.plan_overview.title,
          grade: data.grade,
          subject: data.subject,
          topic: data.topic,
          duration: data.duration,
          language: data.language,
          learning_objectives: response.lesson_plan.plan_overview.learning_outcomes,
          activities: response.lesson_plan.daily_schedule.map(day => 
            day.activities.map(activity => ({
              name: activity.topic,
              description: activity.description,
              duration: 15, // Default duration
              materials: activity.materials_needed || []
            }))
          ).flat(),
          assessment: response.lesson_plan.assessment_plan?.formative_assessments?.join(', '),
          resources: response.lesson_plan.resources?.required_materials,
          created_at: new Date().toISOString(),
        };
        
        setPlanningState(prev => ({
          ...prev,
          currentPlan: newPlan,
          savedPlans: [...prev.savedPlans, newPlan],
        }));
        setView('view');
        toast.success('Lesson plan generated successfully!');
      } else {
        toast.error('Invalid lesson plan data received from server.');
      }
    } catch (error: any) {
      console.error('Lesson plan generation error:', error);
      toast.error('Failed to generate lesson plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = (planId: string) => {
    setPlanningState(prev => ({
      ...prev,
      savedPlans: prev.savedPlans.filter(plan => plan.id !== planId),
      currentPlan: prev.currentPlan?.id === planId ? null : prev.currentPlan,
    }));
    toast.success('Lesson plan deleted');
  };

  const viewPlan = (plan: LessonPlan) => {
    setPlanningState(prev => ({
      ...prev,
      currentPlan: plan,
    }));
    setView('view');
  };

  const renderNavigation = () => (
    <div className="flex space-x-4 mb-8">
      {[
        { id: 'create' as PlanningView, name: 'Create Plan', icon: ClipboardDocumentListIcon },
        { id: 'view' as PlanningView, name: 'Current Plan', icon: BookOpenIcon },
        { id: 'manage' as PlanningView, name: 'My Plans', icon: CalendarDaysIcon },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
            view === tab.id
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <tab.icon className="w-5 h-5" />
          <span>{tab.name}</span>
        </button>
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
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Lesson Plan</h2>
          <p className="text-gray-600">Generate a comprehensive lesson plan tailored to your needs</p>
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
    if (!planningState.currentPlan) {
      return (
        <div className="text-center py-12">
          <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plan selected</h3>
          <p className="text-gray-600 mb-6">Create a new lesson plan or select one from your saved plans</p>
          <button
            onClick={() => setView('create')}
            className="btn-primary"
          >
            Create New Plan
          </button>
        </div>
      );
    }

    const plan = planningState.currentPlan;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Plan Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">{plan.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-blue-100">
              <div className="flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Grade {plan.grade}
              </div>
              <div className="flex items-center">
                <BookOpenIcon className="w-5 h-5 mr-2" />
                {plan.subject}
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                {plan.duration} minutes
              </div>
              <div className="flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                {plan.language}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Learning Objectives */}
            {plan.learning_objectives && plan.learning_objectives.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 mr-2 text-green-500" />
                  Learning Objectives
                </h3>
                <ul className="space-y-2">
                  {plan.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-600 mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Activities */}
            {plan.activities && plan.activities.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <LightBulbIcon className="w-6 h-6 mr-2 text-yellow-500" />
                  Lesson Activities
                </h3>
                <div className="space-y-4">
                  {plan.activities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          Activity {index + 1}: {activity.name}
                        </h4>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {activity.duration} min
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{activity.description}</p>
                      
                      {activity.materials && activity.materials.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Materials Needed:</h5>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {activity.materials.map((material, idx) => (
                              <li key={idx}>{material}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Assessment */}
            {plan.assessment && (
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-purple-500" />
                  Assessment
                </h3>
                <div className="bg-purple-50 rounded-lg p-6">
                  <p className="text-purple-800">{plan.assessment}</p>
                </div>
              </section>
            )}

            {/* Resources */}
            {plan.resources && plan.resources.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpenIcon className="w-6 h-6 mr-2 text-indigo-500" />
                  Additional Resources
                </h3>
                <ul className="space-y-2">
                  {plan.resources.map((resource, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {resource}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setView('create')}
                className="btn-secondary"
              >
                Create New Plan
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary"
              >
                Print Plan
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderManagePlans = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Lesson Plans</h2>
        <button
          onClick={() => setView('create')}
          className="btn-primary"
        >
          Create New Plan
        </button>
      </div>

      {planningState.savedPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved lesson plans</h3>
          <p className="text-gray-600 mb-6">Create your first lesson plan to get started</p>
          <button
            onClick={() => setView('create')}
            className="btn-primary"
          >
            Create Lesson Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {planningState.savedPlans.map((plan) => (
            <motion.div
              key={plan.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => viewPlan(plan)}
              whileHover={{ y: -2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.title}</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <div>Grade {plan.grade} • {plan.subject}</div>
                <div>{plan.duration} minutes • {plan.language}</div>
                {plan.created_at && (
                  <div>Created {formatDate(plan.created_at)}</div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewPlan(plan);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View Plan
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlan(plan.id || '');
                  }}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
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
        {view === 'manage' && renderManagePlans()}
      </div>
    </Navigation>
  );
}
