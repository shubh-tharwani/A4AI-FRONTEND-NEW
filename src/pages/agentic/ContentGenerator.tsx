import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ContentGenerationRequest, ContentGenerationResponse } from '../../types/agentic';
import AgenticService from '../../services/agenticService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

export default function ContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentGenerationResponse | null>(null);
  const [formData, setFormData] = useState<ContentGenerationRequest>({
    topic: '',
    grade_level: 'elementary',
    content_type: 'comprehensive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AgenticService.generateContent(formData);
      setResult(response);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generate Content</h2>
        
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
              placeholder="Enter the topic for content generation"
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
                Content Type
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
                <option value="interactive">Interactive</option>
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
                  Generating...
                </>
              ) : (
                'Generate Content'
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
            <h3 className="text-xl font-semibold text-gray-800">Generated Content</h3>
            <div className="text-sm text-gray-500 mt-1">
              Topic: {result.metadata.topic} | Grade: {result.metadata.grade_level}
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
            <div>Topic: {result.metadata.topic}</div>
            <div>Grade Level: {result.metadata.grade_level}</div>
            <div>Type: {result.metadata.type}</div>
            <div>Created: {new Date(result.metadata.created_at).toLocaleString()}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
