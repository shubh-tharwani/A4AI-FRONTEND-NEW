# 🤖 A4AI - Advanced AI Educational Platform

A modern, full-featured educational platform with ChatGPT-like AI assistance, voice processing, file upload capabilities, and comprehensive learning tools.

![A4AI Platform](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-18.0+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-blue)

## 🌟 Features

### 🧠 Enhanced AI Assistant
- **ChatGPT-like Interface**: Advanced conversational AI with multiple response styles
- **File Upload Support**: Documents, images, audio, video files (up to 25MB each)
- **Voice Recognition**: High-quality recording with noise cancellation
- **Real-time Processing**: Live transcription and AI responses
- **Multi-format Support**: Images, PDFs, Word docs, audio files, and more

### 📚 Educational Tools
- **Interactive Quizzes**: AI-generated quizzes with instant feedback
- **Lesson Planning**: Automated lesson plan generation
- **Visual Aids**: Dynamic educational content creation
- **AR Experiences**: Augmented reality learning modules
- **Progress Tracking**: Comprehensive analytics and reporting

### 🎯 Core Capabilities
- **Drag & Drop**: Intuitive file handling
- **Session Management**: Conversation history and context preservation
- **Export Features**: Chat export and data backup
- **Responsive Design**: Works on desktop and mobile
- **Real-time Status**: Live API connection monitoring

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

### 🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/A4AI-FRONTEND-NEW.git
   cd A4AI-FRONTEND-NEW
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or if you prefer yarn
   yarn install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000
   VITE_VOICE_API_ENDPOINT=/api/v1/voice/assistant
   
   # Optional: Authentication
   VITE_AUTH_ENABLED=true
   
   # Optional: Analytics
   VITE_ANALYTICS_ID=your-analytics-id
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open Your Browser**
   
   Navigate to `http://localhost:3000` (or the port shown in your terminal)

## 🔧 Backend Setup (Required for Full Functionality)

The Enhanced AI Assistant requires a backend server for full functionality. Without it, the application will run in fallback mode.

### Backend Requirements
- **API Endpoint**: `http://localhost:8000/api/v1/voice/assistant`
- **Method**: POST with FormData support
- **File Support**: Multipart/form-data for file uploads
- **Response Format**: JSON with message, metadata, and suggestions

### Expected API Response Format
```json
{
  "message": "AI response text",
  "session_id": "session_identifier",
  "audio_url": "optional_audio_response_url",
  "metadata": {
    "processing_time": 1000,
    "model": "model_name",
    "confidence": 0.95,
    "tokens_used": 150
  },
  "suggestions": ["suggestion1", "suggestion2"],
  "follow_up_questions": ["question1", "question2"],
  "attachments": []
}
```

## 📁 Project Structure

```
A4AI-FRONTEND-NEW/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Navigation, headers, footers
│   │   └── ui/             # Basic UI elements
│   ├── pages/              # Main application pages
│   │   ├── voice-assistant/# Enhanced AI Assistant
│   │   ├── education/      # Educational tools
│   │   └── auth/           # Authentication pages
│   ├── services/           # API services and utilities
│   ├── types/              # TypeScript type definitions
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles and Tailwind config
├── public/                 # Static assets
├── docs/                   # Documentation
└── package.json           # Project dependencies
```

## 🔑 Key Components

### Enhanced Voice Assistant
- **Location**: `src/pages/voice-assistant/EnhancedVoiceAssistant.tsx`
- **Features**: File upload, voice recording, AI chat, export functionality
- **API Integration**: Uses `ApiService.Voice.universalAssistant()`

### Navigation System
- **Location**: `src/components/layout/Navigation.tsx`
- **Features**: Responsive design, active state management, mobile-friendly

### API Services
- **Location**: `src/services/apiService.ts`
- **Features**: Centralized API calls, error handling, file upload support

## 🎨 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast development and building. Configuration is in `vite.config.ts`.

### Tailwind CSS
Styling is handled by Tailwind CSS. Configuration is in `tailwind.config.js`.

### TypeScript
Type definitions are in the `src/types/` directory. Main types include:
- `VoiceMessage` - Chat messages
- `EnhancedAssistantRequest/Response` - API interfaces
- `ChatAttachment` - File attachments

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on specific ports
   npx kill-port 3000
   # or
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dependencies Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **API Connection Failed**
   - Ensure backend server is running on port 8000
   - Check `.env` file configuration
   - Verify API endpoint in browser: `http://localhost:8000/api/v1/voice/health`

4. **Voice Recording Not Working**
   - Check browser permissions for microphone access
   - Ensure HTTPS in production (required for microphone API)
   - Verify browser compatibility (Chrome, Firefox, Safari)

### Development Tips

- **Hot Reload**: Changes are automatically reflected in the browser
- **API Status**: Check the status indicator in the Enhanced AI Assistant header
- **Console Logs**: Monitor browser console for detailed error messages
- **Network Tab**: Check API calls in browser developer tools

## 🌐 Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 14.3+)
- **Edge**: ✅ Full support

### Required Browser Features
- ES2020+ support
- WebRTC (for voice recording)
- File API (for drag & drop)
- Fetch API

## 📦 Deployment

### Local Testing
```bash
# Test deployment readiness
.\test-deployment.ps1
```

### Google Cloud Platform Deployment

**🚀 Quick Deploy to Google Cloud:**

1. **Prerequisites Setup**
   ```powershell
   # Install Google Cloud CLI
   # https://cloud.google.com/sdk/docs/install
   
   # Test deployment readiness
   .\test-deployment.ps1
   ```

2. **Setup Google Cloud Project**
   ```powershell
   .\deploy.ps1 -ProjectId "your-project-id" -SetupProject
   ```

3. **Deploy Application**
   ```powershell
   .\deploy.ps1 -ProjectId "your-project-id" -Deploy
   ```

**📚 For detailed deployment instructions, see [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md)**

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Then drag the 'dist' folder to Netlify dashboard
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://your-production-api.com
VITE_VOICE_API_ENDPOINT=/api/v1/voice/assistant
```

## 🤝 Contributing

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the `docs/` folder
- **API Questions**: Refer to the backend documentation

### Community
- **Discussions**: Use GitHub Discussions for questions
- **Bug Reports**: Use GitHub Issues with the bug template
- **Feature Requests**: Use GitHub Issues with the feature template

## 🎯 Roadmap

- [ ] **Real-time Collaboration**: Multi-user editing capabilities
- [ ] **Mobile App**: React Native version
- [ ] **Offline Mode**: PWA with offline functionality
- [ ] **Plugin System**: Extensible architecture
- [ ] **Advanced Analytics**: Detailed usage insights
- [ ] **Multi-language**: i18n support

## 📈 Performance

- **Bundle Size**: Optimized with code splitting
- **Loading Time**: < 3s on 3G networks
- **Lighthouse Score**: 90+ across all metrics
- **Tree Shaking**: Unused code elimination

## 🔐 Security

- **HTTPS Enforced**: Required in production
- **Input Validation**: Client and server-side
- **File Upload**: Size and type restrictions
- **XSS Protection**: Sanitized user inputs

---

**Made with ❤️ by the A4AI Team**

For more information, visit our [documentation](docs/) or [create an issue](https://github.com/your-username/A4AI-FRONTEND-NEW/issues/new).
