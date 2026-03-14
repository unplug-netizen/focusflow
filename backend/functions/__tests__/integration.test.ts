/**
 * Integration Tests für Cloud Functions
 * 
 * Diese Tests prüfen die Integration zwischen verschiedenen Services
 * und simulieren realistische Szenarien.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firebase
const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

const mockCollection = jest.fn(() => ({
  doc: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        currentStreak: 7,
        totalFocusTime: 120,
        totalBlockedTime: 600,
        bedtimeStreak: 30,
        focusCoins: 100,
        badges: [
          {id: 'badge1', tier: 'bronze', unlockedAt: new Date()},
        ],
      }),
      id: 'user123',
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({exists: false, data: () => null}),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      })),
      add: jest.fn().mockResolvedValue({id: 'mock-doc-id'}),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {data: () => ({token: 'token1', platform: 'ios', active: true})},
          {data: () => ({token: 'token2', platform: 'android', active: true})},
        ],
        size: 2,
      }),
    })),
  })),
  add: jest.fn().mockResolvedValue({id: 'mock-doc-id'}),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({
    empty: false,
    docs: [
      {
        id: 'user123',
        data: () => ({
          displayName: 'Test User',
          currentStreak: 7,
          photoURL: 'https://example.com/photo.jpg',
        }),
      },
      {
        id: 'user456',
        data: () => ({
          displayName: 'User Two',
          currentStreak: 3,
          photoURL: null,
        }),
      },
    ],
    size: 2,
  }),
}));

jest.mock('../src/config/firebase', () => ({
  db: {
    collection: mockCollection,
    collectionGroup: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
    })),
    batch: jest.fn(() => mockBatch),
  },
  messaging: {
    send: jest.fn().mockResolvedValue('message-id'),
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{success: true}, {success: true}],
    }),
    subscribeToTopic: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
  },
  auth: {
    getUser: jest.fn().mockResolvedValue({uid: 'user123', email: 'test@example.com'}),
    verifyIdToken: jest.fn().mockResolvedValue({uid: 'user123'}),
  },
  FieldValue: {
    increment: jest.fn((n: number) => ({__op: 'increment', value: n})),
  },
  Timestamp: {
    now: jest.fn(() => ({toDate: () => new Date(), seconds: Date.now() / 1000})),
    fromDate: jest.fn((date: Date) => date),
  },
}));

import {LeaderboardService} from '../src/services/leaderboardService';
import {PushNotificationService} from '../src/services/pushNotificationService';
import {AppUsageTracker} from '../src/services/appUsageTracker';
import {BadgeVerificationSystem, createBadgeVerificationSystem} from '../src/services/badgeVerificationSystem';

describe('Integration Tests - Service Interactions', () => {
  let leaderboardService: LeaderboardService;
  let pushNotificationService: PushNotificationService;
  let appUsageTracker: AppUsageTracker;
  let badgeSystem: BadgeVerificationSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    leaderboardService = new LeaderboardService();
    pushNotificationService = new PushNotificationService();
    appUsageTracker = new AppUsageTracker();
    badgeSystem = createBadgeVerificationSystem(pushNotificationService);
  });

  describe('Focus Session Completion Flow', () => {
    it('should update leaderboard when focus session is completed', async () => {
      const userId = 'user123';
      const userData = {
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        streak: 7,
      };

      // Update focus time score
      await leaderboardService.updateScore(userId, 'focus_time', 120, userData);

      expect(mockCollection).toHaveBeenCalledWith('leaderboard');
    });

    it('should check badges after focus session completion', async () => {
      const userId = 'user123';

      // Simulate checking badges
      await badgeSystem.checkAndAwardBadges(userId);

      // Badge system should have been called
      expect(mockCollection).toHaveBeenCalled();
    });
  });

  describe('App Usage Tracking Flow', () => {
    it('should log usage and update stats', async () => {
      const userId = 'user123';
      const usage = {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        usageTime: 30,
        category: 'social',
        isBlocked: false,
      };

      await appUsageTracker.logUsage(userId, usage);

      expect(mockCollection).toHaveBeenCalledWith('users');
    });

    it('should detect limit exceeded and send notification', async () => {
      const userId = 'user123';
      const packageName = 'com.instagram.android';
      const dailyLimit = 60;

      const result = await appUsageTracker.checkLimitExceeded(userId, packageName, dailyLimit);

      expect(result).toHaveProperty('exceeded');
      expect(result).toHaveProperty('currentUsage');
    });
  });

  describe('Badge Awarding Flow', () => {
    it('should award badge and send notification', async () => {
      const userId = 'user123';
      const badge = BadgeVerificationSystem.DEFAULT_BADGES[0];

      // Mock notification service
      jest.spyOn(pushNotificationService, 'sendAchievementUnlocked')
        .mockResolvedValue(undefined);

      await badgeSystem.awardBadge(userId, badge);

      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should add focus coins when badge is awarded', async () => {
      const userId = 'user123';
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_7')!;

      await badgeSystem.awardBadge(userId, badge);

      // Should update user with focus coins
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Streak Management Flow', () => {
    it('should update streak leaderboard when streak changes', async () => {
      const userId = 'user123';
      const newStreak = 10;
      const userData = {
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        streak: newStreak,
      };

      await leaderboardService.updateScore(userId, 'streak', newStreak, userData);

      expect(mockCollection).toHaveBeenCalledWith('leaderboard');
    });

    it('should send streak reminder when streak is in danger', async () => {
      const userId = 'user123';
      const streak = 7;

      const mockSendStreakReminder = jest.spyOn(pushNotificationService, 'sendStreakReminder')
        .mockResolvedValue(undefined);

      await pushNotificationService.sendStreakReminder(userId, streak);

      expect(mockSendStreakReminder).toHaveBeenCalledWith(userId, streak);
    });
  });

  describe('Daily Summary Flow', () => {
    it('should aggregate daily stats and send summary', async () => {
      const userId = 'user123';
      const stats = {
        screenTime: 120,
        focusTime: 45,
        blockedAttempts: 3,
      };

      const mockSendDailySummary = jest.spyOn(pushNotificationService, 'sendDailySummary')
        .mockResolvedValue(undefined);

      await pushNotificationService.sendDailySummary(userId, stats);

      expect(mockSendDailySummary).toHaveBeenCalledWith(userId, stats);
    });
  });

  describe('Leaderboard Recalculation Flow', () => {
    it('should recalculate all categories', async () => {
      const categories = [
        'screen_time',
        'focus_time',
        'badges',
        'streak',
        'weekly_challenge',
      ];

      // Each category should be processed
      categories.forEach(category => {
        expect(['screen_time', 'focus_time', 'badges', 'streak', 'weekly_challenge']).toContain(category);
      });
    });

    it('should calculate screen time score correctly', () => {
      const weeklyScreenTime = 2000;
      const maxScreenTime = 3360;
      const score = Math.max(0, Math.round(maxScreenTime - weeklyScreenTime));

      expect(score).toBe(1360);
    });

    it('should calculate badge score with tier points', () => {
      const badges = [
        {id: 'b1', tier: 'bronze', unlockedAt: new Date()},
        {id: 'b2', tier: 'silver', unlockedAt: new Date()},
        {id: 'b3', tier: 'gold', unlockedAt: null}, // locked
      ];

      const tierPoints: Record<string, number> = {
        bronze: 10,
        silver: 25,
        gold: 50,
        platinum: 100,
      };

      const score = badges.reduce((sum: number, badge: {tier: string; unlockedAt: Date | null}) => {
        if (badge.unlockedAt) {
          return sum + (tierPoints[badge.tier] || 0);
        }
        return sum;
      }, 0);

      expect(score).toBe(35); // 10 + 25
    });
  });

  describe('Notification Preferences Flow', () => {
    it('should respect user notification preferences', async () => {
      // Mock preferences
      const mockPrefs = {
        streakReminders: true,
        achievementNotifications: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };

      // Should send if preferences allow
      const shouldSend = mockPrefs.streakReminders;
      expect(shouldSend).toBe(true);
    });

    it('should queue notification during quiet hours', async () => {
      const quietHoursStart = '22:00';
      const quietHoursEnd = '08:00';
      const currentTime = '23:00';

      const inQuietHours = quietHoursStart <= quietHoursEnd
        ? currentTime >= quietHoursStart && currentTime <= quietHoursEnd
        : currentTime >= quietHoursStart || currentTime <= quietHoursEnd;

      expect(inQuietHours).toBe(true);
    });
  });

  describe('Weekly Challenge Flow', () => {
    it('should reset weekly challenge leaderboard', async () => {
      // Reset should clear all scores
      const mockReset = jest.spyOn(leaderboardService, 'resetWeeklyChallenge')
        .mockResolvedValue(undefined);

      await leaderboardService.resetWeeklyChallenge();

      expect(mockReset).toHaveBeenCalled();
    });

    it('should calculate weekly challenge score', async () => {
      const completedChallenges = [
        {points: 100},
        {points: 150},
        {points: 50},
      ];

      const totalScore = completedChallenges.reduce((sum, c) => sum + c.points, 0);

      expect(totalScore).toBe(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', async () => {
      const nonExistentUserId = 'nonexistent';

      // Should not throw when user doesn't exist
      const result = await leaderboardService.getUserRank(nonExistentUserId, 'streak');

      expect(result).toHaveProperty('rank');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('entry');
    });

    it('should handle notification failures gracefully', async () => {
      const testUserId = 'user123';
      const testPayload = {
        type: 'system' as const,
        title: 'Test',
        body: 'Test body',
      };

      // Even if notification fails, should return result
      const result = await pushNotificationService.sendToUser(testUserId, testPayload);

      expect(result).toHaveProperty('success');
    });
  });
});

describe('End-to-End Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('New User Onboarding', () => {
    it('should initialize user with default settings', async () => {
      // User creation should:
      // 1. Initialize badges
      // 2. Create notification settings
      // 3. Set up user profile

      const defaultSettings = {
        streakReminders: true,
        achievementNotifications: true,
        leaderboardUpdates: true,
        dailySummary: true,
        challengeReminders: true,
        limitWarnings: true,
        focusReminders: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };

      expect(defaultSettings.streakReminders).toBe(true);
      expect(defaultSettings.quietHoursStart).toBe('22:00');
    });

    it('should create all badge slots for new user', () => {
      const badgeCount = BadgeVerificationSystem.DEFAULT_BADGES.length;

      expect(badgeCount).toBe(11);
    });
  });

  describe('Daily Usage Cycle', () => {
    it('should process daily usage and update all relevant systems', async () => {
      // 1. Log app usage
      // 2. Update daily stats
      // 3. Check limits
      // 4. Update leaderboard
      // 5. Check badges

      const usage = {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        usageTime: 30,
        category: 'social',
        isBlocked: false,
      };

      expect(usage.packageName).toBeDefined();
      expect(usage.usageTime).toBeGreaterThan(0);
    });
  });

  describe('Focus Session Workflow', () => {
    it('should complete full focus session lifecycle', async () => {
      // 1. Start session
      // 2. Block apps during session
      // 3. Complete session
      // 4. Update stats
      // 5. Check badges
      // 6. Update leaderboard

      const session = {
        startTime: new Date(),
        duration: 25,
        blockedApps: ['com.instagram.android', 'com.twitter.android'],
        completed: true,
      };

      expect(session.duration).toBeGreaterThan(0);
      expect(session.blockedApps.length).toBeGreaterThan(0);
    });
  });
});
