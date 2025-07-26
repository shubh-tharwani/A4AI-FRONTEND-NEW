import React, { useState } from 'react';
// EditLessonPlanForm component and props
interface EditLessonPlanFormProps {
  plan: LessonPlan;
  onSave: (p: LessonPlan) => void;
  onCancel: () => void;
}

const EditLessonPlanForm: React.FC<EditLessonPlanFormProps> = ({ plan, onSave, onCancel }) => {
  const [formState, setFormState] = useState({
    title: plan.title,
    subject: plan.subject,
    topic: plan.topic,
    grade: plan.grade,
    duration: plan.duration,
    language: plan.language,
    date: plan.date || '',
    start_time: plan.start_time || '09:00',
    learning_objectives: plan.learning_objectives.join('\n'),
    assessment: plan.assessment,
    resources: plan.resources.join('\n'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPlan: LessonPlan = {
      ...plan,
      title: formState.title,
      subject: formState.subject,
      topic: formState.topic,
      grade: Number(formState.grade),
      duration: Number(formState.duration),
      language: formState.language,
      date: formState.date,
      start_time: formState.start_time,
      learning_objectives: formState.learning_objectives.split('\n').map(s => s.trim()).filter(Boolean),
      assessment: formState.assessment,
      resources: formState.resources.split('\n').map(s => s.trim()).filter(Boolean),
    };
    onSave(updatedPlan);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-8 p-8 bg-gray-50 rounded-xl border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input name="title" value={formState.title} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
        <input name="subject" value={formState.subject} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
        <input name="topic" value={formState.topic} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
        <input name="grade" type="number" value={formState.grade} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
        <input name="duration" type="number" value={formState.duration} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <input name="language" value={formState.language} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <input name="date" type="date" value={formState.date} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
        <input name="start_time" type="time" value={formState.start_time} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives (one per line)</label>
        <textarea name="learning_objectives" value={formState.learning_objectives} onChange={handleChange} className="input-field" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assessment</label>
        <input name="assessment" value={formState.assessment} onChange={handleChange} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Resources (one per line)</label>
        <textarea name="resources" value={formState.resources} onChange={handleChange} className="input-field" rows={2} />
      </div>
      <div className="flex space-x-4 mt-4">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};
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
import { validateObject, LessonPlanValidationSchema, showValidationErrors } from '../../utils/validation';

type PlanningView = 'create' | 'view';

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
    selectedPlan: null,
  });
  const [editMode, setEditMode] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LessonPlanFormRequest>({
    defaultValues: {
      grade: 9,
      subject: '',
      topic: '',
      duration: 45,
      language: 'English',
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
        // Validate lesson plan structure
        if (!response.lesson_plan.plan_overview) {
          throw new Error('Lesson plan missing essential content');
        }

        // Convert backend response to our LessonPlan format with better error handling
        const newPlan: LessonPlan = {
          id: response.plan_id || Date.now().toString(),
          title: response.lesson_plan?.plan_overview?.title || 
                `${data.subject.trim()} - ${data.topic.trim()}`,
          grade: data.grade,
          subject: data.subject.trim(),
          topic: data.topic.trim(),
          duration: data.duration,
          language: data.language || 'English',
          learning_objectives: response.lesson_plan?.plan_overview?.learning_outcomes || 
                              [`Learn about ${data.topic.trim()}`],
          activities: response.lesson_plan?.daily_schedule ? response.lesson_plan.daily_schedule.map(day => 
            (day.activities || []).map(activity => ({
              name: activity.topic || activity.activity_type || 'Learning Activity',
              description: activity.description || 'Educational activity',
              duration: 15, // Default duration as per original code
              materials: activity.materials_needed || []
            }))
          ).flat() : [{
            name: 'Introduction Activity',
            description: `Introduction to ${data.topic.trim()}`,
            duration: Math.floor(data.duration / 3),
            materials: ['Whiteboard', 'Materials as needed']
          }],
          assessment: response.lesson_plan?.assessment_plan?.formative_assessments?.join(', ') ||
                     'Ongoing observation and student participation',
          resources: response.lesson_plan?.resources?.required_materials || 
                    ['Basic classroom materials'],
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
    setEditMode(false);
  };

  const editPlan = (plan: LessonPlan) => {
    setPlanningState(prev => ({
      ...prev,
      currentPlan: plan,
    }));
    setEditMode(true);
    setView('view');
  };

  const saveEditedPlan = (updatedPlan: LessonPlan) => {
    setPlanningState(prev => ({
      ...prev,
      currentPlan: updatedPlan,
      savedPlans: prev.savedPlans.map(plan => plan.id === updatedPlan.id ? updatedPlan : plan),
    }));
    setEditMode(false);
    toast.success('Lesson plan updated');
  };

  const fetchCurrentPlan = async () => {
    try {
      setLoading(true);
      // Get user ID from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        toast.error('Please login to view plans');
        return;
      }

      const user = JSON.parse(userJson);
      console.log(user.id)
      const response = await ApiService.Planning.getCurrentPlan(user.id);

      if (response && response.lesson_plan) {
        try {
          const lessonPlanData = JSON.parse(response.lesson_plan.replace(/'/g, '"'));
          const curriculum = lessonPlanData.curriculum;

          const newPlan: LessonPlan = {
            id: response.plan_id,
            title: `${curriculum.subject} - ${curriculum.topic}`,
            grade: curriculum.grade,
            subject: curriculum.subject,
            topic: curriculum.topic,
            duration: curriculum.duration,
            language: 'English',
            learning_objectives: curriculum.learningObjectives,
            activities: curriculum.schedule.map((item: { topic: string; activities: string[]; duration: number; startTime: string }) => ({
              name: item.topic,
              description: item.activities.join('\n'),
              duration: item.duration,
              materials: []
            })),
            assessment: 'Based on class participation and understanding',
            resources: ['Textbook', 'Visual aids', 'Class materials'],
            created_at: new Date().toISOString()
          };

          setPlanningState(prev => ({
            ...prev,
            currentPlan: newPlan
          }));
          setView('view');
          toast.success('Current plan loaded successfully!');
        } catch (parseError) {
          console.error('Error parsing lesson plan:', parseError);
          toast.error('Error parsing lesson plan data');
        }
      } else {
        toast.error('No current plan found');
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
      toast.error('Failed to load current plan');
    } finally {
      setLoading(false);
    }
  };

  const renderNavigation = () => (
    <div className="flex space-x-4 mb-8">
      {[
        { id: 'create', name: 'Create Plan', icon: ClipboardDocumentListIcon },
        { id: 'view', name: 'Current Plan', icon: BookOpenIcon },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => { 
            if (tab.id === 'view') {
              fetchCurrentPlan();
            } else {
              setView(tab.id as 'create' | 'view');
              setEditMode(false);
            }
          }}
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
              <div className="flex items-center">
                <CalendarDaysIcon className="w-5 h-5 mr-2" />
                {plan.date || '-'}
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
                  {plan.learning_objectives && plan.learning_objectives.map((objective, index) => (
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
                  {plan.activities && plan.activities.map((activity, index) => (
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
                  {plan.resources && plan.resources.map((resource, index) => (
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
                onClick={() => setEditMode(true)}
                className="btn-primary"
              >
                Edit Plan
              </button>
            </div>
            {editMode && (
              <EditLessonPlanForm
                plan={plan}
                onSave={saveEditedPlan}
                onCancel={() => setEditMode(false)}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Removed manage view

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
