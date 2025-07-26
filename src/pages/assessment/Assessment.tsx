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
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
// PDF generation using native browser print functionality with Unicode support
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
  
  if (questionType === 'mcq' || (questionType as string) === 'multiple_choice') {
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
      rubric: rubric ? Object.fromEntries(
        Object.entries(rubric).map(([key, value]) => [
          key, 
          typeof value === 'string' ? value : String(value)
        ])
      ) : undefined
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

  // Language-specific placeholders and text for 4 Indian regional languages + English
  const getLanguageContent = (language: string) => {
    const content: Record<string, any> = {
      'English': {
        placeholder: 'e.g., Algebra, World War II, Photosynthesis',
        workTip: '💡 Tip: For math problems, show your work step by step',
        answerLabel: 'Your Answer:',
        answerPlaceholder: 'Type your answer here. Show your work step by step for better scoring...',
        scoringGuide: '📝 Scoring Guide:',
        timeRemaining: 'Time Remaining:',
        submitQuiz: '🎯 Submit Quiz & Get Results',
        nextButton: 'Next →',
        previousButton: 'Previous'
      },
      'Hindi': {
        placeholder: 'जैसे: बीजगणित, द्वितीय विश्व युद्ध, प्रकाश संश्लेषण',
        workTip: '💡 सुझाव: गणित की समस्याओं के लिए, अपना काम चरण दर चरण दिखाएं',
        answerLabel: 'आपका उत्तर:',
        answerPlaceholder: 'यहाँ अपना उत्तर टाइप करें। बेहतर स्कोरिंग के लिए अपना काम चरण दर चरण दिखाएं...',
        scoringGuide: '📝 स्कोरिंग गाइड:',
        timeRemaining: 'समय शेष:',
        submitQuiz: '🎯 क्विज़ जमा करें और परिणाम प्राप्त करें',
        nextButton: 'अगला →',
        previousButton: 'पिछला'
      },
      'Tamil': {
        placeholder: 'எ.கா: இயற்கணிதம், இரண்டாம் உலகப்போர், ஒளிச்சேர்க்கை',
        workTip: '💡 குறிப்பு: கணிதப் பிரச்சினைகளுக்கு, உங்கள் வேலையை படி படியாகக் காட்டுங்கள்',
        answerLabel: 'உங்கள் பதில்:',
        answerPlaceholder: 'உங்கள் பதிலை இங்கே தட்டச்சு செய்யுங்கள். சிறந்த மதிப்பெண்ணுக்காக உங்கள் வேலையை படி படியாகக் காட்டுங்கள்...',
        scoringGuide: '📝 மதிப்பீட்டு வழிகாட்டி:',
        timeRemaining: 'மீதமுள்ள நேரம்:',
        submitQuiz: '🎯 வினாடி வினாவை சமர்பிக்கவும் மற்றும் முடிவுகளைப் பெறவும்',
        nextButton: 'அடுத்து →',
        previousButton: 'முன்பு'
      },
      'Kannada': {
        placeholder: 'ಉದಾ: ಬೀಜಗಣಿತ, ಎರಡನೆಯ ವಿಶ್ವಯುದ್ಧ, ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ',
        workTip: '💡 ಸಲಹೆ: ಗಣಿತ ಸಮಸ್ಯೆಗಳಿಗೆ, ನಿಮ್ಮ ಕೆಲಸವನ್ನು ಹಂತ ಹಂತವಾಗಿ ತೋರಿಸಿ',
        answerLabel: 'ನಿಮ್ಮ ಉತ್ತರ:',
        answerPlaceholder: 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ. ಉತ್ತಮ ಸ್ಕೋರಿಂಗ್‌ಗಾಗಿ ನಿಮ್ಮ ಕೆಲಸವನ್ನು ಹಂತ ಹಂತವಾಗಿ ತೋರಿಸಿ...',
        scoringGuide: '📝 ಅಂಕ ನಿರ್ಧಾರ ಮಾರ್ಗದರ್ಶಿ:',
        timeRemaining: 'ಉಳಿದ ಸಮಯ:',
        submitQuiz: '🎯 ಕ್ವಿಜ್ ಸಲ್ಲಿಸಿ ಮತ್ತು ಫಲಿತಾಂಶಗಳನ್ನು ಪಡೆಯಿರಿ',
        nextButton: 'ಮುಂದೆ →',
        previousButton: 'ಹಿಂದೆ'
      },
      'Bengali': {
        placeholder: 'যেমন: বীজগণিত, দ্বিতীয় বিশ্বযুদ্ধ, সালোকসংশ্লেষণ',
        workTip: '💡 পরামর্শ: গণিতের সমস্যার জন্য, আপনার কাজ ধাপে ধাপে দেখান',
        answerLabel: 'আপনার উত্তর:',
        answerPlaceholder: 'এখানে আপনার উত্তর টাইপ করুন। ভাল স্কোরিংয়ের জন্য আপনার কাজ ধাপে ধাপে দেখান...',
        scoringGuide: '📝 স্কোরিং গাইড:',
        timeRemaining: 'অবশিষ্ট সময়:',
        submitQuiz: '🎯 কুইজ জমা দিন এবং ফলাফল পান',
        nextButton: 'পরবর্তী →',
        previousButton: 'পূর্ববর্তী'
      }
    };
    
    return content[language] || content['English']; // Default to English
  };

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
        rubric: question.rubric ? Object.fromEntries(
          Object.entries(question.rubric).map(([key, value]) => [
            key, 
            typeof value === 'string' ? value : String(value)
          ])
        ) : undefined,
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

  // PDF Generation Function with Proper Unicode Support
  const generateQuestionPaperPDF = () => {
    if (!quizState || !quizState.questions || quizState.questions.length === 0) {
      toast.error('No quiz questions available to download.');
      return;
    }

    try {
      // Create HTML content with proper Unicode fonts
      const createHtmlContent = () => {
        const mcqCount = quizState.questions.filter(q => q.type === 'multiple_choice').length;
        const openEndedCount = quizState.questions.filter(q => q.type === 'open_ended').length;
        
        const questionsHtml = quizState.questions.map((question, index) => {
          const questionType = question.type === 'multiple_choice' ? '[MCQ]' : '[खुला प्रश्न]';
          
          if (question.type === 'multiple_choice' && question.options && question.options.length > 0) {
            const optionsHtml = question.options.map((option, optionIndex) => {
              const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D
              let cleanOption = String(option || '').trim();
              cleanOption = cleanOption.replace(/^[A-D]\.?\s*/, '').replace(/^[1-4]\.?\s*/, '');
              
              return `
                <div style="margin: 8px 0; padding-left: 20px;">
                  <span style="display: inline-block; width: 30px;">( )</span>
                  <strong>${optionLabel}.</strong> ${cleanOption}
                </div>
              `;
            }).join('');
            
            return `
              <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <strong>प्रश्न ${index + 1}:</strong>
                  <span style="font-size: 12px; color: #666;">${questionType}</span>
                </div>
                <div style="margin: 10px 0; font-size: 14px; line-height: 1.6;">
                  ${question.question}
                </div>
                <div style="margin: 15px 0;">
                  ${optionsHtml}
                </div>
              </div>
            `;
          } else {
            return `
              <div style="margin: 25px 0; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <strong>प्रश्न ${index + 1}:</strong>
                  <span style="font-size: 12px; color: #666;">${questionType}</span>
                </div>
                <div style="margin: 10px 0; font-size: 14px; line-height: 1.6;">
                  ${question.question}
                </div>
                <div style="margin: 15px 0;">
                  <strong>उत्तर:</strong>
                  <div style="margin-top: 10px;">
                    ${Array(8).fill(0).map(() => '<div style="border-bottom: 1px solid #ccc; height: 25px; margin: 8px 0;"></div>').join('')}
                  </div>
                </div>
              </div>
            `;
          }
        }).join('');

        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Kannada:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&display=swap');
              
              body {
                font-family: 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Kannada', 'Noto Sans Bengali', Arial, sans-serif;
                margin: 40px;
                line-height: 1.6;
                color: #333;
                background: white;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              
              .subtitle {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
              }
              
              .student-info {
                margin: 25px 0;
                padding: 20px;
                border: 1px solid #ddd;
                background: #f9f9f9;
              }
              
              .student-info h3 {
                margin-top: 0;
                margin-bottom: 15px;
                font-weight: bold;
              }
              
              .field {
                margin: 12px 0;
                display: flex;
                align-items: center;
              }
              
              .field-label {
                font-weight: bold;
                margin-right: 10px;
                min-width: 120px;
              }
              
              .field-line {
                border-bottom: 1px solid #333;
                flex: 1;
                height: 20px;
              }
              
              .assessment-details {
                margin: 25px 0;
                padding: 15px;
                background: #f0f0f0;
                border-left: 4px solid #007bff;
              }
              
              .assessment-details h3 {
                margin-top: 0;
                margin-bottom: 15px;
              }
              
              .instructions {
                margin: 25px 0;
                padding: 20px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
              }
              
              .instructions h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #856404;
              }
              
              .instructions ol {
                margin: 0;
                padding-left: 20px;
              }
              
              .instructions li {
                margin: 8px 0;
                color: #856404;
              }
              
              .questions-section {
                margin-top: 30px;
                border-top: 2px solid #333;
                padding-top: 20px;
              }
              
              .questions-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 25px;
                text-align: center;
              }
              
              @media print {
                body { margin: 20px; }
                .header { page-break-after: avoid; }
                .student-info { page-break-after: avoid; }
                .assessment-details { page-break-after: avoid; }
                .instructions { page-break-after: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">परीक्षा प्रश्न पत्र / ASSESSMENT QUESTION PAPER</div>
              <div class="subtitle">A4AI शैक्षिक मंच / A4AI Educational Platform</div>
            </div>

            <div class="student-info">
              <h3>छात्र जानकारी / STUDENT INFORMATION</h3>
              <div class="field">
                <span class="field-label">छात्र का नाम / Student Name:</span>
                <div class="field-line"></div>
              </div>
              <div class="field">
                <span class="field-label">रोल नंबर / Roll Number:</span>
                <div class="field-line"></div>
              </div>
              <div style="display: flex; gap: 50px; margin-top: 15px;">
                <div class="field" style="flex: 1;">
                  <span class="field-label">दिनांक / Date:</span>
                  <div class="field-line"></div>
                </div>
                <div class="field" style="flex: 1;">
                  <span class="field-label">समय / Time:</span>
                  <div class="field-line"></div>
                </div>
              </div>
            </div>

            <div class="assessment-details">
              <h3>परीक्षा विवरण / ASSESSMENT DETAILS</h3>
              <div><strong>कुल प्रश्न / Total Questions:</strong> ${quizState.questions.length}</div>
              <div><strong>समय सीमा / Time Allowed:</strong> ${Math.floor(quizState.questions.length * 2)} मिनट / minutes</div>
              ${mcqCount > 0 ? `<div><strong>बहुविकल्पीय प्रश्न / Multiple Choice Questions:</strong> ${mcqCount}</div>` : ''}
              ${openEndedCount > 0 ? `<div><strong>खुले प्रश्न / Open-ended Questions:</strong> ${openEndedCount}</div>` : ''}
            </div>

            <div class="instructions">
              <h3>निर्देश / INSTRUCTIONS</h3>
              <ol>
                <li>सभी प्रश्नों को ध्यान से पढ़ें / Read all questions carefully before answering.</li>
                <li>बहुविकल्पीय प्रश्नों के लिए सबसे अच्छा उत्तर चुनें / For multiple choice questions, select the best answer.</li>
                <li>खुले प्रश्नों के लिए विस्तृत उत्तर दें / For open-ended questions, provide detailed explanations.</li>
                <li>गणित की समस्याओं के लिए अपना काम दिखाएं / Show your work for mathematical problems.</li>
                <li>स्पष्ट और साफ लिखें / Write clearly and legibly.</li>
                <li>अपने समय का प्रभावी उपयोग करें / Manage your time effectively.</li>
              </ol>
            </div>

            <div class="questions-section">
              <div class="questions-title">प्रश्न / QUESTIONS</div>
              ${questionsHtml}
            </div>

            <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
              <div>A4AI Assessment Platform | ${new Date().toLocaleDateString('hi-IN')} | ${new Date().toLocaleDateString('en-US')}</div>
            </div>
          </body>
          </html>
        `;
      };

      // Create a temporary window to render HTML and convert to PDF
      const htmlContent = createHtmlContent();
      
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups and try again.');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for fonts to load, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
        
        toast.success('📄 Question paper opened for printing/saving! Use your browser\'s print dialog to save as PDF.', {
          duration: 5000,
        });
      }, 2000); // Wait 2 seconds for fonts to load

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const renderSetupForm = () => {
    // Get the current form values using watch from react-hook-form
    const formValues = { language: 'English' }; // Default to English for now
    const selectedLanguage = formValues.language;
    const langContent = getLanguageContent(selectedLanguage);

    return (
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
              placeholder={langContent.placeholder}
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
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
              <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
              <option value="Bengali">বাংলা (Bengali)</option>
            </select>
          </div>

          <div className="space-y-4">
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
            
            {quizState && quizState.questions && quizState.questions.length > 0 && (
              <button
                type="button"
                onClick={generateQuestionPaperPDF}
                className="w-full flex items-center justify-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
              >
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                Download Question Paper PDF
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
    );
  };

  const renderQuizTaking = () => {
    if (!quizState || !quizState.questions || quizState.questions.length === 0) return null;

    const currentQ = quizState.questions[quizState.currentQuestion];
    if (!currentQ) return null;

    const progress = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100;
    const isOpenEnded = currentQ.type === 'open_ended';
    
    // Get language-specific content based on the quiz language
    const quizLanguage = currentQ.language || 'English';
    const langContent = getLanguageContent(quizLanguage);

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
              <button
                onClick={generateQuestionPaperPDF}
                className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                title="Download Question Paper PDF"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
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
              {String(currentQ.question || '')}
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
                  {langContent.answerLabel}
                </label>
                <div className="relative">
                  <textarea
                    value={quizState.answers[quizState.currentQuestion] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder={langContent.answerPlaceholder}
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
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">{langContent.scoringGuide}</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    {Object.entries(currentQ.rubric).map(([score, description]) => (
                      <p key={score}>
                        <strong>{score} points:</strong> {String(description)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-500">
                  {langContent.workTip}
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
              {langContent.previousButton}
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
                    {langContent.submitQuiz}
                  </button>
                </div>
              ) : (
                <button
                  onClick={nextQuestion}
                  disabled={!quizState.answers[quizState.currentQuestion] || 
                           (quizState.answers[quizState.currentQuestion] || '').trim() === ''}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {langContent.nextButton}
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

          <div className="flex justify-center space-x-4">
            <button
              onClick={resetQuiz}
              className="btn-primary"
            >
              Take Another Quiz
            </button>
            <button
              onClick={generateQuestionPaperPDF}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Download Question Paper</span>
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
                    <p className="text-gray-700 mb-3">{String(result.question || '')}</p>
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
                      {String(result.userAnswer || '')}
                    </span>
                  </div>
                  {result.type === 'multiple_choice' && !result.isCorrect && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-24">Correct:</span>
                      <span className="text-sm text-green-600">{String(result.correctAnswer || '')}</span>
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
                        {String(result.explanation || '')}
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
