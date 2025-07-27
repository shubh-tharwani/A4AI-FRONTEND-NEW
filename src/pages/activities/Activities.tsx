/**
 * Activities Component - Interactive Educational Stories with Audio Narration
 * 
 * Features:
 * - Multi-language support (English, Hindi, Tamil, Kannada, Bengali)
 * - Interactive story generation via backend API
 * - Audio narration playback with play/pause controls
 * - Story actions: like, bookmark, narrate
 * - Discussion questions parsing and numbering
 * - Fallback to demo stories when API fails
 * 
 * Audio Integration:
 * - Uses backend's audio_filename field from InteractiveStoryResponse
 * - Constructs audio URL: http://localhost:8000/api/v1/activities/audio/{filename}
 * - Play/pause controls with visual feedback
 * - Error handling for missing or failed audio
 * - Language-specific narration button labels
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  SparklesIcon,
  BookOpenIcon,
  HeartIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon, PlayCircleIcon as PlaySolidIcon, PauseCircleIcon as PauseSolidIcon } from '@heroicons/react/24/solid';
import Navigation from '../../components/layout/Navigation';
import { ActivityRequest, Story } from '../../types';
import { getGradeLabel, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ApiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { validateObject, ActivityValidationSchema, InteractiveStoryValidationSchema, showValidationErrors } from '../../utils/validation';

type ActivityType = 'story' | 'game';

interface ActivityState {
  currentStory: Story | null;
  likedStories: Set<string>;
  bookmarkedStories: Set<string>;
  isPlayingAudio: boolean;
  audioError: string | null;
}

// Language-specific content for multilingual support
const getLanguageContent = (language: string) => {
  const content: Record<string, any> = {
    'English': {
      placeholders: {
        topic: 'e.g., Space exploration, Friendship, Ancient civilizations'
      },
      labels: {
        gradeLevel: 'Grade Level',
        topicTheme: 'Topic or Theme',
        language: 'Language',
        generateStory: 'Generate Story',
        creatingStory: 'Creating Story...',
        createInteractiveStory: 'Create Interactive Story',
        generateEducationalStory: 'Generate an engaging educational story',
        whatYoullLearn: 'What You\'ll Learn',
        thinkAboutIt: 'Think About It',
        liked: 'Liked',
        like: 'Like',
        saved: 'Saved',
        save: 'Save',
        createNewStory: 'Create New Story',
        playNarration: 'Play Narration',
        stopNarration: 'Stop Narration',
        audioNotAvailable: 'Audio Not Available'
      },
      storyElements: {
        welcomePhrase: 'Welcome to an exciting learning adventure about',
        onceUponTime: 'Once upon a time, in a world not so different from ours, there lived a curious student just like you.',
        fascinated: 'This student was fascinated by',
        incredible: 'is an incredible subject that opens up a world of possibilities.',
        discover: 'When we study',
        tellMore: 'Let me tell you more about',
        inGrade: 'In Grade',
        explore: 'students typically explore',
        throughActivities: 'through hands-on activities and engaging lessons.',
        keyConcepts: 'The key concepts include understanding the fundamentals, practicing critical thinking, and applying what we learn to real-world situations.',
        throughStory: 'Through this story, you\'ll discover:',
        basicPrinciples: 'The basic principles of',
        affects: 'How',
        affectsDaily: 'affects our daily lives',
        funFacts: 'Fun facts that will amaze your friends',
        waysToExplore: 'Ways to explore',
        further: 'further',
        adventure: 'As our adventure continues, remember that learning about',
        notJust: 'is not just about memorizing facts.',
        developing: 'It\'s about developing curiosity, asking questions, and finding connections to other subjects you study.',
        bestPart: 'The best part about',
        alwaysMore: 'is that there\'s always more to discover.',
        everyQuestion: 'Every question you ask leads to new learning opportunities, and every concept you master opens doors to more advanced topics.',
        embark: 'So let\'s embark on this learning journey together and see what amazing discoveries await us in the world of',
        questions: 'What questions do you have about',
        exploreNext: 'What would you like to explore next?'
      }
    },
    'Hindi': {
      placeholders: {
        topic: 'जैसे: अंतरिक्ष अन्वेषण, मित्रता, प्राचीन सभ्यताएं'
      },
      labels: {
        gradeLevel: 'कक्षा स्तर',
        topicTheme: 'विषय या थीम',
        language: 'भाषा',
        generateStory: 'कहानी बनाएं',
        creatingStory: 'कहानी बनाई जा रही है...',
        createInteractiveStory: 'इंटरैक्टिव कहानी बनाएं',
        generateEducationalStory: 'एक दिलचस्प शैक्षिक कहानी बनाएं',
        whatYoullLearn: 'आप क्या सीखेंगे',
        thinkAboutIt: 'इसके बारे में सोचें',
        liked: 'पसंद किया',
        like: 'पसंद करें',
        saved: 'सहेजा गया',
        save: 'सहेजें',
        createNewStory: 'नई कहानी बनाएं',
        playNarration: 'कथन सुनें',
        stopNarration: 'कथन रोकें',
        audioNotAvailable: 'ऑडियो उपलब्ध नहीं'
      },
      storyElements: {
        welcomePhrase: 'के बारे में एक रोमांचक सीखने की यात्रा में आपका स्वागत है',
        onceUponTime: 'एक समय की बात है, हमारी दुनिया से बहुत अलग नहीं एक दुनिया में, आपकी तरह एक जिज्ञासु छात्र रहता था।',
        fascinated: 'यह छात्र',
        incredible: 'से मोहित था और इसके बारे में सब कुछ जानना चाहता था। यह एक अद्भुत विषय है जो संभावनाओं की दुनिया खोलता है।',
        discover: 'जब हम',
        tellMore: 'का अध्ययन करते हैं, तो हम अद्भुत तथ्यों और अवधारणाओं की खोज करते हैं। आइए',
        inGrade: 'के बारे में और बताते हैं। कक्षा',
        explore: 'में, छात्र आमतौर पर',
        throughActivities: 'की खोज व्यावहारिक गतिविधियों और दिलचस्प पाठों के माध्यम से करते हैं।',
        keyConcepts: 'मुख्य अवधारणाओं में बुनियादी बातों को समझना, आलोचनात्मक सोच का अभ्यास करना, और वास्तविक जीवन की स्थितियों में सीखी गई बातों को लागू करना शामिल है।',
        throughStory: 'इस कहानी के माध्यम से, आप खोजेंगे:',
        basicPrinciples: 'के मूल सिद्धांत',
        affects: '',
        affectsDaily: 'हमारे दैनिक जीवन को कैसे प्रभावित करता है',
        funFacts: 'मजेदार तथ्य जो आपके दोस्तों को आश्चर्यचकित कर देंगे',
        waysToExplore: 'की आगे खोज करने के तरीके',
        further: '',
        adventure: 'जैसे-जैसे हमारी यात्रा जारी रहती है, याद रखें कि',
        notJust: 'के बारे में सीखना केवल तथ्यों को याद करना नहीं है।',
        developing: 'यह जिज्ञासा विकसित करने, प्रश्न पूछने, और आपके द्वारा अध्ययन किए जाने वाले अन्य विषयों से संबंध खोजने के बारे में है।',
        bestPart: 'के बारे में सबसे अच्छी बात यह है कि',
        alwaysMore: 'हमेशा खोजने के लिए और भी बहुत कुछ है।',
        everyQuestion: 'आपका हर प्रश्न नए सीखने के अवसरों की ओर ले जाता है, और हर अवधारणा जिसमें आप महारत हासिल करते हैं, वह अधिक उन्नत विषयों के दरवाजे खोलती है।',
        embark: 'तो आइए इस सीखने की यात्रा पर एक साथ निकलें और देखें कि',
        questions: 'की दुनिया में हमारा क्या अद्भुत खोजें इंतजार कर रही हैं! आपके',
        exploreNext: 'के बारे में क्या प्रश्न हैं? आप आगे क्या खोजना चाहेंगे?'
      }
    },
    'Tamil': {
      placeholders: {
        topic: 'எ.கா: விண்வெளி ஆய்வு, நட்பு, பண்டைய நாகரிகங்கள்'
      },
      labels: {
        gradeLevel: 'வகுப்பு நிலை',
        topicTheme: 'தலைப்பு அல்லது கருப்பொருள்',
        language: 'மொழி',
        generateStory: 'கதை உருவாக்கு',
        creatingStory: 'கதை உருவாக்கப்படுகிறது...',
        createInteractiveStory: 'ஊடாடும் கதை உருவாக்கு',
        generateEducationalStory: 'ஒரு கவர்ச்சிகரமான கல்விக் கதையை உருவாக்கு',
        whatYoullLearn: 'நீங்கள் என்ன கற்றுக்கொள்வீர்கள்',
        thinkAboutIt: 'இதைப் பற்றி சிந்தியுங்கள்',
        liked: 'விரும்பியது',
        like: 'விரும்பு',
        saved: 'சேமிக்கப்பட்டது',
        save: 'சேமி',
        createNewStory: 'புதிய கதை உருவாக்கு',
        playNarration: 'கதை கேளுங்கள்',
        stopNarration: 'கதை நிறுத்து',
        audioNotAvailable: 'ஆடியோ கிடைக்கவில்லை'
      },
      storyElements: {
        welcomePhrase: 'பற்றிய ஒரு உற்சாகமான கற்றல் சாகசத்திற்கு உங்களை வரவேற்கிறோம்',
        onceUponTime: 'ஒரு காலத்தில், நம்முடையதிலிருந்து மிகவும் வேறுபட்ட உலகில், உங்களைப் போன்ற ஒரு ஆர்வமுள்ள மாணவர் வாழ்ந்தார்.',
        fascinated: 'இந்த மாணவர்',
        incredible: 'மீது மோகம் கொண்டிருந்தார் மற்றும் அதைப் பற்றி அனைத்தையும் அறிய விரும்பினார். இது சாத்தியக்கூறுகளின் உலகத்தைத் திறக்கும் ஒரு அற்புதமான பாடமாகும்.',
        discover: 'நாம்',
        tellMore: 'படிக்கும்போது, நாம் அற்புதமான உண்மைகளையும் கருத்துகளையும் கண்டுபிடிக்கிறோம். இன்னும்',
        inGrade: 'பற்றி சொல்கிறேன். வகுப்பு',
        explore: 'இல், மாணவர்கள் பொதுவாக',
        throughActivities: 'ஐ நடைமுறை நடவடிக்கைகள் மற்றும் கவர்ச்சிகரமான பாடங்களின் மூலம் ஆராய்கிறார்கள்.',
        keyConcepts: 'முக்கிய கருத்துகளில் அடிப்படைகளைப் புரிந்துகொள்வது, விமர்சன சிந்தனையை பயிற்சி செய்வது மற்றும் நாம் கற்றுக்கொள்வதை நிஜ வாழ்க்கை சூழ்நிலைகளுக்குப் பயன்படுத்துவது ஆகியவை அடங்கும்.',
        throughStory: 'இந்தக் கதையின் மூலம், நீங்கள் கண்டுபிடிப்பீர்கள்:',
        basicPrinciples: 'இன் அடிப்படைக் கொள்கைகள்',
        affects: '',
        affectsDaily: 'நமது அன்றாட வாழ்க்கையில் எவ்வாறு பாதிக்கிறது',
        funFacts: 'உங்கள் நண்பர்களை ஆச்சரியப்படுத்தும் வேடிக்கையான உண்மைகள்',
        waysToExplore: 'ஐ மேலும் ஆராய்வதற்கான வழிகள்',
        further: '',
        adventure: 'நமது சாகசம் தொடரும்போது, நினைவில் கொள்ளுங்கள்',
        notJust: 'பற்றி கற்றுக்கொள்வது வெறும் உண்மைகளை மனப்பாடம் செய்வது மட்டும் அல்ல.',
        developing: 'இது ஆர்வத்தை வளர்ப்பது, கேள்விகள் கேட்பது மற்றும் நீங்கள் படிக்கும் பிற பாடங்களுடன் தொடர்புகளைக் கண்டுபிடிப்பது.',
        bestPart: 'பற்றிய சிறந்த பகுதி என்னவென்றால்',
        alwaysMore: 'எப்போதும் கண்டுபிடிக்க இன்னும் அதிகம் உள்ளது.',
        everyQuestion: 'நீங்கள் கேட்கும் ஒவ்வொரு கேள்வியும் புதிய கற்றல் வாய்ப்புகளுக்கு வழிவகுக்கிறது, மேலும் நீங்கள் தேர்ச்சி பெறும் ஒவ்வொரு கருத்தும் மிகவும் மேம்பட்ட தலைப்புகளுக்கான கதவுகளைத் திறக்கிறது.',
        embark: 'எனவே இந்த கற்றல் பயணத்தில் ஒன்றாக பயணித்து',
        questions: 'உலகில் என்ன அற்புதமான கண்டுபிடிப்புகள் நமக்காக காத்திருக்கின்றன என்பதைப் பார்ப்போம்! உங்களுக்கு',
        exploreNext: 'பற்றி என்ன கேள்விகள் உள்ளன? நீங்கள் அடுத்து எதை ஆராய விரும்புகிறீர்கள்?'
      }
    },
    'Kannada': {
      placeholders: {
        topic: 'ಉದಾ: ಅಂತರಿಕ್ಷ ಅನ್ವೇಷಣೆ, ಸ್ನೇಹ, ಪ್ರಾಚೀನ ನಾಗರಿಕತೆಗಳು'
      },
      labels: {
        gradeLevel: 'ವರ್ಗ ಮಟ್ಟ',
        topicTheme: 'ವಿಷಯ ಅಥವಾ ಥೀಮ್',
        language: 'ಭಾಷೆ',
        generateStory: 'ಕಥೆ ರಚಿಸಿ',
        creatingStory: 'ಕಥೆ ರಚಿಸಲಾಗುತ್ತಿದೆ...',
        createInteractiveStory: 'ಸಂವಾದಾತ್ಮಕ ಕಥೆ ರಚಿಸಿ',
        generateEducationalStory: 'ಆಕರ್ಷಕ ಶೈಕ್ಷಣಿಕ ಕಥೆಯನ್ನು ರಚಿಸಿ',
        whatYoullLearn: 'ನೀವು ಏನು ಕಲಿಯುವಿರಿ',
        thinkAboutIt: 'ಇದರ ಬಗ್ಗೆ ಯೋಚಿಸಿ',
        liked: 'ಇಷ್ಟಪಟ್ಟಿದೆ',
        like: 'ಇಷ್ಟ',
        saved: 'ಉಳಿಸಲಾಗಿದೆ',
        save: 'ಉಳಿಸಿ',
        createNewStory: 'ಹೊಸ ಕಥೆ ರಚಿಸಿ',
        playNarration: 'ಕಥೆ ಕೇಳಿ',
        stopNarration: 'ಕಥೆ ನಿಲ್ಲಿಸಿ',
        audioNotAvailable: 'ಆಡಿಯೋ ಲಭ್ಯವಿಲ್ಲ'
      },
      storyElements: {
        welcomePhrase: 'ಬಗ್ಗೆ ಒಂದು ರೋಮಾಂಚಕ ಕಲಿಕೆಯ ಸಾಹಸಕ್ಕೆ ಸ್ವಾಗತ',
        onceUponTime: 'ಒಂದು ಕಾಲದಲ್ಲಿ, ನಮ್ಮದೇ ಅಲ್ಲದ ಒಂದು ಪ್ರಪಂಚದಲ್ಲಿ, ನಿಮ್ಮಂತೆಯೇ ಕುತೂಹಲಿ ವಿದ್ಯಾರ್ಥಿಯೊಬ್ಬ ವಾಸಿಸುತ್ತಿದ್ದ.',
        fascinated: 'ಈ ವಿದ್ಯಾರ್ಥಿ',
        incredible: 'ಬಗ್ಗೆ ಮೋಹಿತನಾಗಿದ್ದ ಮತ್ತು ಅದರ ಬಗ್ಗೆ ಎಲ್ಲವನ್ನೂ ಕಲಿಯಲು ಬಯಸುತ್ತಿದ್ದ. ಇದು ಸಾಧ್ಯತೆಗಳ ಪ್ರಪಂಚವನ್ನು ತೆರೆಯುವ ಒಂದು ಅದ್ಭುತ ವಿಷಯವಾಗಿದೆ.',
        discover: 'ನಾವು',
        tellMore: 'ಅಧ್ಯಯನ ಮಾಡುವಾಗ, ನಾವು ಅದ್ಭುತ ಸತ್ಯಗಳು ಮತ್ತು ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಕಂಡುಹಿಡಿಯುತ್ತೇವೆ. ಇನ್ನೂ',
        inGrade: 'ಬಗ್ಗೆ ಹೇಳೋಣ. ವರ್ಗ',
        explore: 'ನಲ್ಲಿ, ವಿದ್ಯಾರ್ಥಿಗಳು ಸಾಮಾನ್ಯವಾಗಿ',
        throughActivities: 'ಅನ್ನು ಪ್ರಾಯೋಗಿಕ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ಆಕರ್ಷಕ ಪಾಠಗಳ ಮೂಲಕ ಅನ್ವೇಷಿಸುತ್ತಾರೆ.',
        keyConcepts: 'ಮುಖ್ಯ ಪರಿಕಲ್ಪನೆಗಳಲ್ಲಿ ಮೂಲಭೂತ ವಿಷಯಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು, ವಿಮರ್ಶಾತ್ಮಕ ಚಿಂತನೆಯನ್ನು ಅಭ್ಯಾಸ ಮಾಡುವುದು ಮತ್ತು ನಾವು ಕಲಿಯುವುದನ್ನು ನೈಜ ಪರಿಸ್ಥಿತಿಗಳಲ್ಲಿ ಅನ್ವಯಿಸುವುದು ಸೇರಿದೆ.',
        throughStory: 'ಈ ಕಥೆಯ ಮೂಲಕ, ನೀವು ಕಂಡುಹಿಡಿಯುವಿರಿ:',
        basicPrinciples: 'ನ ಮೂಲಭೂತ ತತ್ವಗಳು',
        affects: '',
        affectsDaily: 'ನಮ್ಮ ದೈನಂದಿನ ಜೀವನದ ಮೇಲೆ ಹೇಗೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ',
        funFacts: 'ನಿಮ್ಮ ಸ್ನೇಹಿತರನ್ನು ಆಶ್ಚರ್ಯಗೊಳಿಸುವ ವಿನೋದಕರ ಸತ್ಯಗಳು',
        waysToExplore: 'ಅನ್ನು ಮತ್ತಷ್ಟು ಅನ್ವೇಷಿಸುವ ಮಾರ್ಗಗಳು',
        further: '',
        adventure: 'ನಮ್ಮ ಸಾಹಸ ಮುಂದುವರಿಯುತ್ತಿದ್ದಂತೆ, ನೆನಪಿಡಿ',
        notJust: 'ಬಗ್ಗೆ ಕಲಿಯುವುದು ಕೇವಲ ಸತ್ಯಗಳನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳುವುದು ಮಾತ್ರವಲ್ಲ.',
        developing: 'ಇದು ಕುತೂಹಲವನ್ನು ಬೆಳೆಸುವುದು, ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುವುದು ಮತ್ತು ನೀವು ಅಧ್ಯಯನ ಮಾಡುವ ಇತರ ವಿಷಯಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಗಳನ್ನು ಕಂಡುಹಿಡಿಯುವುದರ ಬಗ್ಗೆ.',
        bestPart: 'ಬಗ್ಗೆ ಅತ್ಯುತ್ತಮ ಭಾಗವೆಂದರೆ',
        alwaysMore: 'ಯಾವಾಗಲೂ ಕಂಡುಹಿಡಿಯಲು ಇನ್ನೂ ಹೆಚ್ಚಿನವು ಇವೆ.',
        everyQuestion: 'ನೀವು ಕೇಳುವ ಪ್ರತಿಯೊಂದು ಪ್ರಶ್ನೆಯು ಹೊಸ ಕಲಿಕೆಯ ಅವಕಾಶಗಳಿಗೆ ದಾರಿ ಮಾಡುತ್ತದೆ, ಮತ್ತು ನೀವು ಪಾರಂಗತರಾಗುವ ಪ್ರತಿಯೊಂದು ಪರಿಕಲ್ಪನೆಯು ಹೆಚ್ಚು ಮುಂದುವರಿದ ವಿಷಯಗಳಿಗೆ ಬಾಗಿಲುಗಳನ್ನು ತೆರೆಯುತ್ತದೆ.',
        embark: 'ಆದ್ದರಿಂದ ಈ ಕಲಿಕೆಯ ಪ್ರಯಾಣದಲ್ಲಿ ಒಟ್ಟಿಗೆ ಹೊರಡೋಣ ಮತ್ತು',
        questions: 'ಪ್ರಪಂಚದಲ್ಲಿ ಯಾವ ಅದ್ಭುತ ಆವಿಷ್ಕಾರಗಳು ನಮಗಾಗಿ ಕಾಯುತ್ತಿವೆ ಎಂಬುದನ್ನು ನೋಡೋಣ! ನಿಮಗೆ',
        exploreNext: 'ಬಗ್ಗೆ ಯಾವ ಪ್ರಶ್ನೆಗಳಿವೆ? ನೀವು ಮುಂದೆ ಏನನ್ನು ಅನ್ವೇಷಿಸಲು ಬಯಸುತ್ತೀರಿ?'
      }
    },
    'Bengali': {
      placeholders: {
        topic: 'যেমন: মহাকাশ অন্বেষণ, বন্ধুত্ব, প্রাচীন সভ্যতা'
      },
      labels: {
        gradeLevel: 'শ্রেণী স্তর',
        topicTheme: 'বিষয় বা থিম',
        language: 'ভাষা',
        generateStory: 'গল্প তৈরি করুন',
        creatingStory: 'গল্প তৈরি হচ্ছে...',
        createInteractiveStory: 'ইন্টারঅ্যাক্টিভ গল্প তৈরি করুন',
        generateEducationalStory: 'একটি আকর্ষণীয় শিক্ষামূলক গল্প তৈরি করুন',
        whatYoullLearn: 'আপনি কী শিখবেন',
        thinkAboutIt: 'এটি নিয়ে ভাবুন',
        liked: 'পছন্দ করেছেন',
        like: 'পছন্দ',
        saved: 'সংরক্ষিত',
        save: 'সংরক্ষণ',
        createNewStory: 'নতুন গল্প তৈরি করুন',
        playNarration: 'গল্প শুনুন',
        stopNarration: 'গল্প বন্ধ করুন',
        audioNotAvailable: 'অডিও উপলব্ধ নেই'
      },
      storyElements: {
        welcomePhrase: 'সম্পর্কে একটি উত্তেজনাপূর্ণ শেখার অভিযানে আপনাকে স্বাগতম',
        onceUponTime: 'একদা, আমাদের থেকে খুব বেশি আলাদা নয় এমন এক পৃথিবীতে, আপনার মতোই এক কৌতূহলী ছাত্র বাস করত।',
        fascinated: 'এই ছাত্রটি',
        incredible: 'নিয়ে মুগ্ধ ছিল এবং এর সম্পর্কে সবকিছু জানতে চাইত। এটি এমন একটি অবিশ্বাস্য বিষয় যা সম্ভাবনার জগৎ খুলে দেয়।',
        discover: 'যখন আমরা',
        tellMore: 'অধ্যয়ন করি, তখন আমরা আশ্চর্যজনক তথ্য এবং ধারণা আবিষ্কার করি। আরো',
        inGrade: 'সম্পর্কে বলি। শ্রেণী',
        explore: 'এ, ছাত্ররা সাধারণত',
        throughActivities: 'কে হাতে-কলমে কার্যক্রম এবং আকর্ষণীয় পাঠের মাধ্যমে অন্বেষণ করে।',
        keyConcepts: 'মূল ধারণাগুলির মধ্যে রয়েছে মৌলিক বিষয়গুলি বোঝা, সমালোচনামূলক চিন্তাভাবনা অনুশীলন করা এবং আমরা যা শিখি তা বাস্তব পরিস্থিতিতে প্রয়োগ করা।',
        throughStory: 'এই গল্পের মাধ্যমে, আপনি আবিষ্কার করবেন:',
        basicPrinciples: 'এর মৌলিক নীতিগুলি',
        affects: '',
        affectsDaily: 'আমাদের দৈনন্দিন জীবনে কীভাবে প্রভাব ফেলে',
        funFacts: 'মজার তথ্য যা আপনার বন্ধুদের অবাক করবে',
        waysToExplore: 'কে আরও অন্বেষণ করার উপায়',
        further: '',
        adventure: 'আমাদের অভিযান চলতে থাকলে, মনে রাখবেন',
        notJust: 'সম্পর্কে শেখা শুধু তথ্য মুখস্থ করা নয়।',
        developing: 'এটি কৌতূহল বিকাশ, প্রশ্ন জিজ্ঞাসা এবং আপনি যে অন্যান্য বিষয় অধ্যয়ন করেন তার সাথে সংযোগ খোঁজার বিষয়।',
        bestPart: 'সম্পর্কে সবচেয়ে ভাল অংশ হল',
        alwaysMore: 'সবসময় আবিষ্কার করার জন্য আরও কিছু থাকে।',
        everyQuestion: 'আপনার জিজ্ঞাসা করা প্রতিটি প্রশ্ন নতুন শেখার সুযোগের দিকে নিয়ে যায়, এবং আপনি যে প্রতিটি ধারণায় দক্ষতা অর্জন করেন তা আরও উন্নত বিষয়ের দরজা খুলে দেয়।',
        embark: 'তাই আসুন একসাথে এই শেখার যাত্রায় বেরিয়ে পড়ি এবং দেখি',
        questions: 'এর জগতে কী আশ্চর্যজনক আবিষ্কার আমাদের জন্য অপেক্ষা করছে! আপনার',
        exploreNext: 'সম্পর্কে কী প্রশ্ন আছে? আপনি পরবর্তীতে কী অন্বেষণ করতে চান?'
      }
    }
  };
  
  return content[language] || content['English']; // Default to English
};

// Get appropriate font classes for language
const getLanguageFontClass = (language: string) => {
  const fontClasses: Record<string, string> = {
    'Hindi': 'font-devanagari',
    'Tamil': 'font-tamil', 
    'Kannada': 'font-kannada',
    'Bengali': 'font-bengali',
    'English': 'font-sans'
  };
  
  return fontClasses[language] || 'font-sans';
};

// Demo story generator for fallback mode
const generateDemoStory = (request: { grade: number; topic: string; language?: string }): Story => {
  const { topic, grade, language = 'English' } = request;
  const langContent = getLanguageContent(language);
  const storyElements = langContent.storyElements;
  
  const demoStory: Story = {
    id: `demo_story_${Date.now()}`,
    title: `${storyElements.welcomePhrase} ${topic}!`,
    content: `${storyElements.welcomePhrase} ${topic}!

${storyElements.onceUponTime} ${storyElements.fascinated} ${topic} ${storyElements.incredible}

${storyElements.discover} ${topic}${storyElements.tellMore} ${topic}...

${storyElements.inGrade} ${grade}${storyElements.explore} ${topic} ${storyElements.throughActivities}

${storyElements.keyConcepts}

${storyElements.throughStory}
- ${storyElements.basicPrinciples} ${topic}
- ${storyElements.affects}${topic} ${storyElements.affectsDaily}
- ${storyElements.funFacts}
- ${storyElements.waysToExplore} ${topic}${storyElements.further}

${storyElements.adventure} ${topic} ${storyElements.notJust}

${storyElements.developing}

${storyElements.bestPart} ${topic} ${storyElements.alwaysMore}

${storyElements.everyQuestion}

${storyElements.embark} ${topic}!

${storyElements.questions} ${topic}? ${storyElements.exploreNext}`,
    summary: `An interactive learning story about ${topic} designed for Grade ${grade} students`,
    grade: grade,
    topic: topic,
    language: language,
    learning_objectives: [
      `Understand the fundamental concepts of ${topic}`,
      `Apply ${topic} knowledge to real-world scenarios`,
      `Develop critical thinking skills related to ${topic}`,
      `Build confidence in discussing ${topic} topics`
    ],
    discussion_questions: [
      `What did you find most interesting about ${topic}?`,
      `How can you apply what you learned about ${topic} in your daily life?`,
      `What other subjects connect to ${topic}?`,
      `What questions do you still have about ${topic}?`
    ],
    vocabulary_words: [
      topic.toLowerCase(),
      'learning',
      'discovery',
      'exploration',
      'understanding'
    ]
  };
  
  return demoStory;
};

export default function Activities() {
  const [activityType, setActivityType] = useState<ActivityType>('story');
  const [loading, setLoading] = useState(false);
  const [activityState, setActivityState] = useState<ActivityState>({
    currentStory: null,
    likedStories: new Set(),
    bookmarkedStories: new Set(),
    isPlayingAudio: false,
    audioError: null,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ActivityRequest>({
    defaultValues: {
      grade: 9,
      topic: '',
      language: 'English',
    }
  });

  // Audio functionality
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async (audioFilename: string) => {
    try {
      setActivityState(prev => ({ ...prev, audioError: null }));
      
      // Construct audio URL based on backend configuration
      const audioUrl = `http://localhost:8000/api/v1/activities/audio/${audioFilename}`;
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Create new audio element
      audioRef.current = new Audio(audioUrl);
      
      // Set up event listeners
      audioRef.current.addEventListener('loadstart', () => {
        setActivityState(prev => ({ ...prev, isPlayingAudio: true }));
      });
      
      audioRef.current.addEventListener('ended', () => {
        setActivityState(prev => ({ ...prev, isPlayingAudio: false }));
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setActivityState(prev => ({ 
          ...prev, 
          isPlayingAudio: false,
          audioError: 'Failed to play audio. The audio file may not be available yet.'
        }));
      });
      
      // Start playback
      await audioRef.current.play();
      toast.success('🎵 Playing story narration!');
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setActivityState(prev => ({ 
        ...prev, 
        isPlayingAudio: false,
        audioError: 'Unable to play audio. Please try again later.'
      }));
      toast.error('Failed to play audio');
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setActivityState(prev => ({ ...prev, isPlayingAudio: false }));
      toast.success('🛑 Audio stopped');
    }
  };

  const generateStory = async (data: ActivityRequest) => {
    try {
      setLoading(true);
      
      // Comprehensive input validation
      const validation = validateObject(data, ActivityValidationSchema);
      
      if (!validation.isValid) {
        showValidationErrors(validation.errors);
        return;
      }

      // Additional business logic validation
      if (!data.topic || data.topic.trim().length < 3) {
        toast.error('Please provide a detailed topic (at least 3 characters).');
        return;
      }

      if (!data.grade || data.grade < 1 || data.grade > 12) {
        toast.error('Please select a valid grade level between 1 and 12.');
        return;
      }

      // Sanitize and prepare request data
      const sanitizedData = {
        grade: data.grade,
        topic: data.topic.trim(),
        language: data.language || 'English'
      };

      // Validate story request data
      const storyValidation = validateObject(sanitizedData, InteractiveStoryValidationSchema);
      
      if (!storyValidation.isValid) {
        showValidationErrors(storyValidation.errors);
        return;
      }
      
      const response = await ApiService.Activities.createInteractiveStory(sanitizedData);
      
      console.log('📥 Interactive Story API response:', response);
      console.log('📊 Response keys:', Object.keys(response));
      console.log('📖 Story title:', response.title);
      console.log('📝 Story text length:', response.story_text?.length);
      console.log('🎯 Learning objectives:', response.learning_objectives);
      console.log('📚 Vocabulary words:', response.vocabulary_words);
      console.log('💭 Think about it:', response.think_about_it);
      console.log('📖 What you learn:', response.what_you_learn);
      console.log('🌍 Language:', response.language);
      console.log('📚 Subject:', response.subject);
      console.log('🎵 Audio filename:', response.audio_filename);
      
      // Enhanced response validation
      if (!response) {
        console.log('❌ No response received from server');
        throw new Error('No response received from server');
      }
      
      // Log response structure for debugging
      console.log('🔍 Response structure check:');
      console.log('  - story_id exists:', !!response.story_id);
      console.log('  - story_text exists:', !!response.story_text);
      console.log('  - title exists:', !!response.title);
      console.log('  - learning_objectives exists:', !!response.learning_objectives);
      console.log('  - think_about_it exists:', !!response.think_about_it);
      console.log('  - what_you_learn exists:', !!response.what_you_learn);
      console.log('  - audio_filename exists:', !!response.audio_filename);
      
      // Backend returns InteractiveStoryResponse directly
      if (response.story_id && response.story_text) {
        // Validate essential story components
        if (!response.title || !response.story_text) {
          throw new Error('Story missing essential components (title or content)');
        }

        // Convert to our Story format with enhanced validation
        const story: Story = {
          id: response.story_id,
          title: response.title || `Story: ${sanitizedData.topic}`,
          content: response.story_text,
          summary: response.what_you_learn || response.title || `Interactive story about ${sanitizedData.topic}`, 
          grade: response.grade_level || sanitizedData.grade,
          topic: response.topic || sanitizedData.topic,
          language: response.language || data.language || 'English',
          audio_filename: response.audio_filename, // Add audio filename from backend
          learning_objectives: Array.isArray(response.learning_objectives) ? 
            response.learning_objectives.filter(obj => obj && obj.trim()) : 
            [`Learn about ${sanitizedData.topic}`],
          vocabulary_words: Array.isArray(response.vocabulary_words) ? 
            response.vocabulary_words.filter(word => word && word.trim()) : 
            [],
          // Generate discussion questions using backend's think_about_it and custom questions
          discussion_questions: (() => {
            const questions = [];
            
            // Parse think_about_it field - it might contain multiple questions
            if (response.think_about_it && response.think_about_it.trim()) {
              const thinkAboutText = response.think_about_it.trim();
              
              // Split by common question delimiters
              const splitQuestions = thinkAboutText
                .split(/[.!?]\s+(?=[A-Z])|[\n\r]+/)
                .map(q => q.trim())
                .filter(q => q.length > 10) // Filter out very short fragments
                .map(q => {
                  // Ensure question ends with proper punctuation
                  if (!q.match(/[.!?]$/)) {
                    q += '?';
                  }
                  return q;
                });
              
              if (splitQuestions.length > 0) {
                questions.push(...splitQuestions);
              } else {
                // If splitting didn't work, use the whole text as one question
                questions.push(thinkAboutText.endsWith('?') ? thinkAboutText : thinkAboutText + '?');
              }
            }
            
            // Add additional custom questions
            // questions.push(
            //   `What did you learn about ${sanitizedData.topic} from this story?`,
            //   `How can you apply this knowledge in real life?`,
            //   `What part of the story about ${sanitizedData.topic} interested you most?`,
            //   `What questions do you still have about ${sanitizedData.topic}?`
            // );
            
            return questions.filter(q => q && q.trim()); // Remove any empty questions
          })()
        };

        // Ensure we have valid learning objectives
        if (!story.learning_objectives || story.learning_objectives.length === 0) {
          console.warn('No valid learning objectives found, adding default');
          story.learning_objectives = [`Explore and understand ${sanitizedData.topic} through interactive storytelling`];
        }

        // Validate story content length
        if (story.content.length < 100) {
          console.warn('Story content is very short, this may indicate an API issue');
          toast.error('Generated story is shorter than expected. You may want to try again with a more specific topic.');
        }
        
        setActivityState(prev => ({
          ...prev,
          currentStory: story,
        }));
        
        console.log('✅ Story successfully set in state:', story);
        console.log('📊 Activity state updated, currentStory:', story.id);
        console.log('📖 Story title:', story.title);
        console.log('📝 Story content length:', story.content.length);
        
        toast.success(`Interactive story "${story.title}" generated successfully!`);
      } else {
        console.log('❌ Invalid story structure, using demo mode...');
        console.log('📊 response.story_id exists:', !!response.story_id);
        console.log('📊 response.story_text exists:', !!response.story_text);
        
        // Fallback to demo story when API response is invalid
        const demoStory = generateDemoStory({ ...data, language: data.language });
        setActivityState(prev => ({
          ...prev,
          currentStory: demoStory,
        }));
        
        toast.success(`📚 Demo Story created! (API returned invalid data)`, {
          icon: '🎭',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Story generation error:', error);
      console.log('🔄 API error, falling back to demo mode...');
      console.log('Error details:', error?.response?.data || error.message);
      
      // Fallback to demo story when API fails
      try {
        const demoStory = generateDemoStory({ ...data, language: data.language });
        setActivityState(prev => ({
          ...prev,
          currentStory: demoStory,
        }));
        
        toast.success(`📚 Demo Story created! Backend unavailable, using sample content.`, {
          icon: '🎭',
          duration: 4000,
        });
      } catch (demoError) {
        console.error('Demo story generation failed:', demoError);
        toast.error('Failed to generate story. Please try again.');
      }
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
      name: 'Fun Lab',
      description: 'Gamified exercises to reinforce key concepts',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-indigo-500',
    },
  ];

  const renderActivitySelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
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

  const renderStoryForm = () => {
    // Get the current form values to determine language
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
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{langContent.labels.createInteractiveStory}</h2>
          <p className="text-gray-600">{langContent.labels.generateEducationalStory}</p>
        </div>

        <form onSubmit={handleSubmit(generateStory)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {langContent.labels.gradeLevel}
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
              {langContent.labels.topicTheme}
            </label>
            <input
              {...register('topic', { 
                required: 'Topic is required',
                minLength: { value: 2, message: 'Topic must be at least 2 characters' }
              })}
              type="text"
              placeholder={langContent.placeholders.topic}
              className="input-field"
            />
            {errors.topic && (
              <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {langContent.labels.language}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-3" />
                {langContent.labels.creatingStory}
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6 mr-3" />
                {langContent.labels.generateStory}
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
    );
  };

  const renderStory = () => {
    if (!activityState.currentStory) return null;

    const story = activityState.currentStory;
    const isLiked = activityState.likedStories.has(story.id || '');
    const isBookmarked = activityState.bookmarkedStories.has(story.id || '');
    
    // Get language content based on story's language
    const langContent = getLanguageContent(story.language || 'English');

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Story Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white">
            <h2 className={cn(
              "text-3xl font-bold mb-4",
              getLanguageFontClass(story.language || 'English')
            )}>
              {story.title}
            </h2>
            <p className={cn(
              "text-pink-100 text-lg",
              getLanguageFontClass(story.language || 'English')
            )}>
              {story.summary}
            </p>
          </div>

          {/* Story Content */}
          <div className="p-8">
            <div className="prose max-w-none mb-8">
              <div className={cn(
                "text-gray-800 leading-relaxed text-lg whitespace-pre-line",
                getLanguageFontClass(story.language || 'English')
              )}>
                {story.content}
              </div>
            </div>

            {/* Learning Objectives */}
            {story.learning_objectives && story.learning_objectives.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {langContent.labels.whatYoullLearn}
                </h3>
                <ul className="space-y-2">
                  {story.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start text-blue-800">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span className={getLanguageFontClass(story.language || 'English')}>
                        {objective}
                      </span>
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
                  {langContent.labels.thinkAboutIt}
                </h3>
                <ul className="space-y-3">
                  {story.discussion_questions.map((question, index) => (
                    <li key={index} className={cn(
                      "text-green-800",
                      getLanguageFontClass(story.language || 'English')
                    )}>
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
                  <span>{isLiked ? langContent.labels.liked : langContent.labels.like}</span>
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
                  <span>{isBookmarked ? langContent.labels.saved : langContent.labels.save}</span>
                </button>

                {/* Audio Narration Button */}
                {story.audio_filename ? (
                  <button
                    onClick={() => activityState.isPlayingAudio ? stopAudio() : playAudio(story.audio_filename!)}
                    disabled={activityState.isPlayingAudio && !story.audio_filename}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                      activityState.isPlayingAudio
                        ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    )}
                  >
                    {activityState.isPlayingAudio ? (
                      <PauseSolidIcon className="w-5 h-5" />
                    ) : (
                      <PlaySolidIcon className="w-5 h-5" />
                    )}
                    <span>
                      {activityState.isPlayingAudio 
                        ? langContent.labels.stopNarration 
                        : langContent.labels.playNarration
                      }
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                  >
                    <SpeakerWaveIcon className="w-5 h-5" />
                    <span>{langContent.labels.audioNotAvailable}</span>
                  </button>
                )}

                {/* Audio Error Display */}
                {activityState.audioError && (
                  <div className="text-red-600 text-sm px-2">
                    {activityState.audioError}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActivityState(prev => ({ ...prev, currentStory: null }))}
                className="btn-secondary"
              >
                {langContent.labels.createNewStory}
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
            ? "Interactive fun labs and gamified exercises are in development."
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
        
        {(activityType === 'game') && renderComingSoon()}
      </div>
    </Navigation>
  );
}
