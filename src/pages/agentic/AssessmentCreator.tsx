import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AssessmentRequest, AssessmentResponse } from '../../types/agentic';
import AgenticService from '../../services/agenticService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

export default function AssessmentCreator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const [formData, setFormData] = useState<AssessmentRequest>({
    topic: '',
    grade_level: 'elementary',
    assessment_type: 'comprehensive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AgenticService.createAssessment(formData);
      setResult(response);
      toast.success('Assessment created successfully!');
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Assessment</h2>
        
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
              placeholder="Enter the topic for assessment"
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
              >
                <option value="elementary">Elementary</option>
                <option value="middle">Middle School</option>
                <option value="high">High School</option>
                <option value="college">College</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Type
              </label>
              <select
                value={formData.assessment_type}
                onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="quiz">Quiz</option>
                <option value="test">Test</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
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
                  Creating...
                </>
              ) : (
                'Create Assessment'
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
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{result.assessment.title}</h3>
            <div className="text-sm text-gray-500 mt-1">
              {result.metadata.topic} | Grade: {result.metadata.grade_level} | 
              Difficulty: {result.metadata.difficulty} | 
              Duration: {result.metadata.estimated_duration} minutes
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <ReactMarkdown>{result.assessment.instructions}</ReactMarkdown>
            </div>

            <div className="space-y-6">
              {result.assessment.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    <span className="text-sm text-gray-500">{question.points} points</span>
                  </div>
                  
                  <div className="mb-3">
                    <ReactMarkdown>{question.question}</ReactMarkdown>
                  </div>

                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            id={`option-${question.id}-${i}`}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            disabled
                          />
                          <label htmlFor={`option-${question.id}-${i}`} className="text-gray-700">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'short_answer' && (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400"
                      rows={2}
                      placeholder="Enter your answer here..."
                      disabled
                    />
                  )}

                  {question.type === 'essay' && (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400"
                      rows={4}
                      placeholder="Enter your essay here..."
                      disabled
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <div>Total Points: {result.metadata.total_points}</div>
              <div>Estimated Duration: {result.metadata.estimated_duration} minutes</div>
              <div>Created: {new Date().toLocaleString()}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
