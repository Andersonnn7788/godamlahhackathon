# BIM Sign Language Interpreter 🤟

> **AI-Powered Malaysian Sign Language Communication System for Smart National ID Cards**

Developed for the **NexG Godamlah Hackathon 2025** - Empowering deaf citizens to communicate independently with government officers through real-time sign language recognition and avatar-based responses.

## 🎯 Problem Statement

**What else can a smart national ID card do?**

Deaf citizens face significant barriers when communicating with hearing officers at government services, kiosks, and institutions. Traditional solutions require human interpreters, creating dependencies and delays.

## 💡 Innovation

This system unlocks a built-in **AI sign-language interpreter** accessible via any kiosk or government website through the Smart National ID card:

### Features
- 📹 **Real-time Camera Recognition** - Reads Malaysian Sign Language (BIM) gestures
- 💬 **Speech & Text Conversion** - Converts signs to text/speech for officers
- 🤖 **Animated Sign Language Avatar** - Converts officer responses back into on-screen sign language
- 🔒 **Privacy-Focused Design** - Local hand detection with MediaPipe; cloud-enhanced classification via Roboflow API (no full video stored)
- 🌐 **Bilingual Support** - Works with Bahasa Malaysia and English

### Impact
✅ Zero need for human interpreters  
✅ Deaf citizens can independently access services  
✅ Faster, more dignified communication  
✅ 24/7 availability at any smart kiosk  

---

## 🚀 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern styling
- **React Webcam** - Camera integration
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **Socket.io Client** - Real-time WebSocket communication

### Backend (Separate Repository)
- **FastAPI** - High-performance Python API
- **Python** - ML model integration
- **TensorFlow/MediaPipe** - Sign language recognition

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A modern web browser with camera access

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd godamlahhackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your FastAPI backend URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 🎮 How to Use

### For Deaf Users
1. **Allow Camera Access** - Click "Start Camera" to enable your webcam
2. **Start Signing** - Perform Malaysian Sign Language (BIM) gestures
3. **View Translation** - Your signs are converted to text in real-time
4. **Receive Responses** - Officer messages appear as animated sign language

### For Officers
1. **View User's Message** - See recognized text from deaf user's signs
2. **Type Response** - Enter your message in Bahasa Malaysia or English
3. **Send** - Your text is converted to sign language avatar animation
4. **Audio Option** - Text-to-speech available for additional context

---

## 🔒 Privacy & Security

- ✅ **Hybrid Processing** - Hand detection runs locally with MediaPipe; sign classification uses cloud APIs (Roboflow, OpenAI)
- ✅ **No Full Video Storage** - Only cropped hand regions sent for classification; full camera feed never stored
- ✅ **Privacy-Focused** - Hand detection happens on-device, minimizing data transmission
- ✅ **Transparent Indicators** - Clear badges show processing mode
- ✅ **User Control** - Camera can be stopped at any time

---

## 📱 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 15+
- ⚠️ Requires camera permissions
- ⚠️ HTTPS required for camera access (except localhost)

---

## 👥 Team

Track: **Inclusivity**  
Team Name: **WoDouBuZhiDao**  
Team Members:
- Ling Jing Jie
- Wong Xuan Rui
- Khoo Jun Xi
- Lee Kai Hong
- Yiew Jason

---

**Built with ❤️ for an inclusive Malaysia**


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
