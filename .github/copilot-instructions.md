# Copilot Instructions for A4AI-FRONTEND-NEW

## Project Overview
- **A4AI** is a React + TypeScript educational platform with advanced AI assistant features, including voice, file upload, and session management.
- The frontend communicates with a FastAPI backend (OpenAPI 3.1.0) at `http://localhost:8000/api/v1/voice/assistant`.
- Fallback/demo mode is used if the backend is unavailable.

## Key Architectural Patterns
- **Pages**: Main features are in `src/pages/`, e.g. `voice-assistant/EnhancedVoiceAssistant.tsx` for the AI chat.
- **Components**: UI elements and layout in `src/components/layout/` and `src/components/ui/`.
- **API Services**: All API calls are centralized in `src/services/apiService.ts`. Use `ApiService.Voice.universalAssistant()` for AI chat.
- **Types**: Shared TypeScript types in `src/types/` (e.g. `EnhancedAssistantRequest`, `EnhancedAssistantResponse`, `VoiceMessage`).
- **State**: Local React state is used for chat, session, and UI. No global state manager (Zustand is used for auth only).
- **Styling**: Tailwind CSS with config in `tailwind.config.js`. Dark mode is supported via class toggling.

## Developer Workflows
- **Start Dev Server**: `npm run dev` (Vite, port 3000)
- **Build**: `npm run build`
- **Lint/Type Check**: `npm run lint`, `npm run type-check`
- **API Health**: Check backend with `http://localhost:8000/api/v1/voice/health`.
- **Session Management**: Use `ApiService.Voice.createSession`, `loadConversationHistory`, and `deleteSession` for chat sessions.
- **Voice/Audio**: Uses browser WebRTC APIs for recording; ensure HTTPS in production.

## Integration Points
- **Backend**: All AI features require the FastAPI backend. If unavailable, fallback responses are shown.
- **File Uploads**: Handled via FormData in API calls. Only the first file is sent for analysis (see `apiService.ts`).
- **Voice**: Audio files are sent as `audio_file` in FormData.
- **Session Context**: Session ID and user ID are required for continuity.

## Project-Specific Conventions
- **API Response**: Expect `message`, `ai_response`, `session_id`, `audio_url`, `metadata`, `suggestions`, `follow_up_questions`, `attachments`.
- **Error Handling**: Fallback to demo mode if API fails; show clear toast notifications.
- **File Previews**: Images use DataURL, other files use ObjectURL.
- **Chat UI**: Always display `ai_response` if present, else `message`.
- **Component Structure**: Keep UI logic in page components, API logic in services.

## Examples
- To send a message to the AI assistant:
  ```tsx
  const response = await ApiService.Voice.universalAssistant(request);
  const text = response.ai_response || response.message;
  ```
- To start a new session:
  ```tsx
  const sessionId = await ApiService.Voice.createSession(userId);
  ```
- To upload a file:
  ```typescript
  formData.append('file_upload', file);
  ```

## Key Files
- `src/pages/voice-assistant/EnhancedVoiceAssistant.tsx` (main chat UI)
- `src/services/apiService.ts` (API logic)
- `src/types/index.ts` (shared types)
- `src/components/layout/Navigation.tsx` (navigation)

---

If any section is unclear or missing, please provide feedback so this guide can be improved for future AI agents.
