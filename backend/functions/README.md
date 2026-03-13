# FocusFlow Backend

Firebase Cloud Functions Backend für die FocusFlow App.

## Features

### Services

- **LeaderboardService** (`services/leaderboardService.ts`)
  - Verwaltung von Ranglisten in mehreren Kategorien (screen_time, focus_time, badges, streak, weekly_challenge)
  - Automatische Neuberechnung der Ranglisten
  - Benutzerspezifische Rangabfragen

- **PushNotificationService** (`services/pushNotificationService.ts`)
  - FCM Token-Verwaltung
  - Push-Benachrichtigungen für verschiedene Ereignisse
  - Stille Stunden (Quiet Hours) Unterstützung
  - Topic-Abonnements
  - Warteschlangen für verzögerte Zustellung

- **AppUsageTracker** (`services/appUsageTracker.ts`)
  - Protokollierung der App-Nutzung
  - Tägliche und wöchentliche Statistiken
  - Limit-Überprüfung für blockierte Apps
  - Datenbereinigung

- **BadgeVerificationSystem** (`services/badgeVerificationSystem.ts`)
  - 11 vordefinierte Badges (Bronze, Silber, Gold, Platin)
  - Automatische Überprüfung und Vergabe
  - Fortschrittsverfolgung
  - Focus Coins Belohnungen

### Cloud Functions

#### Firestore Triggers
- `onUserStatsUpdate` - Aktualisiert Ranglisten bei Statistik-Änderungen
- `onFocusSessionComplete` - Verarbeitet abgeschlossene Fokus-Sessions
- `onDailyStatsUpdate` - Aktualisiert Bildschirmzeit-Ranglisten
- `onUserCreate` - Initialisiert neue Benutzer
- `onBlockedAttempt` - Reagiert auf blockierte App-Zugriffe

#### Scheduled Functions
- `dailySummaryNotification` - Tägliche Zusammenfassung (21:00 Uhr)
- `streakReminderCheck` - Streak-Erinnerungen (20:00 Uhr)
- `dailyLeaderboardUpdate` - Tägliche Ranglisten-Aktualisierung (Mitternacht)
- `weeklyChallengeReset` - Wöchentliche Challenge-Rücksetzung (Montag)
- `cleanupOldLogs` - Bereinigung alter Logs (02:00 Uhr)
- `processQueuedNotifications` - Verarbeitung wartender Benachrichtigungen (stündlich)
- `dailyBadgeCheck` - Tägliche Badge-Überprüfung (06:00 Uhr)

#### HTTP Callable Functions
- `registerFcmToken` / `unregisterFcmToken` - FCM Token-Verwaltung
- `getLeaderboard` - Rangliste abrufen
- `logAppUsage` - App-Nutzung protokollieren
- `getUserBadges` / `checkBadges` - Badge-Verwaltung
- `subscribeToTopic` / `unsubscribeFromTopic` - Topic-Abonnements
- `updateNotificationPreferences` - Benachrichtigungseinstellungen
- `getDailyStats` / `getWeeklyStats` - Statistiken abrufen

## Installation

```bash
cd backend/functions
npm install
```

## Entwicklung

```bash
# TypeScript beobachten
npm run build:watch

# Emulator starten
npm run serve

# Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# Linting
npm run lint
```

## Deployment

```bash
# Nur Functions deployen
npm run deploy

# Oder über Firebase CLI
firebase deploy --only functions
```

## Umgebungsvariablen

Erstelle eine `.env` Datei in `backend/functions/`:

```
FIREBASE_PROJECT_ID=dein-project-id
```

## Tests

Die Tests verwenden Jest mit ts-jest. Firebase wird gemockt, um keine echten
Datenbank-Verbindungen zu benötigen.

```bash
npm test
```

## Architektur

```
backend/functions/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin Initialisierung
│   ├── services/
│   │   ├── leaderboardService.ts
│   │   ├── pushNotificationService.ts
│   │   ├── appUsageTracker.ts
│   │   └── badgeVerificationSystem.ts
│   ├── triggers/
│   │   ├── firestoreTriggers.ts
│   │   ├── scheduledTriggers.ts
│   │   └── httpFunctions.ts
│   └── index.ts                 # Export aller Functions
├── __tests__/
│   ├── services.test.ts
│   ├── functions.test.ts
│   └── setup.ts
└── package.json
```

## Badges

| Badge | Name | Beschreibung | Tier | Belohnung |
|-------|------|--------------|------|-----------|
| streak_7 | Week Warrior | 7 Tage Streak | Bronze | 50 |
| streak_30 | Month Master | 30 Tage Streak | Silber | 200 |
| streak_100 | Centurion | 100 Tage Streak | Gold | 500 |
| focus_king | Focus King | 100 Stunden Fokus | Platin | 1000 |
| social_detox_7 | Social Detox | 1 Woche ohne Social Media | Silber | 150 |
| digital_sabbath | Digital Sabbath | 24 Stunden offline | Gold | 300 |
| sleep_champion | Sleep Champion | 30 Tage Schlafenszeit | Gold | 300 |
| early_bird | Early Bird | Kein Social Media vor 8 Uhr | Bronze | 50 |
| weekend_warrior | Weekend Warrior | Wochenende ohne Mobile Games | Silber | 100 |
| time_saver | Time Saver | 10 Stunden gespart | Bronze | 75 |
| master_saver | Master Saver | 100 Stunden gespart | Gold | 500 |

## Lizenz

MIT
