# FocusFlow Backend

Firebase Cloud Functions Backend für die FocusFlow App.

## Features

### Core Services

- **LeaderboardService**: Verwaltung von Ranglisten in verschiedenen Kategorien
- **PushNotificationService**: Push-Benachrichtigungen via FCM
- **AppUsageTracker**: Tracking und Aggregation von App-Nutzungsdaten
- **BadgeVerificationSystem**: Badge-System mit Freischalt-Logik
- **AnalyticsService**: Detaillierte Analytics und Produktivitätsmetriken
- **ChallengeService**: Wöchentliche Challenges und Gamification

### Cloud Functions

#### Firestore Triggers
- `onUserStatsUpdate`: Aktualisiert Ranglisten bei User-Änderungen
- `onFocusSessionComplete`: Verarbeitet abgeschlossene Fokus-Sitzungen
- `onDailyStatsUpdate`: Aktualisiert Screen-Time-Statistiken
- `onUserCreate`: Initialisiert neue User mit Default-Einstellungen
- `onBlockedAttempt`: Reagiert auf blockierte App-Versuche

#### Scheduled Functions
- `dailySummaryNotification`: Tägliche Zusammenfassung (21:00)
- `streakReminderCheck`: Streak-Erinnerungen (20:00)
- `dailyLeaderboardUpdate`: Tägliche Ranglisten-Aktualisierung (00:00)
- `weeklyChallengeReset`: Wöchentlicher Challenge-Reset (Montag 00:00)
- `cleanupOldLogs`: Bereinigung alter Logs (02:00)
- `processQueuedNotifications`: Verarbeitung wartender Benachrichtigungen
- `dailyBadgeCheck`: Tägliche Badge-Überprüfung (06:00)

#### HTTP Callable Functions

##### Authentication
- `registerFcmToken`: Registriert FCM Token für Push
- `unregisterFcmToken`: Entfernt FCM Token
- `subscribeToTopic`: Abonniert ein Benachrichtigungs-Topic
- `unsubscribeFromTopic`: Deabonniert ein Topic

##### User Profile
- `getUserProfile`: Lädt komplettes User-Profil mit Statistiken
- `updateUserProfile`: Aktualisiert User-Daten
- `updateNotificationPreferences`: Aktualisiert Benachrichtigungs-Einstellungen

##### Focus Sessions
- `startFocusSession`: Startet eine neue Fokus-Sitzung
- `completeFocusSession`: Beendet eine Fokus-Sitzung
- `logBlockedAttempt`: Protokolliert blockierten App-Zugriff

##### Leaderboards
- `getLeaderboard`: Lädt Rangliste für eine Kategorie
- `getAllRanks`: Lädt alle User-Ränge
- `getFriendsLeaderboard`: Rangliste mit Freunden

##### Stats & Analytics
- `getDailyStats`: Tägliche Nutzungsstatistiken
- `getWeeklyStats`: Wöchentliche Nutzungsstatistiken
- `getAppInsights`: Detaillierte App-Nutzungs-Einblicke

##### Badges
- `getUserBadges`: Lädt Badge-Fortschritt
- `checkBadges`: Überprüft und vergibt neue Badges

##### Challenges
- `getActiveChallenges`: Lädt aktuelle Challenges
- `updateChallengeProgress`: Aktualisiert Challenge-Fortschritt
- `claimChallengeReward`: Löst Challenge-Belohnung ein

##### Testing
- `sendTestNotification`: Sendet Test-Benachrichtigung
- `logAppUsage`: Protokolliert App-Nutzung

## Installation

```bash
cd backend/functions
npm install
```

## Entwicklung

```bash
# Build
npm run build

# Watch Mode
npm run build:watch

# Lokaler Emulator
npm run serve

# Tests
npm test

# Linting
npm run lint
```

## Deployment

```bash
# Deploy all functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:functionName
```

## Umgebungsvariablen

Erstelle eine `.env` Datei:

```
FIREBASE_PROJECT_ID=your-project-id
```

## Projektstruktur

```
backend/functions/
├── src/
│   ├── index.ts                    # Hauptexporte
│   ├── config/
│   │   └── firebase.ts             # Firebase Initialisierung
│   ├── services/
│   │   ├── leaderboardService.ts   # Ranglisten-Logik
│   │   ├── pushNotificationService.ts  # Push-Benachrichtigungen
│   │   ├── appUsageTracker.ts      # Nutzungs-Tracking
│   │   ├── badgeVerificationSystem.ts  # Badge-System
│   │   ├── analyticsService.ts     # Analytics
│   │   └── challengeService.ts     # Challenges
│   └── triggers/
│       ├── firestoreTriggers.ts    # Firestore Trigger
│       ├── scheduledTriggers.ts    # Zeitgesteuerte Funktionen
│       ├── httpFunctions.ts        # HTTP Callable Functions
│       └── additionalFunctions.ts  # Erweiterte Functions
├── __tests__/                      # Test-Dateien
└── package.json
```

## API-Dokumentation

### Leaderboard Categories

- `screen_time`: Weniger Screen Time = höherer Score
- `focus_time`: Mehr Fokus-Zeit = höherer Score
- `badges`: Basierend auf freigeschalteten Badges
- `streak`: Aktuelle Streak-Länge
- `weekly_challenge`: Wöchentliche Challenge-Punkte

### Badge Tiers

- Bronze: 10 Punkte
- Silver: 25 Punkte
- Gold: 50 Punkte
- Platinum: 100 Punkte

### Notification Types

- `streak_reminder`: Streak-Erinnerung
- `achievement_unlocked`: Badge freigeschaltet
- `leaderboard_update`: Ranglisten-Update
- `daily_summary`: Tägliche Zusammenfassung
- `challenge_reminder`: Challenge-Erinnerung
- `limit_warning`: Zeitlimit-Warnung
- `focus_reminder`: Fokus-Erinnerung
- `system`: System-Benachrichtigungen

## Lizenz

MIT
