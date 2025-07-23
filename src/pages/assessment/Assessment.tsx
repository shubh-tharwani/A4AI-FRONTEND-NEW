import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  ClipboardDocumentListIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { QuizRequest, QuizQuestion } from '../../types';
import { getGradeLabel, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';

type AssessmentStep = 'setup' | 'taking' | 'results';

interface QuizState {
  questions: QuizQuestion[];
  currentQuestion: number;
  answers: string[];
  timeRemaining: number;
  startTime: Date;
}

export default function Assessment() {
  const [step, setStep] = useState<AssessmentStep>('setup');
  const [loading, setLoading] = useState(false);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [results, setResults] = useState<any>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<QuizRequest>({
    defaultValues: {
      grade: 9,
      topic: '',
      language: 'English',
    }
  });

  const createQuiz = async (data: QuizRequest) => {
    try {
      setLoading(true);
      console.log('📤 Making quiz request with data:', data);
      const response = await ApiService.Assessment.createQuiz(data);
      
      console.log('📥 Quiz API response:', response);
      
      // Handle actual backend response structure: { questions: [...], assessment_id: "..." }
      if (response.questions && Array.isArray(response.questions)) {
        setQuizState({
          questions: response.questions,
          currentQuestion: 0,
          answers: new Array(response.questions.length).fill(''),
          timeRemaining: response.questions.length * 60, // 1 minute per question
          startTime: new Date(),
        });
        setStep('taking');
        toast.success('Quiz created successfully!');
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Invalid quiz data received from server.');
      }
    } catch (error: any) {
      toast.error('Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (!quizState) return;

    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestion] = answer;

    setQuizState({
      ...quizState,
      answers: newAnswers,
    });
  };

  const nextQuestion = () => {
    if (!quizState) return;

    if (quizState.currentQuestion < quizState.questions.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestion: quizState.currentQuestion + 1,
      });
    } else {
      submitQuiz();
    }
  };

  const previousQuestion = () => {
    if (!quizState) return;

    if (quizState.currentQuestion > 0) {
      setQuizState({
        ...quizState,
        currentQuestion: quizState.currentQuestion - 1,
      });
    }
  };

  const submitQuiz = () => {
    if (!quizState) return;

    let correctAnswers = 0;
    const detailedResults = quizState.questions.map((question, index) => {
      const isCorrect = quizState.answers[index] === question.answer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        userAnswer: quizState.answers[index] || 'Not answered',
        correctAnswer: question.answer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctAnswers / quizState.questions.length) * 100);
    const endTime = new Date();
    const timeTaken = Math.round((endTime.getTime() - quizState.startTime.getTime()) / 1000 / 60);

    setResults({
      score,
      correctAnswers,
      totalQuestions: quizState.questions.length,
      timeTaken,
      detailedResults,
    });
    setStep('results');
  };

  const resetQuiz = () => {
    setStep('setup');
    setQuizState(null);
    setResults(null);
  };

  const renderSetupForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Assessment</h2>
          <p className="text-gray-600">Generate an AI-powered quiz tailored to your needs</p>
        </div>

        <form onSubmit={handleSubmit(createQuiz)} className="space-y-6">
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
              Topic
            </label>
            <input
              {...register('topic', { 
                required: 'Topic is required',
                minLength: { value: 2, message: 'Topic must be at least 2 characters' }
              })}
              type="text"
              placeholder="e.g., Algebra, World War II, Photosynthesis"
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
                Generating Quiz...
              </>
            ) : (
              <>
                <PlayIcon className="w-6 h-6 mr-3" />
                Generate Quiz
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderQuizTaking = () => {
    if (!quizState) return null;

    const currentQ = quizState.questions[quizState.currentQuestion];
    const progress = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {quizState.currentQuestion + 1} of {quizState.questions.length}
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              {Math.floor(quizState.timeRemaining / 60)}:{(quizState.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQ.question}
          </h3>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={cn(
                  "w-full p-4 text-left border rounded-lg transition-all duration-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  quizState.answers[quizState.currentQuestion] === option
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3",
                    quizState.answers[quizState.currentQuestion] === option
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}>
                    {quizState.answers[quizState.currentQuestion] === option && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={previousQuestion}
              disabled={quizState.currentQuestion === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={nextQuestion}
              disabled={!quizState.answers[quizState.currentQuestion]}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quizState.currentQuestion === quizState.questions.length - 1 ? 'Submit Quiz' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Score Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4",
              results.score >= 80 ? "bg-green-100" : results.score >= 60 ? "bg-yellow-100" : "bg-red-100"
            )}>
              <span className={cn(
                "text-3xl font-bold",
                results.score >= 80 ? "text-green-600" : results.score >= 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {results.score}%
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">
              You scored {results.correctAnswers} out of {results.totalQuestions} questions correctly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{results.score}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{results.correctAnswers}/{results.totalQuestions}</div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{results.timeTaken}min</div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={resetQuiz}
              className="btn-primary"
            >
              Take Another Quiz
            </button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Results</h3>
          <div className="space-y-6">
            {results.detailedResults.map((result: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-3 mb-4">
                  {result.isCorrect ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Question {index + 1}
                    </h4>
                    <p className="text-gray-700 mb-3">{result.question}</p>
                  </div>
                </div>
                
                <div className="ml-9 space-y-2">
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">Your answer:</span>
                    <span className={cn(
                      "text-sm",
                      result.isCorrect ? "text-green-600" : "text-red-600"
                    )}>
                      {result.userAnswer}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-24">Correct:</span>
                      <span className="text-sm text-green-600">{result.correctAnswer}</span>
                    </div>
                  )}
                  {result.explanation && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-3">
                      <p className="text-sm text-blue-800">{result.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Center</h1>
            <p className="text-gray-600">
              {step === 'setup' && 'Create AI-powered quizzes tailored to your learning level'}
              {step === 'taking' && 'Take your time and think carefully about each question'}
              {step === 'results' && 'Review your performance and learn from the results'}
            </p>
          </motion.div>
        </div>

        {/* Content */}
        {step === 'setup' && renderSetupForm()}
        {step === 'taking' && renderQuizTaking()}
        {step === 'results' && renderResults()}
      </div>
    </Navigation>
  );
}
