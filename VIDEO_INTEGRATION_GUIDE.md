# Video Integration Guide

## Overview
This guide explains how to integrate the video response from the main branch into the roboflow branch while keeping all TOLONG SAYA functionality.

## Step 1: Get the Video File from Main Branch

### Option A: Using Git (Recommended)
```bash
# Make sure you're on roboflow branch
git checkout roboflow

# Get the video file from main branch
git checkout main -- public/videos/apa-yang-saya-boleh-bantu.mp4
# Or whatever the path is in main branch

# Commit the video file
git add public/videos/
git commit -m "Add officer response video from main branch"
```

### Option B: Manual Copy
1. Switch to main branch in a separate folder
2. Find the video file (likely in `public/videos/` or similar)
3. Copy it to your roboflow branch at `frontend/public/videos/apa-yang-saya-boleh-bantu.mp4`

## Step 2: Video File Location
Place your video file at:
```
frontend/public/videos/apa-yang-saya-boleh-bantu.mp4
```

## Step 3: Integration is Already Done!
I've created a `VideoResponsePlayer` component that:
- ✅ Plays video when officer speaks "Apa yang saya boleh bantu"
- ✅ Has mute/unmute controls
- ✅ Shows placeholder when no video is playing
- ✅ Matches your roboflow interface design

## Step 4: Update Demo Page to Use Video

The demo page needs to be updated to:
1. Detect when officer input contains "Apa yang saya boleh bantu"
2. Play the video instead of showing avatar animation
3. Keep all TOLONG SAYA functionality intact

## Next Steps

Once you have the video file, I can:
1. Update the demo page to use the VideoResponsePlayer
2. Add logic to detect "Apa yang saya boleh bantu" text
3. Switch between video and avatar based on the message
4. Ensure TOLONG SAYA functionality remains unchanged

## File Structure
```
frontend/
├── public/
│   └── videos/
│       └── apa-yang-saya-boleh-bantu.mp4  ← Add video here
├── src/
│   └── components/
│       └── avatar/
│           ├── SignLanguageAvatar.tsx      ← Existing avatar
│           └── VideoResponsePlayer.tsx     ← New video player (✅ Created)
```

## Questions to Answer
1. What is the exact path of the video file in the main branch?
2. What is the exact phrase that should trigger the video? ("Apa yang saya boleh bantu"?)
3. Should the video play automatically or require a button click?

