# FocusFlow - Screentime Reducer App

## Overview
FocusFlow is a professional mobile application designed to help users reduce screen time through gamification, social features, and smart locking mechanisms.

## Features

### Core Features
- **App Blocker**: Block individual apps or categories with scheduled locking
- **Full Lock Mode**: Complete device lock with emergency override
- **Focus Mode**: Pomodoro timer with ambient sounds and distraction blocking
- **Reward System**: Badges, streaks, and Focus Coins
- **Global Leaderboard**: Compete with users worldwide
- **Statistics**: Detailed analytics and insights
- **Social Features**: Friends, challenges, and accountability partners

### Technical Stack
- **Framework**: React Native 0.73.6 with TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation v6
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Storage**: AsyncStorage + Redux Persist
- **Testing**: Jest + React Native Testing Library + Detox
- **CI/CD**: GitHub Actions + Fastlane

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── store/              # Redux store and slices
├── services/           # API services and Firebase
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # App constants
├── theme/              # Theme configuration
└── assets/             # Images, fonts, sounds
```

## Development Phases

### Phase 1: Setup & Foundation
- [x] Project initialization
- [x] Folder structure
- [x] Dependencies installation
- [x] Navigation setup
- [x] Theme configuration

### Phase 2: Core Features
- [ ] App Blocker implementation
- [ ] Focus Mode with Pomodoro
- [ ] Statistics screen
- [ ] Local notifications

### Phase 3: Backend & Social
- [ ] Firebase integration
- [ ] Authentication
- [ ] Leaderboard
- [ ] Badge system
- [ ] Social features

### Phase 4: Polish & Testing
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] CI/CD pipeline

## Getting Started

### Prerequisites
- Node.js >= 18
- React Native CLI
- Android Studio / Xcode
- Firebase project

### Installation
```bash
# Clone repository
git clone https://github.com/unplug-netizen/focusflow.git
cd focusflow

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Start Metro
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Environment Setup
Create `.env` file:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id
```

## License
MIT
