# FocusFlow Backend - API Dokumentation

## HTTP Callable Functions

### registerFcmToken
Registriert einen FCM-Token für Push-Benachrichtigungen.

**Request:**
```json
{
  "token": "fcm_token_string",
  "platform": "android" | "ios"
}
```

**Response:**
```json
{
  "success": true
}
```

### getLeaderboard
Ruft die Rangliste für eine Kategorie ab.

**Request:**
```json
{
  "category": "screen_time" | "focus_time" | "badges" | "streak" | "weekly_challenge",
  "limit": 100
}
```

**Response:**
```json
{
  "entries": [
    {
      "userId": "string",
      "displayName": "string",
      "photoURL": "string?",
      "score": 100,
      "streak": 5,
      "rank": 1
    }
  ],
  "userRank": 5,
  "totalParticipants": 100
}
```

### logAppUsage
Protokolliert App-Nutzung.

**Request:**
```json
{
  "packageName": "com.example.app",
  "appName": "Example App",
  "usageTime": 30,
  "category": "social" | "entertainment" | "productivity" | "communication" | "games" | "shopping" | "other",
  "isBlocked": false
}
```

### getUserBadges
Ruft alle Badges eines Benutzers ab.

**Response:**
```json
{
  "badges": [
    {
      "badgeId": "streak_7",
      "unlockedAt": "2024-01-01T00:00:00Z",
      "progress": 7,
      "maxProgress": 7
    }
  ]
}
```

### updateNotificationPreferences
Aktualisiert Benachrichtigungseinstellungen.

**Request:**
```json
{
  "streakReminders": true,
  "achievementNotifications": true,
  "leaderboardUpdates": true,
  "dailySummary": true,
  "challengeReminders": true,
  "limitWarnings": true,
  "focusReminders": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

## Firestore Datenstruktur

### users/{userId}
```typescript
{
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isAnonymous: boolean;
  currentStreak: number;
  longestStreak: number;
  focusCoins: number;
  totalBlockedTime: number;
  badges: Badge[];
}
```

### users/{userId}/appUsage/{usageId}
```typescript
{
  packageName: string;
  appName: string;
  usageTime: number;
  category: string;
  isBlocked: boolean;
  timestamp: Timestamp;
  date: string; // YYYY-MM-DD
}
```

### users/{userId}/usageStats/{date}
```typescript
{
  date: string;
  totalScreenTime: number;
  appBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  blockedAttempts: number;
  lastUpdated: Timestamp;
}
```

### leaderboard/{category}/entries/{userId}
```typescript
{
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  streak: number;
  updatedAt: Timestamp;
}
```

## Badges

| ID | Name | Beschreibung | Tier | Belohnung |
|----|------|--------------|------|-----------|
| streak_7 | Week Warrior | 7 Tage ohne blockierte Apps | Bronze | 50 |
| streak_30 | Month Master | 30 Tage ohne blockierte Apps | Silber | 200 |
| streak_100 | Centurion | 100 Tage Streak | Gold | 500 |
| focus_king | Focus King | 100 Stunden Fokus-Modus | Platin | 1000 |
| social_detox_7 | Social Detox | 1 Woche ohne Social Media | Silber | 150 |
| digital_sabbath | Digital Sabbath | 24 Stunden offline | Gold | 300 |
| sleep_champion | Sleep Champion | 30 Tage Schlafenszeit | Gold | 300 |
| early_bird | Early Bird | 7 Tage kein Social Media vor 8 Uhr | Bronze | 50 |
| weekend_warrior | Weekend Warrior | Wochenende ohne Mobile Games | Silber | 100 |
| time_saver | Time Saver | 10 Stunden gespart | Bronze | 75 |
| master_saver | Master Saver | 100 Stunden gespart | Gold | 500 |
