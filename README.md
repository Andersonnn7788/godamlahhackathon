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
- 📋 **Visit History Tracking** - Automatically records all government service visits with details
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
- **Next.js 16** 
- **TypeScript** 
- **Tailwind CSS 4** 

### Backend 
- **FastAPI** 
- **Python** 
- **Uvicorn**
- **OpenCV**

### AI/ML Models
- **MediaPipe**
- **Roboflow**
- **OpenAI**

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
2. **Speech Response** - Speak in Bahasa Malaysia or English
3. **Send** - Your text is converted to sign language avatar animation
4. **Audio Option** - Text-to-speech available for additional context

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



