# FocusFlow Mobile App

Eine React Native App zur Unterstützung von digitalem Wohlbefinden durch App-Blocking, Fokus-Timer und Statistik-Tracking.

## Features

- 🚫 **App Blocker**: Blockiere ablenkende Apps mit Zeitlimits oder Zeitplänen
- 🎯 **Fokus-Modus**: Pomodoro-Timer mit Kurz- und Langpausen
- 📊 **Statistiken**: Verfolge deine Bildschirmzeit und Fokus-Sitzungen
- 🏆 **Leaderboard**: Vergleiche dich mit Freunden
- 👤 **Profil**: Verwalte Einstellungen und sammle Badges

## Tech Stack

- React Native 0.73.6
- TypeScript
- Redux Toolkit + Redux Persist
- React Navigation
- Firebase (Auth, Firestore)

## Installation

```bash
npm install
cd ios && pod install && cd ..  # Für iOS
```

## Starten

```bash
npm run android  # Android
npm run ios      # iOS
```

## Type-Check

```bash
npm run type-check
```

## Projektstruktur

```
src/
├── components/       # Wiederverwendbare UI-Komponenten
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Timer.tsx
│   ├── ProgressBar.tsx
│   ├── StatCard.tsx
│   ├── BadgeCard.tsx
│   ├── AppUsageCard.tsx
│   └── LeaderboardItem.tsx
├── screens/          # Screen-Komponenten
│   ├── HomeScreen.tsx
│   ├── AppBlockerScreen.tsx
│   ├── FocusModeScreen.tsx
│   ├── StatsScreen.tsx
│   ├── LeaderboardScreen.tsx
│   ├── ProfileScreen.tsx
│   └── LoginScreen.tsx
├── store/            # Redux Store
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts
│       ├── appBlockerSlice.ts
│       ├── focusModeSlice.ts
│       ├── statsSlice.ts
│       ├── leaderboardSlice.ts
│       └── settingsSlice.ts
├── theme/            # Theme-Konfiguration
│   └── ThemeContext.tsx
└── types/            # TypeScript Typen
    └── index.ts
```

## Navigation

Die App verwendet eine Bottom-Tab-Navigation mit folgenden Tabs:
- Home (🏠)
- Blocker (🚫)
- Fokus (🎯)
- Stats (📊)
- Profil (👤)

Der Leaderboard-Screen ist als Modal über den Stack Navigator erreichbar.

## State Management

Redux Toolkit mit Persistenz für:
- Auth-Status
- App-Blocker Regeln
- Statistiken
- Einstellungen

## Theme

Unterstützt Light/Dark Mode über ThemeContext mit:
- Primärfarbe: #00d4aa (Türkis)
- Konsistente Farbpalette für beide Modi
- Dynamische Theme-Wechsel
