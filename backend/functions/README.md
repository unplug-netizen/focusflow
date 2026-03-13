/**
 * README für FocusFlow Backend
 * 
 * Firebase Cloud Functions Backend für die FocusFlow App
 */

# FocusFlow Backend

Dieses Verzeichnis enthält die Firebase Cloud Functions für das FocusFlow Backend.

## Struktur

```
backend/functions/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin Konfiguration
│   ├── services/
│   │   ├── analyticsService.ts   # Analytics und Reports
│   │   ├── appUsageTracker.ts    # App-Nutzungs-Tracking
│   │   ├── badgeVerificationSystem.ts  # Badge-System
│   │   ├── challengeService.ts   # Wöchentliche Challenges
│   │   ├── leaderboardService.ts # Ranglisten-Verwaltung
│   │   └── pushNotificationService.ts  # Push-Benachrichtigungen
│   ├── triggers/
│   │   ├── additionalFunctions.ts  # Zusätzliche HTTP Functions
│   │   ├── firestoreTriggers.ts    # Firestore Trigger
│   │   ├── httpFunctions.ts        # HTTP Callable Functions
│   │   └── scheduledTriggers.ts    # Zeitgesteuerte Functions
│   └── index.ts                    # Haupt-Export
├── __tests__/                      # Test-Dateien
│   ├── functions.test.ts
│   ├── services.test.ts
│   └── setup.ts
├── package.json
└── tsconfig.json
```

## Services

### LeaderboardService
Verwaltet Ranglisten für verschiedene Kategorien:
- `screen_time` - Weniger Bildschirmzeit = höherer Score
- `focus_time` - Mehr Fokuszeit = höherer Score
- `badges` - Anzahl und Wert der Badges
- `streak` - Aktuelle Streak-Länge
- `weekly_challenge` - Wöchentliche Challenge-Punkte

### PushNotificationService
Sendet Push-Benachrichtigungen via Firebase Cloud Messaging:
- Streak-Erinnerungen
- Badge-Freischaltungen
- Ranglisten-Updates
- Tägliche Zusammenfassungen
- Limit-Warnungen

### AppUsageTracker
Trackt und aggregiert App-Nutzungsdaten:
- Tägliche Nutzungsstatistiken
- Wöchentliche Übersichten
- Limit-Überschreitungs-Prüfung
- Automatische Bereinigung alter Logs

### BadgeVerificationSystem
Verwaltet das Badge-System mit 11 vordefinierten Badges:
- Streak-Badges (7, 30, 100 Tage)
- Focus King (100 Stunden Fokus)
- Social Detox (1 Woche ohne Social Media)
- Digital Sabbath (24 Stunden offline)
- Sleep Champion (30 Tage Schlafenszeit)
- Early Bird (Kein Social Media vor 8 Uhr)
- Weekend Warrior (Wochenende ohne Mobile Games)
- Time Saver / Master Saver (10/100 Stunden gespart)

### ChallengeService
Verwaltet wöchentliche Challenges:
- Automatische Erstellung jede Woche
- 3 zufällige Challenges aus 7 Vorlagen
- Fortschritts-Tracking
- Belohnungs-System

### AnalyticsService
Generiert Analytics und Insights:
- Tägliche Reports
- User-Produktivitäts-Scores
- Kategorie-basierte Analytics
- Retention-Metriken

## Cloud Functions

### Firestore Triggers
- `onUserStatsUpdate` - Reagiert auf User-Statistik-Updates
- `onFocusSessionComplete` - Verarbeitet abgeschlossene Fokus-Sessions
- `onDailyStatsUpdate` - Aktualisiert tägliche Statistiken
- `onUserCreate` - Initialisiert neue User
- `onBlockedAttempt` - Verarbeitet blockierte App-Zugriffe

### HTTP Callable Functions
- `registerFcmToken` / `unregisterFcmToken` - FCM Token-Verwaltung
- `getLeaderboard` - Rangliste abrufen
- `logAppUsage` - App-Nutzung loggen
- `getUserBadges` / `checkBadges` - Badge-Verwaltung
- `subscribeToTopic` / `unsubscribeFromTopic` - Topic-Abonnements
- `updateNotificationPreferences` - Benachrichtigungseinstellungen
- `getDailyStats` / `getWeeklyStats` - Statistiken abrufen
- `getUserProfile` / `updateUserProfile` - Profil-Verwaltung
- `startFocusSession` / `completeFocusSession` - Fokus-Sessions
- `logBlockedAttempt` - Blockierte Versuche loggen
- `getAllRanks` / `getFriendsLeaderboard` - Rang-Informationen
- `sendTestNotification` - Test-Benachrichtigung senden
- `getAppInsights` - App-Nutzungs-Insights

### Scheduled Functions
- `dailySummaryNotification` - Tägliche Zusammenfassung (21:00)
- `streakReminderCheck` - Streak-Erinnerungen (20:00)
- `dailyLeaderboardUpdate` - Ranglisten-Update (Mitternacht)
- `weeklyChallengeReset` - Wöchentliche Challenge-Reset (Montag)
- `cleanupOldLogs` - Alte Logs bereinigen (02:00)
- `processQueuedNotifications` - Warteschlangen-Verarbeitung (stündlich)
- `dailyBadgeCheck` - Badge-Überprüfung (06:00)

## Entwicklung

### Installation
```bash
cd backend/functions
npm install
```

### Build
```bash
npm run build
```

### Tests
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Deployment
```bash
firebase deploy --only functions
```

## Umgebungsvariablen

Stelle sicher, dass folgende Umgebungsvariablen gesetzt sind:
- `FIREBASE_PROJECT_ID` - Firebase Projekt ID
- `FIREBASE_SERVICE_ACCOUNT` - Service Account JSON (optional für lokal)

## Lizenz

MIT
