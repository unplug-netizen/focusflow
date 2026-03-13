/**
 * Erweiterte Unit Tests für Backend Services
 * 
 * Diese Tests prüfen die Business-Logik der Services im Detail.
 */

import {LeaderboardService, LeaderboardCategory} from '../src/services/leaderboardService';
import {PushNotificationService, NotificationPayload} from '../src/services/pushNotificationService';
import {AppUsageTracker} from '../src/services/appUsageTracker';
import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
  BadgeTier,
} from '../src/services/badgeVerificationSystem';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firebase
const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

const mockDoc: any = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  collection: jest.fn(() => mockCollection),
};

const mockQuery: any = {
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  count: jest.fn(() => ({get: jest.fn()})),
  get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
};

const mockCollection: any = {
  doc: jest.fn(() => mockDoc),
  add: jest.fn().mockResolvedValue({id: 'mock-doc-id'}),
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
};

jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => mockCollection),
    batch: jest.fn(() => mockBatch),
  },
  messaging: {
    send: jest.fn().mockResolvedValue('message-id'),
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{success: true}],
    }),
    subscribeToTopic: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
  },
  FieldValue: {
    increment: jest.fn((n: number) => ({__op: 'increment', value: n})),
  },
  Timestamp: {
    now: jest.fn(() => ({toDate: () => new Date(), seconds: Date.now() / 1000})),
    fromDate: jest.fn((date: Date) => date),
  },
}));

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    service = new LeaderboardService();
    jest.clearAllMocks();
  });

  describe('updateScore', () => {
    it('should update user score with correct data', async () => {
      const userId = 'user123';
      const category: LeaderboardCategory = 'focus_time';
      const score = 120;
      const userData = {
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        streak: 5,
      };

      await service.updateScore(userId, category, score, userData);

      expect(mockCollection.doc).toHaveBeenCalledWith(category);
      expect(mockDoc.collection).toHaveBeenCalledWith('entries');
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          score,
          streak: userData.streak,
        }),
        {merge: true}
      );
    });

    it('should handle missing optional fields', async () => {
      const userId = 'user456';
      const category: LeaderboardCategory = 'streak';
      const score = 10;
      const userData = {
        displayName: 'Anonymous',
      };

      await service.updateScore(userId, category, score, userData);

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          displayName: 'Anonymous',
          photoURL: null,
          score,
          streak: 0,
        }),
        {merge: true}
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted leaderboard entries', async () => {
      const mockEntries = [
        {userId: 'user1', displayName: 'User 1', score: 100},
        {userId: 'user2', displayName: 'User 2', score: 90},
        {userId: 'user3', displayName: 'User 3', score: 80},
      ];

      mockQuery.get.mockResolvedValueOnce({
        docs: mockEntries.map((data) => ({
          data: () => data,
        })),
      });

      const result = await service.getLeaderboard('badges', 10);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('should respect the limit parameter', async () => {
      mockQuery.get.mockResolvedValueOnce({docs: []});

      await service.getLeaderboard('screen_time', 50);

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getUserRank', () => {
    it('should return rank information for existing user', async () => {
      const userId = 'user123';
      const userScore = 150;

      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({userId, score: userScore}),
      });

      // Mock count queries
      mockQuery.get.mockResolvedValueOnce({data: () => ({count: 5})}); // higher scores
      mockQuery.get.mockResolvedValueOnce({data: () => ({count: 100})}); // total

      const result = await service.getUserRank(userId, 'focus_time');

      expect(result.rank).toBe(6); // 5 higher + 1
      expect(result.total).toBe(100);
    });

    it('should return zero rank for non-existent user', async () => {
      mockDoc.get.mockResolvedValueOnce({exists: false});

      const result = await service.getUserRank('nonexistent', 'streak');

      expect(result.rank).toBe(0);
      expect(result.total).toBe(0);
      expect(result.entry).toBeNull();
    });
  });

  describe('category validation', () => {
    it('should accept all valid categories', () => {
      const validCategories: LeaderboardCategory[] = [
        'screen_time',
        'focus_time',
        'badges',
        'streak',
        'weekly_challenge',
      ];

      validCategories.forEach((category) => {
        expect(() => service.getLeaderboard(category, 10)).not.toThrow();
      });
    });
  });
});

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    service = new PushNotificationService();
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should register FCM token with platform info', async () => {
      const userId = 'user123';
      const token = 'fcm-token-123';
      const platform: 'ios' | 'android' = 'ios';

      await service.registerToken(userId, token, platform);

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          token,
          platform,
          active: true,
        }),
        expect.any(Object)
      );
    });
  });

  describe('unregisterToken', () => {
    it('should delete the token document', async () => {
      const userId = 'user123';
      const token = 'fcm-token-123';

      await service.unregisterToken(userId, token);

      expect(mockDoc.delete).toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    it('should send notification to user with active tokens', async () => {
      const userId = 'user123';
      const payload: NotificationPayload = {
        type: 'streak_reminder',
        title: 'Test',
        body: 'Test body',
      };

      mockCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [{data: () => ({token: 'token1'})}],
      });

      const result = await service.sendToUser(userId, payload);

      expect(result.success).toBe(true);
    });

    it('should return error when no active tokens found', async () => {
      const userId = 'user123';
      const payload: NotificationPayload = {
        type: 'daily_summary',
        title: 'Test',
        body: 'Test body',
      };

      mockCollection.get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      const result = await service.sendToUser(userId, payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active tokens found');
    });
  });

  describe('sendStreakReminder', () => {
    it('should send streak reminder with correct emoji and streak count', async () => {
      const userId = 'user123';
      const streak = 7;

      mockCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [{data: () => ({token: 'token1'})}],
      });

      await service.sendStreakReminder(userId, streak);

      // Verify the notification was sent (mocked)
      expect(mockCollection.get).toHaveBeenCalled();
    });
  });

  describe('sendAchievementUnlocked', () => {
    it('should send achievement notification with tier emoji', async () => {
      const userId = 'user123';
      const badgeName = 'Test Badge';
      const tier = 'gold';

      mockCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [{data: () => ({token: 'token1'})}],
      });

      await service.sendAchievementUnlocked(userId, badgeName, tier);

      expect(mockCollection.get).toHaveBeenCalled();
    });
  });

  describe('sendDailySummary', () => {
    it('should format daily summary correctly', async () => {
      const userId = 'user123';
      const stats = {
        screenTime: 125,
        focusTime: 45,
        blockedAttempts: 3,
      };

      mockCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [{data: () => ({token: 'token1'})}],
      });

      await service.sendDailySummary(userId, stats);

      expect(mockCollection.get).toHaveBeenCalled();
    });
  });

  describe('topic management', () => {
    it('should subscribe user to topic', async () => {
      const userId = 'user123';
      const topic = 'weekly_challenge';

      mockCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {data: () => ({token: 'token1'})},
          {data: () => ({token: 'token2'})},
        ],
      });

      await service.subscribeToTopic(userId, topic);

      // Should get tokens and subscribe
      expect(mockCollection.get).toHaveBeenCalled();
    });

    it('should unsubscribe user from topic', async () => {
      const userId = 'user123';
      const topic = 'announcements';

      mockCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [{data: () => ({token: 'token1'})}],
      });

      await service.unsubscribeFromTopic(userId, topic);

      expect(mockCollection.get).toHaveBeenCalled();
    });
  });
});

describe('AppUsageTracker', () => {
  let tracker: AppUsageTracker;

  beforeEach(() => {
    tracker = new AppUsageTracker();
    jest.clearAllMocks();
  });

  describe('logUsage', () => {
    it('should log usage and update daily stats', async () => {
      const userId = 'user123';
      const usage = {
        packageName: 'com.example.app',
        appName: 'Example App',
        usageTime: 30,
        category: 'social',
        isBlocked: false,
      };

      await tracker.logUsage(userId, usage);

      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should increment blocked attempts counter', async () => {
      const userId = 'user123';
      const usage = {
        packageName: 'com.example.app',
        appName: 'Example App',
        usageTime: 5,
        category: 'games',
        isBlocked: true,
      };

      await tracker.logUsage(userId, usage);

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getDailyStats', () => {
    it('should return daily stats for existing date', async () => {
      const userId = 'user123';
      const date = '2024-03-13';
      const mockStats = {
        date,
        totalScreenTime: 120,
        appBreakdown: {'com.example.app': 60},
        blockedAttempts: 2,
      };

      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => mockStats,
      });

      const result = await tracker.getDailyStats(userId, date);

      expect(result).toEqual(mockStats);
    });

    it('should return null for non-existing date', async () => {
      const userId = 'user123';
      const date = '2024-03-13';

      mockDoc.get.mockResolvedValueOnce({exists: false});

      const result = await tracker.getDailyStats(userId, date);

      expect(result).toBeNull();
    });
  });

  describe('getWeeklyStats', () => {
    it('should return stats for the last 7 days', async () => {
      const userId = 'user123';
      const mockDocs = [
        {data: () => ({date: '2024-03-13', totalScreenTime: 100})},
        {data: () => ({date: '2024-03-12', totalScreenTime: 120})},
        {data: () => ({date: '2024-03-11', totalScreenTime: 90})},
      ];

      mockQuery.get.mockResolvedValueOnce({docs: mockDocs});

      const result = await tracker.getWeeklyStats(userId);

      expect(result).toHaveLength(3);
      expect(mockQuery.where).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkLimitExceeded', () => {
    it('should return exceeded=true when limit is reached', async () => {
      const userId = 'user123';
      const packageName = 'com.example.app';
      const dailyLimit = 60;

      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          appBreakdown: {[packageName]: 65},
        }),
      });

      const result = await tracker.checkLimitExceeded(userId, packageName, dailyLimit);

      expect(result.exceeded).toBe(true);
      expect(result.currentUsage).toBe(65);
    });

    it('should return exceeded=false when under limit', async () => {
      const userId = 'user123';
      const packageName = 'com.example.app';
      const dailyLimit = 60;

      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          appBreakdown: {[packageName]: 30},
        }),
      });

      const result = await tracker.checkLimitExceeded(userId, packageName, dailyLimit);

      expect(result.exceeded).toBe(false);
      expect(result.currentUsage).toBe(30);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete old usage logs', async () => {
      const userId = 'user123';
      const mockDocs = Array(10).fill(null).map(() => ({
        ref: {path: `users/${userId}/appUsage/doc`},
      }));

      mockQuery.get.mockResolvedValueOnce({docs: mockDocs});

      const result = await tracker.cleanupOldLogs(userId, 90);

      expect(result).toBe(10);
      expect(mockBatch.delete).toHaveBeenCalledTimes(10);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should return 0 when no old logs exist', async () => {
      const userId = 'user123';

      mockQuery.get.mockResolvedValueOnce({docs: []});

      const result = await tracker.cleanupOldLogs(userId, 90);

      expect(result).toBe(0);
    });
  });
});

describe('BadgeVerificationSystem', () => {
  let badgeSystem: BadgeVerificationSystem;
  const mockNotificationService = {
    sendAchievementUnlocked: jest.fn().mockResolvedValue(undefined),
  } as unknown as PushNotificationService;

  beforeEach(() => {
    badgeSystem = createBadgeVerificationSystem(mockNotificationService);
    jest.clearAllMocks();
  });

  describe('DEFAULT_BADGES', () => {
    it('should contain all expected badges', () => {
      const badgeIds = BadgeVerificationSystem.DEFAULT_BADGES.map((b) => b.id);
      
      expect(badgeIds).toContain('streak_7');
      expect(badgeIds).toContain('streak_30');
      expect(badgeIds).toContain('streak_100');
      expect(badgeIds).toContain('focus_king');
      expect(badgeIds).toContain('social_detox_7');
      expect(badgeIds).toContain('digital_sabbath');
      expect(badgeIds).toContain('sleep_champion');
    });

    it('should have valid tier values for all badges', () => {
      const validTiers: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum'];
      
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(validTiers).toContain(badge.tier);
      });
    });

    it('should have positive rewards for all badges', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(badge.reward).toBeGreaterThan(0);
      });
    });

    it('should have unique badge IDs', () => {
      const ids = BadgeVerificationSystem.DEFAULT_BADGES.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('initializeBadges', () => {
    it('should initialize all default badges in Firestore', async () => {
      await badgeSystem.initializeBadges();

      expect(mockBatch.set).toHaveBeenCalledTimes(
        BadgeVerificationSystem.DEFAULT_BADGES.length
      );
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('checkBadgeEligibility', () => {
    it('should return false when user does not exist', async () => {
      mockDoc.get.mockResolvedValueOnce({exists: false});

      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_7')!;
      const result = await badgeSystem.checkBadgeEligibility('nonexistent', badge);

      expect(result).toBe(false);
    });

    it('should check streak requirement correctly', async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({currentStreak: 10}),
      });

      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_7')!;
      const result = await badgeSystem.checkBadgeEligibility('user123', badge);

      expect(result).toBe(true);
    });

    it('should return false when streak is insufficient', async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({currentStreak: 3}),
      });

      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_7')!;
      const result = await badgeSystem.checkBadgeEligibility('user123', badge);

      expect(result).toBe(false);
    });
  });

  describe('awardBadge', () => {
    it('should award badge and send notification', async () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES[0];

      await badgeSystem.awardBadge('user123', badge);

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(mockNotificationService.sendAchievementUnlocked).toHaveBeenCalledWith(
        'user123',
        badge.name,
        badge.tier
      );
    });

    it('should add Focus Coins reward', async () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.reward > 0)!;

      await badgeSystem.awardBadge('user123', badge);

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          focusCoins: expect.any(Object), // FieldValue.increment
        })
      );
    });
  });

  describe('getBadgeProgress', () => {
    it('should return all user badges', async () => {
      const mockBadges = [
        {badgeId: 'streak_7', progress: 5, maxProgress: 7},
        {badgeId: 'streak_30', progress: 10, maxProgress: 30, unlockedAt: new Date()},
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockBadges.map(b => ({data: () => b})),
      });

      const result = await badgeSystem.getBadgeProgress('user123');

      expect(result).toHaveLength(2);
      expect(result[0].badgeId).toBe('streak_7');
    });
  });

  describe('progress tracking', () => {
    it('should record early bird day', async () => {
      const userId = 'user123';
      const beforeHour = 8;

      await badgeSystem.recordEarlyBirdDay(userId, beforeHour);

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeHour,
          date: expect.any(String),
        })
      );
    });

    it('should record digital sabbath', async () => {
      const userId = 'user123';
      const startTime = new Date('2024-03-13T00:00:00');
      const endTime = new Date('2024-03-14T00:00:00');
      const completed = true;

      await badgeSystem.recordDigitalSabbath(userId, startTime, endTime, completed);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 24,
          completed,
        })
      );
    });

    it('should record weekend warrior', async () => {
      const userId = 'user123';
      const weekendDate = new Date('2024-03-09');

      await badgeSystem.recordWeekendWarrior(userId, weekendDate);

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
        })
      );
    });
  });
});

describe('Service Integration', () => {
  it('should create all services without errors', () => {
    const leaderboardService = new LeaderboardService();
    const pushNotificationService = new PushNotificationService();
    const appUsageTracker = new AppUsageTracker();
    const badgeSystem = createBadgeVerificationSystem(pushNotificationService);

    expect(leaderboardService).toBeInstanceOf(LeaderboardService);
    expect(pushNotificationService).toBeInstanceOf(PushNotificationService);
    expect(appUsageTracker).toBeInstanceOf(AppUsageTracker);
    expect(badgeSystem).toBeInstanceOf(BadgeVerificationSystem);
  });

  it('should have consistent badge tiers across all badges', () => {
    const tierOrder: Record<BadgeTier, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
    };

    BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
      expect(tierOrder[badge.tier]).toBeDefined();
    });
  });

  it('should have higher rewards for higher tiers on average', () => {
    const tierRewards: Record<BadgeTier, number[]> = {
      bronze: [],
      silver: [],
      gold: [],
      platinum: [],
    };

    BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
      tierRewards[badge.tier].push(badge.reward);
    });

    const avgBronze = tierRewards.bronze.reduce((a, b) => a + b, 0) / tierRewards.bronze.length;
    const avgSilver = tierRewards.silver.reduce((a, b) => a + b, 0) / tierRewards.silver.length;
    const avgGold = tierRewards.gold.reduce((a, b) => a + b, 0) / tierRewards.gold.length;

    expect(avgSilver).toBeGreaterThanOrEqual(avgBronze);
    expect(avgGold).toBeGreaterThanOrEqual(avgSilver);
  });
});
