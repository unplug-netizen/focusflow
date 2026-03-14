# FocusFlow Backend

Firebase Cloud Functions Backend für die FocusFlow App.

## Features

### Services
- **LeaderboardService** - Ranglisten-Verwaltung mit 5 Kategorien
- **PushNotificationService** - FCM Push-Benachrichtigungen
- **AppUsageTracker** - App-Nutzungs-Tracking und Statistiken
- **BadgeVerificationSystem** - Badge-Freischaltung und -Verifikation
- **AnalyticsService** - Detaillierte Analytics und Einblicke
- **ChallengeService** - Wöchentliche Challenges und Belohnungen

### Cloud Functions

#### Firestore Triggers
- `onUserStatsUpdate` - Aktualisiert Ranglisten bei Statistik-Änderungen
- `onFocusSessionComplete` - Verarbeitet abgeschlossene Fokus-Sitzungen
- `onDailyStatsUpdate` - Aktualisiert tägliche Statistiken
- `onUserCreate` - Initialisiert neue Benutzer
- `onBlockedAttempt` - Verarbeitet blockierte App-Zugriffe

#### Scheduled Functions
- `dailySummaryNotification` - Tägliche Zusammenfassung (21:00)
- `streakReminderCheck` - Streak-Erinnerungen (20:00)
- `dailyLeaderboardUpdate` - Tägliche Ranglisten-Aktualisierung (00:00)
- `weeklyChallengeReset` - Wöchentliche Challenge-Rücksetzung (Montag 00:00)
- `cleanupOldLogs` - Bereinigung alter Logs (02:00)
- `processQueuedNotifications` - Verarbeitung wartender Benachrichtigungen
- `dailyBadgeCheck` - Tägliche Badge-Überprüfung (06:00)

#### HTTP Callable Functions
- `registerFcmToken` / `unregisterFcmToken` - FCM Token-Verwaltung
- `getLeaderboard` - Rangliste abrufen
- `logAppUsage` - App-Nutzung protokollieren
- `getUserBadges` / `checkBadges` - Badge-Verwaltung
- `subscribeToTopic` / `unsubscribeFromTopic` - Topic-Abonnements
- `updateNotificationPreferences` - Benachrichtigungseinstellungen
- `getDailyStats` / `getWeeklyStats` - Statistiken abrufen
- `getUserProfile` / `updateUserProfile` - Profil-Verwaltung
- `startFocusSession` / `completeFocusSession` - Fokus-Sitzungen
- `logBlockedAttempt` - Blockierte Zugriffe protokollieren
- `getAllRanks` / `getFriendsLeaderboard` - Ranglisten
- `sendTestNotification` - Test-Benachrichtigungen
- `getAppInsights` - App-Einblicke

## Installation

```bash
cd backend/functions
npm install
```

## Scripts

```bash
npm run build          # TypeScript kompilieren
npm run build:watch    # TypeScript im Watch-Modus
npm run serve          # Emulator starten
npm run shell          # Functions Shell
npm run deploy         # Zu Firebase deployen
npm run logs           # Logs anzeigen
npm run test           # Tests ausführen
npm run test:watch     # Tests im Watch-Modus
npm run test:coverage  # Tests mit Coverage
npm run lint           # ESLint prüfen
```

## Tests

Alle 165 Tests bestehen erfolgreich:

```bash
npm test
```

Test-Suites:
- `leaderboardService.test.ts` - Leaderboard Service Tests
- `pushNotificationService.test.ts` - Push Notification Tests
- `appUsageTracker.test.ts` - App Usage Tracking Tests
- `badgeVerificationSystem.test.ts` - Badge System Tests
- `functions.test.ts` - Cloud Functions Tests
- `triggers.test.ts` - Firestore Trigger Tests
- `httpFunctions.test.ts` - HTTP Function Tests
- `services.test.ts` - Service Integration Tests

## Projektstruktur

```
backend/functions/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin Konfiguration
│   ├── services/
│   │   ├── leaderboardService.ts
│   │   ├── pushNotificationService.ts
│   │   ├── appUsageTracker.ts
│   │   ├── badgeVerificationSystem.ts
│   │   ├── analyticsService.ts
│   │   └── challengeService.ts
│   ├── triggers/
│   │   ├── firestoreTriggers.ts
│   │   ├── scheduledTriggers.ts
│   │   ├── httpFunctions.ts
│   │   └── additionalFunctions.ts
│   └── index.ts                 # Hauptexporte
├── __tests__/                   # Test-Dateien
├── lib/                         # Kompilierte JavaScript-Dateien
├── package.json
├── tsconfig.json
└── jest.config.js
```

## API-Dokumentation

Siehe [API.md](./API.md) für detaillierte API-Dokumentation.

## Umgebungsvariablen

Erstelle eine `.env` Datei:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Deployment

```bash
# Login
firebase login

# Deploy
npm run deploy

# Oder nur Functions
firebase deploy --only functions
```

## Lizenz

MIT
