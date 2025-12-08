# Project Architecture Overview

## 📁 Complete File Structure

```
godamlahhackathon/
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore patterns
├── eslint.config.mjs               # ESLint configuration
├── next-env.d.ts                   # Next.js TypeScript declarations
├── next.config.ts                  # Next.js configuration
├── package.json                    # Project dependencies
├── postcss.config.mjs              # PostCSS configuration
├── README.md                       # Project documentation
├── NEXT_STEPS.md                   # Hackathon next steps guide
├── tsconfig.json                   # TypeScript configuration
│
├── public/                         # Static assets
│   └── (Next.js default assets)
│
└── src/
    ├── app/                        # Next.js App Router
    │   ├── globals.css             # Global styles & Tailwind
    │   ├── layout.tsx              # Root layout with metadata
    │   └── page.tsx                # Main application page
    │
    ├── components/                 # React components
    │   ├── camera/
    │   │   └── CameraCapture.tsx   # Webcam integration component
    │   ├── avatar/
    │   │   └── SignLanguageAvatar.tsx  # Animated avatar display
    │   └── ui/
    │       ├── Button.tsx          # Reusable button component
    │       ├── Card.tsx            # Card container component
    │       ├── LoadingSpinner.tsx  # Loading indicator
    │       └── PrivacyBadge.tsx    # Privacy mode indicator
    │
    ├── lib/                        # Utilities and business logic
    │   ├── api/
    │   │   ├── fastapi-client.ts   # REST API client (Axios)
    │   │   └── websocket-client.ts # WebSocket client (Socket.io)
    │   ├── hooks/
    │   │   ├── useCamera.ts        # Camera access management
    │   │   ├── useSignLanguage.ts  # Sign language state & detection
    │   │   └── useWebSocket.ts     # WebSocket connection hook
    │   └── utils/
    │       └── constants.ts        # App constants & utilities
    │
    └── types/                      # TypeScript type definitions
        ├── api.ts                  # FastAPI request/response types
        └── sign-language.ts        # BIM gesture & translation types
```

---

## 🏗️ Architecture Layers

### 1. **Presentation Layer** (`src/components/`)

#### Camera Components
- **CameraCapture.tsx**
  - Manages webcam access using `react-webcam`
  - Auto-captures frames at intervals
  - Provides start/stop/switch controls
  - Displays recording indicator
  - Handles camera errors gracefully

#### Avatar Components
- **SignLanguageAvatar.tsx**
  - Displays officer's response as animated avatar
  - Cycles through gesture animations using Framer Motion
  - Text-to-speech support (Bahasa Malaysia)
  - Mute/unmute controls

#### UI Components
- **Button.tsx** - Variant-based button system
- **Card.tsx** - Container with header/content/footer
- **LoadingSpinner.tsx** - Loading states
- **PrivacyBadge.tsx** - Privacy mode indicator

---

### 2. **Business Logic Layer** (`src/lib/`)

#### API Clients (`lib/api/`)

**fastapi-client.ts**
```typescript
class FastAPIClient {
  - healthCheck()              // Check backend status
  - detectGesture()            // Send frame for recognition
  - translateToSign()          // Convert text to gestures
  - getAvailableGestures()     // Get supported gestures
}
```

**websocket-client.ts**
```typescript
class WebSocketClient {
  - connect()      // Establish WebSocket connection
  - disconnect()   // Close connection
  - send()         // Send message to server
  - isConnected()  // Check connection status
}
```

#### Custom Hooks (`lib/hooks/`)

**useCamera.ts**
- State: `isActive`, `isLoading`, `error`, `stream`, `deviceId`
- Controls: `startCamera()`, `stopCamera()`, `switchCamera()`, `captureFrame()`
- Auto-cleanup on unmount

**useSignLanguage.ts**
- Zustand store for global sign language state
- `useGestureDetection()` - Detects gestures from frames
- `useSignTranslation()` - Translates text to sign language
- State: `currentGesture`, `recognizedText`, `translationResult`, `isProcessing`

**useWebSocket.ts**
- Manages WebSocket connection lifecycle
- State: `status`, `error`, `lastMessage`
- Methods: `connect()`, `disconnect()`, `sendMessage()`

#### Utilities (`lib/utils/`)

**constants.ts**
- API configuration (URLs, timeouts)
- Video settings (resolution, frame rate)
- Avatar configuration (animation speed)
- `cn()` utility for className merging

---

### 3. **Data Layer** (`src/types/`)

#### sign-language.ts
```typescript
- BIMGesture              // Individual gesture data
- SignLanguageFrame       // Video frame data
- GestureRecognitionResult // Recognition response
- TranslationResult       // Text-to-sign translation
- AvatarAnimation         // Animation data
- ProcessingMode          // local | edge | server
- PrivacySettings         // Privacy configuration
```

#### api.ts
```typescript
// Request types
- DetectGestureRequest
- TranslateToSignRequest
- StreamConfig

// Response types
- DetectGestureResponse
- TranslateToSignResponse
- HealthCheckResponse

// WebSocket types
- WebSocketMessage<T>
- WebSocketMessageType
```

---

## 🔄 Data Flow

### Gesture Recognition Flow

```
User Signs → Camera → CameraCapture Component
                          ↓
                    captureFrame()
                          ↓
                    Base64 Image Data
                          ↓
                  useGestureDetection()
                          ↓
                   FastAPI Client
                          ↓
          POST /api/sign-language/detect
                          ↓
              Backend ML Model (TODO)
                          ↓
                  GestureRecognitionResult
                          ↓
              Zustand Store (update state)
                          ↓
              Page.tsx (display result)
```

### Translation Flow

```
Officer Types Text → Form Input
                          ↓
               handleOfficerSubmit()
                          ↓
               useSignTranslation()
                          ↓
                FastAPI Client
                          ↓
         POST /api/sign-language/translate
                          ↓
            Backend Translation (TODO)
                          ↓
                TranslationResult
                          ↓
            Zustand Store (update state)
                          ↓
         SignLanguageAvatar Component
                          ↓
               Framer Motion Animation
```

---

## 🎨 Styling Architecture

### Tailwind CSS 4 Structure

**globals.css**
```css
@theme {
  /* Custom color variables */
  --color-*: ...;
}

/* Dark mode handled automatically */
@media (prefers-color-scheme: dark) {
  /* Dark theme variables */
}
```

**Component Styling**
- Uses Tailwind utility classes
- `cn()` helper for conditional classes
- `class-variance-authority` for component variants
- Responsive design with `sm:`, `md:`, `lg:` breakpoints

---

## 🔌 Integration Points

### Frontend → Backend

**REST API**
```typescript
// Detection
POST /api/sign-language/detect
Headers: { X-Request-Timestamp }
Body: { frame: SignLanguageFrame, previousContext?: string[] }

// Translation
POST /api/sign-language/translate
Body: { text: string, language: 'en' | 'ms', speed: string }
```

**WebSocket**
```typescript
// Connect
ws://localhost:8000/ws/sign-language

// Message Format
{
  type: 'gesture_frame' | 'gesture_result' | 'translation_request',
  payload: T,
  timestamp: number,
  sessionId?: string
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Recommended)
```typescript
// Test hooks
test('useCamera starts and stops camera correctly')
test('useGestureDetection handles errors gracefully')

// Test components
test('CameraCapture displays error message on failure')
test('SignLanguageAvatar animates gestures correctly')

// Test API clients
test('FastAPIClient retries on network failure')
test('WebSocketClient reconnects after disconnect')
```

### Integration Tests
```typescript
test('Full gesture recognition flow from camera to display')
test('Officer response translation and avatar animation')
test('Privacy mode switching')
```

---

## 🚀 Performance Optimizations

### Current
- ✅ React Compiler (automatic optimization)
- ✅ Next.js 16 Turbopack (fast builds)
- ✅ Code splitting (automatic)
- ✅ Tree shaking (unused code removal)
- ✅ Image optimization (Next.js Image)

### Recommended
- [ ] Lazy load avatar animations
- [ ] Debounce gesture detection
- [ ] Memoize expensive calculations
- [ ] Virtual scrolling for gesture history
- [ ] Service worker for offline support

---

## 🔐 Security Considerations

### Current
- ✅ No video stored server-side
- ✅ HTTPS enforced (production)
- ✅ Input validation on forms
- ✅ CORS configured in API client

### Recommended
- [ ] Implement rate limiting
- [ ] Add request signing/authentication
- [ ] Sanitize user inputs
- [ ] Add CSP headers
- [ ] Implement session tokens

---

## 📊 State Management

### Zustand Store Structure

```typescript
SignLanguageState {
  // Data
  currentGesture: BIMGesture | null
  recognizedText: string
  translationResult: TranslationResult | null
  
  // UI State
  isProcessing: boolean
  error: string | null
  
  // Config
  processingMode: ProcessingMode
  
  // Actions
  setCurrentGesture()
  addRecognizedText()
  clearRecognizedText()
  setTranslationResult()
  setProcessing()
  setProcessingMode()
  setError()
}
```

---

## 🎯 Key Design Decisions

1. **Client Components (`'use client'`)**
   - Required for camera access and hooks
   - Enables interactivity

2. **Zustand over Redux**
   - Simpler API
   - Less boilerplate
   - Better TypeScript support

3. **Framer Motion for Animations**
   - Smooth, performant animations
   - Easy gesture-based animations
   - Great for avatar movements

4. **Socket.io over Native WebSocket**
   - Auto-reconnection
   - Event-based API
   - Better error handling

5. **Axios over Fetch**
   - Interceptors for logging
   - Automatic transforms
   - Better error handling

---

This architecture provides a solid foundation for your hackathon project with room for growth!
