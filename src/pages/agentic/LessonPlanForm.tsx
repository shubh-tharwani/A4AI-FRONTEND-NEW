import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LessonPlanRequest, LessonPlanResponse } from '../../types/agentic';
import AgenticService from '../../services/agenticService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

export default function LessonPlanForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LessonPlanResponse | null>(null);
  const [formData, setFormData] = useState<LessonPlanRequest>({
    topic: '',
    grade_level: '',
    duration: 60,
    learning_objectives: [''],
    subject_area: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AgenticService.createCompleteLessonPlan(formData);
      setResult(response);
      toast.success('Lesson plan generated successfully!');
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      toast.error('Failed to generate lesson plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      learning_objectives: [...formData.learning_objectives, ''],
    });
  };

  const removeObjective = (index: number) => {
    const newObjectives = formData.learning_objectives.filter((_, i) => i !== index);
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Lesson Plan</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select grade level</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={`grade_${i + 1}`}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min="15"
                max="180"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Area
            </label>
            <select
              value={formData.subject_area}
              onChange={(e) => setFormData({ ...formData, subject_area: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select subject area</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="english">English</option>
              <option value="history">History</option>
              <option value="geography">Geography</option>
              <option value="art">Art</option>
              <option value="music">Music</option>
              <option value="physical_education">Physical Education</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Learning Objectives
              </label>
              <button
                type="button"
                onClick={addObjective}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Objective
              </button>
            </div>
            
            {formData.learning_objectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter learning objective"
                  required
                />
                {formData.learning_objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Generating...
                </>
              ) : (
                'Generate Lesson Plan'
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {result.plan.title}
          </h3>

          <div className="prose max-w-none">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Objectives</h4>
            <ul className="list-disc pl-5 mb-4">
              {result.plan.objectives.map((objective, index) => (
                <li key={index} className="text-gray-600">{objective}</li>
              ))}
            </ul>

            <h4 className="text-lg font-medium text-gray-700 mb-2">Materials Needed</h4>
            <ul className="list-disc pl-5 mb-4">
              {result.plan.materials.map((material, index) => (
                <li key={index} className="text-gray-600">{material}</li>
              ))}
            </ul>

            <h4 className="text-lg font-medium text-gray-700 mb-2">Activities</h4>
            {result.plan.activities.map((activity, index) => (
              <div key={index} className="mb-4">
                <h5 className="font-medium text-gray-800">
                  {activity.title} ({activity.duration} minutes)
                </h5>
                <div className="text-gray-600 mt-2">
                  <ReactMarkdown>{activity.description}</ReactMarkdown>
                </div>
                <ul className="list-decimal pl-5 mt-2">
                  {activity.instructions.map((instruction, i) => (
                    <li key={i} className="text-gray-600">{instruction}</li>
                  ))}
                </ul>
              </div>
            ))}

            <h4 className="text-lg font-medium text-gray-700 mb-2">Assessment</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-800">{result.plan.assessment.type}</p>
              <p className="text-gray-600 mt-2">{result.plan.assessment.description}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p>Grade Level: {result.metadata.grade_level}</p>
                <p>Subject: {result.metadata.subject}</p>
                <p>Duration: {result.metadata.duration} minutes</p>
                <p>Created: {new Date(result.metadata.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
