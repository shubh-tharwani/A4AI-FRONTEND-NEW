import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  ClipboardDocumentListIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { QuizRequest } from '../../types';
import { getGradeLabel, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { validateFormData, AssessmentValidationSchema, showValidationErrors } from '../../utils/validation';

type AssessmentStep = 'setup' | 'taking' | 'results';

// Updated interfaces to match backend API response
interface ApiQuizQuestion {
  type: 'mcq' | 'open-ended';
  question: string;
  options?: string[];
  correct_answer?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  rubric?: Record<string, string>;
}

interface ApiQuizResponse {
  questions: ApiQuizQuestion[];
  assessment_id: string;
}

interface InternalQuizQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  difficulty: string;
  type: 'multiple_choice' | 'open_ended';
  rubric?: Record<string, string>;
  grade_level?: string;
  subject?: string;
  language?: string;
}

interface QuizState {
  questions: InternalQuizQuestion[];
  currentQuestion: number;
  answers: string[];
  timeRemaining: number;
  startTime: Date;
  assessmentId?: string;
}

// Convert API question format to internal format
const convertApiQuestionToInternal = (apiQuestion: ApiQuizQuestion, index: number): InternalQuizQuestion => {
  console.log(`Converting question ${index + 1}:`, apiQuestion);
  
  // Handle different possible field names
  const questionType = apiQuestion.type || (apiQuestion as any).question_type;
  const questionText = apiQuestion.question || (apiQuestion as any).question_text;
  const options = apiQuestion.options || (apiQuestion as any).choices || (apiQuestion as any).answers;
  const correctAnswer = apiQuestion.correct_answer || (apiQuestion as any).answer || (apiQuestion as any).correct_option;
  const difficulty = apiQuestion.difficulty || 'medium';
  const rubric = apiQuestion.rubric || (apiQuestion as any).scoring_rubric;
  
  if (questionType === 'mcq' || questionType === 'multiple_choice') {
    // Extract the correct answer from options using the letter
    const correctOptionLetter = correctAnswer || 'A';
    const correctOption = options?.find((opt: string) => 
      opt.trim().toLowerCase().startsWith(correctOptionLetter.toLowerCase() + '.')
    );
    
    return {
      id: `q_${index + 1}`,
      question: questionText,
      options: options || [],
      answer: correctOption || options?.[0] || '',
      difficulty: difficulty,
      type: 'multiple_choice'
    };
  } else {
    // Open-ended question
    return {
      id: `q_${index + 1}`,
      question: questionText,
      options: [],
      answer: '', // Will be evaluated against rubric
      difficulty: difficulty,
      type: 'open_ended',
      rubric: rubric
    };
  }
};

// Demo questions generator for fallback mode
const generateDemoQuestions = (request: QuizRequest): InternalQuizQuestion[] => {
  const { topic, grade, language } = request;
  
  const questionTemplates = [
    {
      question: `What is the main concept behind ${topic}?`,
      options: [
        `A. The fundamental principle of ${topic}`,
        "B. A completely unrelated concept",
        "C. Something that doesn't apply",
        "D. An incorrect definition"
      ],
      answer: `A. The fundamental principle of ${topic}`,
      difficulty: "medium",
      type: 'multiple_choice' as const
    },
    {
      question: `Which of the following best describes ${topic}?`,
      options: [
        "A. An incorrect description",
        `B. A comprehensive understanding of ${topic}`,
        "C. Something unrelated",
        "D. A wrong definition"
      ],
      answer: `B. A comprehensive understanding of ${topic}`,
      difficulty: "easy",
      type: 'multiple_choice' as const
    },
    {
      question: `Explain how you would apply ${topic} in a real-world scenario. Provide a detailed example with step-by-step reasoning.`,
      options: [],
      answer: '',
      difficulty: "hard",
      type: 'open_ended' as const,
      rubric: {
        "4": "Provides a clear, detailed real-world example with step-by-step reasoning and demonstrates deep understanding of the concept.",
        "3": "Provides a good example with adequate reasoning, showing solid understanding with minor gaps.",
        "2": "Provides a basic example with some reasoning, showing partial understanding of the concept.",
        "1": "Attempts to provide an example but shows limited understanding or unclear reasoning.",
        "0": "No attempt or completely irrelevant response."
      }
    }
  ];

  return questionTemplates.map((template, index) => ({
    id: `demo_${index + 1}`,
    question: template.question,
    options: template.options,
    answer: template.answer,
    difficulty: template.difficulty,
    type: template.type,
    rubric: template.rubric,
    grade_level: grade.toString(),
    subject: topic,
    language: language
  }));
};

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

  // Timer effect
  useEffect(() => {
    if (quizState && step === 'taking' && quizState.timeRemaining > 0) {
      const timer = setInterval(() => {
        setQuizState(prev => {
          if (!prev || prev.timeRemaining <= 1) {
            // Auto-submit when time runs out
            submitQuiz();
            return prev;
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1
          };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizState?.timeRemaining, step]);

  const createQuiz = async (data: QuizRequest) => {
    try {
      setLoading(true);
      console.log('📤 Making quiz request with data:', data);
      
      // Validate and sanitize input data
      const validation = validateFormData(data, AssessmentValidationSchema);
      
      if (!validation.isValid) {
        showValidationErrors(validation.errors);
        return;
      }

      // Use ApiService to get the response
      const rawResponse: any = await ApiService.Assessment.createQuiz(data);
      
      console.log('📥 Raw API response:', rawResponse);
      console.log('📥 Response structure check:', {
        hasQuestions: !!rawResponse?.questions,
        questionsType: typeof rawResponse?.questions,
        isArray: Array.isArray(rawResponse?.questions),
        questionsLength: rawResponse?.questions?.length,
        hasData: !!rawResponse?.data,
        dataQuestions: rawResponse?.data?.questions,
        fullStructure: Object.keys(rawResponse || {})
      });
      
      // Handle different possible response structures
      let response: ApiQuizResponse;
      
      if (rawResponse?.data?.questions) {
        // Backend wrapped response in { data: { questions: [...] } }
        response = {
          questions: rawResponse.data.questions,
          assessment_id: rawResponse.data.assessment_id || rawResponse.assessment_id || `quiz_${Date.now()}`
        };
      } else if (rawResponse?.questions) {
        // Direct response structure
        response = {
          questions: rawResponse.questions,
          assessment_id: rawResponse.assessment_id || `quiz_${Date.now()}`
        };
      } else {
        console.log('❌ Unexpected response structure:', rawResponse);
        throw new Error('Invalid response structure');
      }
      
      console.log('  Processed response:', response);
      console.log('📊 Assessment ID:', response.assessment_id);
      console.log('📊 Questions count:', response.questions?.length);
      
      // Enhanced response validation
      if (!response || !response.questions) {
        console.log('❌ No response or questions received from server');
        throw new Error('No questions received from server');
      }

      if (Array.isArray(response.questions) && response.questions.length > 0) {
        console.log('✅ Valid questions array found with', response.questions.length, 'questions');
        
        // Log first question to check structure
        console.log('📝 Sample question structure:', response.questions[0]);
        
        // Convert API questions to internal format
        const convertedQuestions = response.questions.map((apiQuestion, index) => {
          try {
            console.log(`🔄 Converting question ${index + 1}:`, apiQuestion);
            const converted = convertApiQuestionToInternal(apiQuestion, index);
            console.log(`✅ Converted question ${index + 1}:`, converted);
            return converted;
          } catch (error) {
            console.warn(`❌ Failed to convert question ${index}:`, error, apiQuestion);
            return null;
          }
        }).filter(Boolean) as InternalQuizQuestion[];

        console.log('📊 Final converted questions:', convertedQuestions);

        if (convertedQuestions.length === 0) {
          console.log('❌ No valid questions after conversion');
          throw new Error('No valid questions could be processed');
        }

        setQuizState({
          questions: convertedQuestions,
          currentQuestion: 0,
          answers: new Array(convertedQuestions.length).fill(''),
          timeRemaining: convertedQuestions.length * 120, // 2 minutes per question
          startTime: new Date(),
          assessmentId: response.assessment_id,
        });
        setStep('taking');
        toast.success(`✅ Quiz created with ${convertedQuestions.length} questions!`);
      } else {
        console.log('❌ Invalid response structure detected');
        console.log('Questions data:', response.questions);
        throw new Error('Invalid response structure');
      }
    } catch (error: any) {
      console.error('Quiz creation error:', error);
      console.log('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      console.log('🔄 API error, falling back to demo mode...');
      
      // Fallback to demo questions when API fails
      try {
        const demoQuestions = generateDemoQuestions(data);
        setQuizState({
          questions: demoQuestions,
          currentQuestion: 0,
          answers: new Array(demoQuestions.length).fill(''),
          timeRemaining: demoQuestions.length * 120,
          startTime: new Date(),
        });
        setStep('taking');
        toast.success(`📚 Demo Quiz created! Backend unavailable, using sample questions.`, {
          icon: '🎭',
          duration: 4000,
        });
      } catch (demoError) {
        console.error('Demo question generation failed:', demoError);
        toast.error('Failed to create quiz. Please try again.');
      }
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
    if (!quizState || !quizState.questions || quizState.questions.length === 0) {
      toast.error('Quiz data is invalid. Please try again.');
      return;
    }

    let correctAnswers = 0;
    const detailedResults = quizState.questions.map((question, index) => {
      if (!question || !question.question) {
        console.warn(`Invalid question at index ${index}:`, question);
        return {
          question: 'Invalid question',
          userAnswer: 'Not answered',
          correctAnswer: 'N/A',
          isCorrect: false,
          explanation: 'Question data was invalid',
          type: 'multiple_choice',
        };
      }

      const userAnswer = quizState.answers[index] || '';
      const correctAnswer = question.answer || '';
      
      // For MCQ, check exact match; for open-ended, mark as "requires review"
      let isCorrect = false;
      let explanation = 'No explanation available';
      
      if (question.type === 'multiple_choice') {
        isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        explanation = isCorrect ? 
          'Correct! Well done.' : 
          `The correct answer was: ${correctAnswer}`;
      } else {
        // Open-ended questions require manual grading
        isCorrect = false; // Will be manually graded
        explanation = question.rubric ? 
          'This answer will be reviewed based on the rubric provided.' :
          'This open-ended answer requires manual review.';
      }
      
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        userAnswer: userAnswer || 'Not answered',
        correctAnswer: correctAnswer,
        isCorrect,
        explanation,
        type: question.type,
        rubric: question.rubric,
        requiresReview: question.type === 'open_ended',
      };
    });

    if (!quizState || !quizState.startTime) {
      toast.error('Quiz timing data is invalid.');
      setResults({
        score: 0,
        correctAnswers: 0,
        totalQuestions: quizState?.questions?.length || 0,
        timeTaken: 0,
        detailedResults,
        assessmentId: quizState?.assessmentId,
      });
      setStep('results');
      return;
    }

    // Calculate score based on MCQ questions only
    const mcqQuestions = quizState.questions.filter(q => q.type === 'multiple_choice');
    const mcqCorrect = detailedResults.filter(r => r.type === 'multiple_choice' && r.isCorrect).length;
    const score = mcqQuestions.length > 0 ? Math.round((mcqCorrect / mcqQuestions.length) * 100) : 0;
    
    const endTime = new Date();
    const timeTaken = Math.round((endTime.getTime() - quizState.startTime.getTime()) / 1000 / 60);

    setResults({
      score,
      correctAnswers: mcqCorrect,
      totalQuestions: quizState.questions.length,
      mcqQuestions: mcqQuestions.length,
      openEndedQuestions: quizState.questions.filter(q => q.type === 'open_ended').length,
      timeTaken: Math.max(1, timeTaken),
      detailedResults,
      assessmentId: quizState.assessmentId,
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
          <p className="text-gray-600">Generate an AI-powered quiz with multiple choice and open-ended questions</p>
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
    if (!quizState || !quizState.questions || quizState.questions.length === 0) return null;

    const currentQ = quizState.questions[quizState.currentQuestion];
    if (!currentQ) return null;

    const progress = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100;
    const isOpenEnded = currentQ.type === 'open_ended';

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
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                isOpenEnded ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              )}>
                {isOpenEnded ? "Open-ended" : "Multiple Choice"}
              </span>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                currentQ.difficulty === 'easy' ? "bg-green-100 text-green-700" :
                currentQ.difficulty === 'hard' ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              )}>
                {currentQ.difficulty}
              </span>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {Math.floor(quizState.timeRemaining / 60)}:{(quizState.timeRemaining % 60).toString().padStart(2, '0')}
              </div>
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
          <div className="flex items-start space-x-3 mb-6">
            {isOpenEnded ? (
              <DocumentTextIcon className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
            ) : (
              <QuestionMarkCircleIcon className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
            )}
            <h3 className="text-xl font-semibold text-gray-900">
              {currentQ.question}
            </h3>
          </div>

          {/* Multiple Choice Options */}
          {!isOpenEnded && currentQ.options && currentQ.options.length > 0 ? (
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
          ) : (
            /* Open-ended Text Answer */
            <div className="mb-8">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <div className="relative">
                  <textarea
                    value={quizState.answers[quizState.currentQuestion] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your answer here. Show your work step by step for better scoring..."
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    maxLength={1500}
                  />
                  {!(quizState.answers[quizState.currentQuestion] || '').trim() && (
                    <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                      Answer required
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rubric information for open-ended questions */}
              {currentQ.rubric && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 Scoring Guide:</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    {Object.entries(currentQ.rubric).map(([score, description]) => (
                      <p key={score}>
                        <strong>{score} points:</strong> {description}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-500">
                  💡 Tip: For math problems, show your work step by step
                </div>
                <div className="text-gray-500">
                  {(quizState.answers[quizState.currentQuestion] || '').length}/1500 characters
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={previousQuestion}
              disabled={quizState.currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Question {quizState.currentQuestion + 1} of {quizState.questions.length}
              </span>
              
              {quizState.currentQuestion === quizState.questions.length - 1 ? (
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-sm text-green-600 font-medium">
                    🎉 Final Question - Ready to Submit!
                  </div>
                  <button
                    onClick={nextQuestion}
                    disabled={!quizState.answers[quizState.currentQuestion] || 
                             (quizState.answers[quizState.currentQuestion] || '').trim() === ''}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    🎯 Submit Quiz & Get Results
                  </button>
                </div>
              ) : (
                <button
                  onClick={nextQuestion}
                  disabled={!quizState.answers[quizState.currentQuestion] || 
                           (quizState.answers[quizState.currentQuestion] || '').trim() === ''}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderResults = () => {
    if (!results || !results.detailedResults) return null;

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
              {results.mcqQuestions > 0 && (
                <>You scored {results.correctAnswers} out of {results.mcqQuestions} multiple choice questions correctly</>
              )}
              {results.openEndedQuestions > 0 && (
                <>{results.mcqQuestions > 0 ? ', and answered ' : 'You answered '}{results.openEndedQuestions} open-ended question{results.openEndedQuestions > 1 ? 's' : ''} (requires manual review)</>
              )}
            </p>
            {results.assessmentId && (
              <p className="text-sm text-gray-500 mt-2">Assessment ID: {results.assessmentId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{results.score}%</div>
              <div className="text-sm text-gray-600">MCQ Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{results.correctAnswers}/{results.mcqQuestions || 0}</div>
              <div className="text-sm text-gray-600">MCQ Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{results.openEndedQuestions || 0}</div>
              <div className="text-sm text-gray-600">Open-ended</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">{results.timeTaken}min</div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>

          {results.openEndedQuestions > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                📝 <strong>Note:</strong> Open-ended questions require manual review and are not included in the automatic score calculation.
              </p>
            </div>
          )}

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
            {results.detailedResults && results.detailedResults.map((result: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-3 mb-4">
                  {result.type === 'open_ended' ? (
                    <DocumentTextIcon className="w-6 h-6 text-purple-500 mt-0.5" />
                  ) : result.isCorrect ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        result.type === 'open_ended' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {result.type === 'open_ended' ? 'Open-ended' : 'Multiple Choice'}
                      </span>
                      {result.requiresReview && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Requires Review
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{result.question}</p>
                  </div>
                </div>
                
                <div className="ml-9 space-y-2">
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">Your answer:</span>
                    <span className={cn(
                      "text-sm",
                      result.type === 'open_ended' ? "text-gray-700" :
                      result.isCorrect ? "text-green-600" : "text-red-600"
                    )}>
                      {result.userAnswer}
                    </span>
                  </div>
                  {result.type === 'multiple_choice' && !result.isCorrect && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-24">Correct:</span>
                      <span className="text-sm text-green-600">{result.correctAnswer}</span>
                    </div>
                  )}
                  {result.explanation && (
                    <div className={cn(
                      "p-3 rounded-lg mt-3",
                      result.type === 'open_ended' ? "bg-purple-50" : "bg-blue-50"
                    )}>
                      <p className={cn(
                        "text-sm",
                        result.type === 'open_ended' ? "text-purple-800" : "text-blue-800"
                      )}>
                        {result.explanation}
                      </p>
                    </div>
                  )}
                  {result.rubric && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Scoring Rubric:</h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        {Object.entries(result.rubric).map(([score, description]) => (
                          <p key={score}>
                            <strong>{score} points:</strong> {String(description)}
                          </p>
                        ))}
                      </div>
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
              {step === 'setup' && 'Create AI-powered quizzes with multiple choice and open-ended questions'}
              {step === 'taking' && 'Take your time and provide thoughtful answers for each question'}
              {step === 'results' && 'Review your performance and learn from detailed feedback'}
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
