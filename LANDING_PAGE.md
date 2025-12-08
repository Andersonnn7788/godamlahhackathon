# Smart ID Sign Avatar - Landing Page

## Overview

A modern, responsive landing page built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4 that showcases the Smart ID Sign Avatar accessibility solution for the deaf community in Malaysia.

## Page Structure

### Routes

- **`/` (Home)** - Main landing page with hero section and feature explanations
- **`/demo`** - Interactive prototype demonstrating the sign language communication system
- **`/about`** - Detailed information about the problem, solution, and roadmap
- **`/prototype`** - Original technical prototype (preserved for development)

## Features

### Home Page (`/`)

- **Hero Section**
  - Eye-catching gradient background with grid pattern
  - Large heading: "Smart ID as an Accessibility Key for the Deaf"
  - Descriptive subtitle explaining the core concept
  - Two primary CTAs: "Try Demo" and "View Concept"
  - Decorative wave SVG separator

- **Explanation Section**
  - Three-step process cards explaining how the system works:
    1. Secure Auto-Detect (Smart ID tap)
    2. Sign → Speech (BIM recognition)
    3. Speech → Avatar (AI translation)
  - Each card includes icon, title, description, and bullet points

- **Features Section**
  - Highlights privacy, AI technology, and universal access
  - Three feature cards with icons and descriptions

- **CTA Section**
  - Gradient background with call-to-action to try the demo

### Demo Page (`/demo`)

- **Three-Column Layout** (responsive - stacks on mobile)
  
  **Column 1: User Camera & Recognition**
  - Smart ID activation simulation button
  - Live camera feed for sign language input
  - Recognized text display with clear button
  - Current gesture indicator with confidence level
  
  **Column 2: Officer Response & Avatar**
  - Animated sign language avatar display
  - Officer text input area
  - "Convert to Sign Language" button
  
  **Column 3: Information & Status**
  - System status indicators (Deaf Mode, Camera, AI Processing, Network)
  - "How to Use" guide with step-by-step instructions
  - Privacy notice highlighting offline processing

- **Status Badges**
  - "Deaf Mode ACTIVE" (green badge when activated)
  - "Powered by AI" badge
  - "Offline Mode" badge
  - Privacy badge showing local processing

### About Page (`/about`)

- **Hero Section**
  - Project introduction and mission statement

- **Problem Section**
  - Detailed explanation of communication barriers
  - Two-column layout showing challenges at kiosks and impact on daily life
  - Statistics about deaf citizens in Malaysia

- **Solution Section**
  - Three cards explaining how Smart ID helps:
    1. Encrypted Accessibility Profile
    2. Auto-Activate Deaf Mode
    3. Offline AI Processing
  - Each card includes multiple benefits with icons

- **Roadmap Section**
  - Four-phase deployment plan:
    - **Phase 1 (Q1-Q2 2026)**: Pilot Program
    - **Phase 2 (Q3-Q4 2026)**: National Rollout
    - **Phase 3 (2027)**: Advanced Features
    - **Phase 4 (2028+)**: Ecosystem Expansion
  - Each phase has 4 detailed action items

- **Call to Action**
  - Partnership invitation with key metrics badges

## Components

### UI Components

- **`Header`** - Sticky navigation bar with logo and nav links
  - Logo with fingerprint icon
  - Active route highlighting
  - Responsive design

- **`Badge`** - Status pills with multiple variants
  - Variants: default, primary, success, warning, danger, purple, active
  - Used for status indicators and labels

- **`Button`** - Consistent button styling
  - Variants: default, destructive, outline, secondary, ghost, link
  - Sizes: default, sm, lg, icon

- **`Card`** - Container component with header, content, and footer
  - Used throughout for content organization
  - Consistent rounded corners and shadows

### Layout

- **`(landing)/layout.tsx`** - Shared layout for landing pages
  - Includes Header component
  - Includes Footer with copyright and links
  - Wraps all landing page routes

## Styling

### Tailwind CSS

- **Color Scheme**
  - Primary: Cyan (600) to Blue (600) gradient
  - Success: Green
  - Warning: Amber
  - Danger: Red
  - Purple: For special features

- **Design Principles**
  - Clean, modern aesthetic
  - Generous spacing with consistent padding
  - Rounded corners (`rounded-xl`, `rounded-lg`)
  - Subtle shadows for depth
  - Smooth transitions and hover effects

- **Responsive Design**
  - Mobile-first approach
  - Breakpoints: sm, md, lg
  - Grid layouts that stack on mobile
  - Flexible typography sizing

### Custom CSS

- **Grid Pattern Background**
  - Subtle grid overlay for hero sections
  - Low opacity for visual interest without distraction

## Dark Mode

All components support dark mode with:
- Automatic detection via `prefers-color-scheme`
- Dark variants for all colors
- Proper contrast ratios for accessibility

## Accessibility Features

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast text
- Descriptive alt text for icons
- Focus visible states

## Development

### File Structure

```
src/
├── app/
│   ├── (landing)/          # Route group for landing pages
│   │   ├── page.tsx        # Home page
│   │   ├── demo/
│   │   │   └── page.tsx    # Demo page
│   │   ├── about/
│   │   │   └── page.tsx    # About page
│   │   └── layout.tsx      # Landing pages layout
│   ├── prototype/
│   │   └── page.tsx        # Original prototype
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
└── components/
    └── ui/
        ├── Header.tsx      # Navigation header
        ├── Badge.tsx       # Status badges
        ├── Button.tsx      # Button component
        └── Card.tsx        # Card component
```

### Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### URLs

- Development: http://localhost:3000
- Home: http://localhost:3000/
- Demo: http://localhost:3000/demo
- About: http://localhost:3000/about
- Prototype: http://localhost:3000/prototype

## Future Enhancements

- [ ] Add animations with Framer Motion
- [ ] Implement smooth scroll animations
- [ ] Add video demonstrations
- [ ] Create interactive infographics
- [ ] Add testimonials section
- [ ] Implement contact form
- [ ] Add language switcher (BM/EN)
- [ ] Create press kit page
- [ ] Add FAQ section
- [ ] Implement analytics tracking

## Credits

Developed for Malaysia Inclusivity Hackathon 2025
Smart National ID Innovation Project


