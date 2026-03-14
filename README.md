# FocusFlow Mobile App

Eine React Native App zur Förderung von digitalem Wohlbefinden durch App-Blocking, Fokus-Modus und Gamification.

## Features

### Screens
- **HomeScreen** - Dashboard mit Tagesziel, Statistiken, aktiven Sperren und Badges
- **AppBlockerScreen** - App-Liste mit Kategorien, Sperr-Funktion und Regelverwaltung
- **FocusModeScreen** - Pomodoro-Timer mit verschiedenen Modi (Fokus, kurze/lange Pause)
- **StatsScreen** - Detaillierte Statistiken mit Diagrammen und Badge-Fortschritt
- **LeaderboardScreen** - Rangliste mit Podium und Kategorie-Filter
- **ProfileScreen** - Benutzereinstellungen, Badges und Konto-Verwaltung
- **LoginScreen** - Authentifizierung mit E-Mail oder anonym
- **LoadingScreen** - Ladebildschirm

### UI-Komponenten
- **Button** - Primär, Sekundär, Outline, Ghost Varianten
- **Card** - Container mit anpassbarem Padding und Elevation
- **Input** - Texteingabe mit Label, Icons und Fehleranzeige
- **Timer** - Kreis-Timer mit Fortschrittsanzeige
- **ProgressBar** - Animierter Fortschrittsbalken
- **BadgeCard** - Badge-Anzeige mit Freischalt-Status
- **StatCard** - Statistik-Karte mit Trend-Indikatoren
- **AppUsageCard** - App-Nutzungs-Anzeige mit Block-Button
- **LeaderboardItem** - Ranglisten-Eintrag
- **Charts** - Balken-, Linien- und Tortendiagramme
- **FloatingActionButton** - Animierter FAB
- **Header** - Navigation-Header mit Zurück-Button
- **EmptyState** - Leer-Zustand mit Icon und Aktion
- **Notification** - Toast-Benachrichtigungen
- **ErrorBoundary** - Fehlerbehandlung

### State Management (Redux)
- **authSlice** - Authentifizierung (Firebase Auth)
- **appBlockerSlice** - App-Sperren und Regeln
- **focusModeSlice** - Timer und Fokus-Sitzungen
- **statsSlice** - Statistiken und Badges
- **leaderboardSlice** - Ranglisten-Daten
- **settingsSlice** - App-Einstellungen

### Theming
- Light/Dark Mode Support
- Konsistente Farbpalette
- Typografie-System

## Technologie-Stack

- React Native 0.73.6
- TypeScript 5.0.4
- Redux Toolkit
- React Navigation (Bottom Tabs + Stack)
- Firebase (Auth, Firestore)
- Redux Persist

## Installation

```bash
npm install
```

## Scripts

```bash
npm run android    # Android-Build starten
npm run ios        # iOS-Build starten
npm run type-check # TypeScript-Prüfung
npm run lint       # ESLint-Prüfung
npm run test       # Tests ausführen
```

## Projektstruktur

```
src/
├── components/    # Wiederverwendbare UI-Komponenten
├── screens/       # App-Screens
├── store/         # Redux Store und Slices
├── theme/         # Theming-Konfiguration
├── types/         # TypeScript-Typen
└── constants/     # App-Konstanten
```

## Lizenz

MIT
