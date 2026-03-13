# FocusFlow Backend

Firebase Cloud Functions Backend für die FocusFlow App.

## Features

### Services

- **AppUsageTracker**: Verfolgt und aggregiert App-Nutzungsdaten
- **LeaderboardService**: Verwaltet Ranglisten für verschiedene Kategorien
- **PushNotificationService**: Sendet Push-Benachrichtigungen via FCM
- **BadgeVerificationSystem**: Überprüft und vergibt Badges

### Cloud Functions

#### Firestore Triggers
- `onUserStatsUpdate` - Aktualisiert Ranglisten bei Statistik-Änderungen
- `onFocusSessionComplete` - Verarbeitet abgeschlossene Fokus-Sessions
- `onDailyStatsUpdate` - Aktualisiert tägliche Statistiken
- `onUserCreate` - Initialisiert neue Benutzer
- `onBlockedAttempt` - Verarbeitet blockierte App-Versuche

#### Scheduled Functions
- `dailySummaryNotification` - Tägliche Zusammenfassung (21:00)
- `streakReminderCheck` - Streak-Erinnerungen (20:00)
- `dailyLeaderboardUpdate` - Ranglisten-Update (00:00)
- `weeklyChallengeReset` - Wöchentliche Challenge-Reset (Montag 00:00)
- `cleanupOldLogs` - Bereinigung alter Logs (02:00)
- `processQueuedNotifications` - Verarbeitet wartende Benachrichtigungen
- `dailyBadgeCheck` - Überprüft Badge-Fortschritt (06:00)

#### HTTP Callable Functions
- `registerFcmToken` - Registriert FCM-Token
- `unregisterFcmToken` - Entfernt FCM-Token
- `getLeaderboard` - Ruft Rangliste ab
- `logAppUsage` - Protokolliert App-Nutzung
- `getUserBadges` - Ruft Benutzer-Badges ab
- `checkBadges` - Überprüft Badge-Berechtigung
- `subscribeToTopic` / `unsubscribeFromTopic` - Topic-Verwaltung
- `updateNotificationPreferences` - Aktualisiert Benachrichtigungseinstellungen
- `getDailyStats` / `getWeeklyStats` - Ruft Statistiken ab

## Installation

```bash
cd backend/functions
npm install
```

## Entwicklung

```bash
# TypeScript kompilieren
npm run build

# Tests ausführen
npm test

# Linting
npm run lint
```

## Deployment

```bash
# Firebase Login (einmalig)
npx firebase login

# Deploy Functions
npm run deploy
```

## Projektstruktur

```
backend/
├── firebase.json          # Firebase Konfiguration
├── firestore.rules        # Firestore Sicherheitsregeln
├── firestore.indexes.json # Firestore Indizes
└── functions/
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.js
    ├── src/
    │   ├── index.ts                    # Hauptexport
    │   ├── config/
    │   │   └── firebase.ts             # Firebase Initialisierung
    │   ├── services/
    │   │   ├── appUsageTracker.ts      # Nutzungs-Tracking
    │   │   ├── leaderboardService.ts   # Ranglisten-Logik
    │   │   ├── pushNotificationService.ts # Push-Benachrichtigungen
    │   │   └── badgeVerificationSystem.ts # Badge-System
    │   └── triggers/
    │       ├── firestoreTriggers.ts    # Firestore Trigger
    │       ├── scheduledTriggers.ts    # Zeitgesteuerte Funktionen
    │       └── httpFunctions.ts        # HTTP Callable Functions
    └── __tests__/
        ├── setup.ts
        ├── appUsageTracker.test.ts
        ├── leaderboardService.test.ts
        ├── pushNotificationService.test.ts
        └── badgeVerificationSystem.test.ts
```

## Umgebungsvariablen

Erstelle eine `.env` Datei in `functions/`:

```
FIREBASE_CONFIG={...}
GCLOUD_PROJECT=your-project-id
```

## Lizenz

MIT
