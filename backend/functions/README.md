# FocusFlow Backend

Firebase Cloud Functions Backend für die FocusFlow App.

## Features

### Services
- **LeaderboardService** - Ranglisten-Verwaltung mit 5 Kategorien (Screen Time, Focus Time, Badges, Streak, Weekly Challenge)
- **PushNotificationService** - Push-Benachrichtigungen via Firebase Cloud Messaging
- **AppUsageTracker** - App-Nutzungs-Tracking und Statistik-Aggregation
- **BadgeVerificationSystem** - Badge-Freischalt-Logik mit 11 vordefinierten Badges
- **AnalyticsService** - Nutzungsanalyse und Insights
- **ChallengeService** - Wochen-Challenge-Verwaltung

### Cloud Functions

#### Firestore Triggers
- `onUserStatsUpdate` - Aktualisiert Ranglisten bei User-Änderungen
- `onFocusSessionComplete` - Verarbeitet abgeschlossene Fokus-Sitzungen
- `onDailyStatsUpdate` - Aktualisiert Screen-Time-Rangliste
- `onUserCreate` - Initialisiert neue User (Badges, Einstellungen)
- `onBlockedAttempt` - Reagiert auf blockierte App-Versuche

#### Scheduled Functions
- `dailySummaryNotification` - Tägliche Zusammenfassung (21:00 Uhr)
- `streakReminderCheck` - Streak-Erinnerungen (20:00 Uhr)
- `dailyLeaderboardUpdate` - Ranglisten-Neuberechnung (00:00 Uhr)
- `weeklyChallengeReset` - Wochen-Challenge-Reset (Montag 00:00 Uhr)
- `cleanupOldLogs` - Bereinigung alter Logs (02:00 Uhr)
- `processQueuedNotifications` - Verarbeitet wartende Benachrichtigungen (stündlich)
- `dailyBadgeCheck` - Badge-Überprüfung (06:00 Uhr)

#### HTTP Callable Functions
- `registerFcmToken` / `unregisterFcmToken` - FCM Token-Verwaltung
- `getLeaderboard` - Rangliste abrufen
- `logAppUsage` - App-Nutzung loggen
- `getUserBadges` / `checkBadges` - Badge-Verwaltung
- `subscribeToTopic` / `unsubscribeFromTopic` - Topic-Abonnements
- `updateNotificationPreferences` - Benachrichtigungseinstellungen
- `getDailyStats` / `getWeeklyStats` - Statistiken abrufen
- `getUserProfile` / `updateUserProfile` - Profil-Verwaltung
- `startFocusSession` / `completeFocusSession` - Fokus-Sitzungen
- `logBlockedAttempt` - Blockierte Versuche loggen
- `getAllRanks` / `getFriendsLeaderboard` - Ranglisten-Abfragen
- `sendTestNotification` - Test-Benachrichtigung senden
- `getAppInsights` - App-Nutzungs-Insights

## Technologie-Stack

- Firebase Cloud Functions
- Firebase Admin SDK
- Firebase Cloud Messaging
- TypeScript 5.3.3
- Jest (Testing)

## Installation

```bash
cd backend/functions
npm install
```

## Scripts

```bash
npm run build           # TypeScript kompilieren
npm run build:watch     # TypeScript im Watch-Modus
npm run serve           # Emulator starten
npm run deploy          # Functions deployen
npm run test            # Tests ausführen
npm run test:coverage   # Tests mit Coverage
npm run lint            # ESLint prüfen
```

## Projektstruktur

```
backend/functions/
├── src/
│   ├── config/
│   │   └── firebase.ts       # Firebase Admin Konfiguration
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
│   └── index.ts              # Haupt-Export
├── __tests__/                # Test-Dateien
└── lib/                      # Kompilierte JavaScript-Dateien
```

## Badges

| Badge | Name | Beschreibung | Tier | Reward |
|-------|------|--------------|------|--------|
| streak_7 | Week Warrior | 7 Tage ohne blockierte Apps | Bronze | 50 |
| streak_30 | Month Master | 30 Tage Streak | Silver | 200 |
| streak_100 | Centurion | 100 Tage Streak | Gold | 500 |
| focus_king | Focus King | 100 Stunden Fokus-Modus | Platinum | 1000 |
| social_detox_7 | Social Detox | 1 Woche ohne Social Media | Silver | 150 |
| digital_sabbath | Digital Sabbath | 24 Stunden offline | Gold | 300 |
| sleep_champion | Sleep Champion | 30 Tage Schlafenszeit | Gold | 300 |
| early_bird | Early Bird | 7 Tage kein Social Media vor 8 Uhr | Bronze | 50 |
| weekend_warrior | Weekend Warrior | Wochenende ohne Mobile Games | Silver | 100 |
| time_saver | Time Saver | 10 Stunden gespart | Bronze | 75 |
| master_saver | Master Saver | 100 Stunden gespart | Gold | 500 |

## Umgebungsvariablen

```bash
# Firebase-Projekt konfigurieren
firebase use <project-id>

# Oder via environment
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Deployment

```bash
# Alle Functions deployen
firebase deploy --only functions

# Einzelne Function deployen
firebase deploy --only functions:getLeaderboard
```

## Lizenz

MIT
