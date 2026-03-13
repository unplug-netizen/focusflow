/**
 * Unit Tests für Backend Services
 * 
 * Diese Tests prüfen die grundlegende Funktionalität der Services.
 */

import {LeaderboardService, LeaderboardCategory} from '../src/services/leaderboardService';
import {PushNotificationService} from '../src/services/pushNotificationService';
import {AppUsageTracker} from '../src/services/appUsageTracker';
import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
  BadgeTier,
} from '../src/services/badgeVerificationSystem';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({exists: false}),
            set: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
          })),
          add: jest.fn().mockResolvedValue({id: 'mock-doc-id'}),
          where: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
            })),
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({docs: []}),
              })),
              get: jest.fn().mockResolvedValue({docs: []}),
            })),
            limit: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({docs: []}),
            })),
            get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
          })),
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({docs: []}),
            })),
            get: jest.fn().mockResolvedValue({docs: []}),
          })),
          get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
        })),
        get: jest.fn().mockResolvedValue({exists: false}),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
        })),
        get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
      })),
      get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
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

  it('should create an instance', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(LeaderboardService);
  });

  describe('updateScore', () => {
    it('should update user score without throwing', async () => {
      const userId = 'user123';
      const category: LeaderboardCategory = 'focus_time';
      const score = 120;
      const userData = {
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        streak: 5,
      };

      await expect(service.updateScore(userId, category, score, userData)).resolves.not.toThrow();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const result = await service.getLeaderboard('badges', 10);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserRank', () => {
    it('should return rank information', async () => {
      const result = await service.getUserRank('user123', 'streak');
      expect(result).toHaveProperty('rank');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('entry');
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

  it('should create an instance', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PushNotificationService);
  });

  describe('registerToken', () => {
    it('should register FCM token without throwing', async () => {
      await expect(service.registerToken('user123', 'token123', 'ios')).resolves.not.toThrow();
    });
  });

  describe('unregisterToken', () => {
    it('should unregister token without throwing', async () => {
      await expect(service.unregisterToken('user123', 'token123')).resolves.not.toThrow();
    });
  });

  describe('sendToUser', () => {
    it('should handle missing tokens gracefully', async () => {
      const result = await service.sendToUser('user123', {
        type: 'streak_reminder',
        title: 'Test',
        body: 'Test body',
      });
      expect(result).toHaveProperty('success');
    });
  });
});

describe('AppUsageTracker', () => {
  let tracker: AppUsageTracker;

  beforeEach(() => {
    tracker = new AppUsageTracker();
    jest.clearAllMocks();
  });

  it('should create an instance', () => {
    expect(tracker).toBeDefined();
    expect(tracker).toBeInstanceOf(AppUsageTracker);
  });

  describe('logUsage', () => {
    it('should log usage without throwing', async () => {
      const usage = {
        packageName: 'com.example.app',
        appName: 'Example App',
        usageTime: 30,
        category: 'social',
        isBlocked: false,
      };

      await expect(tracker.logUsage('user123', usage)).resolves.not.toThrow();
    });
  });

  describe('getDailyStats', () => {
    it('should return null for non-existing date', async () => {
      const result = await tracker.getDailyStats('user123', '2024-03-13');
      expect(result).toBeNull();
    });
  });

  describe('getWeeklyStats', () => {
    it('should return stats array', async () => {
      const result = await tracker.getWeeklyStats('user123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('checkLimitExceeded', () => {
    it('should return limit check result', async () => {
      const result = await tracker.checkLimitExceeded('user123', 'com.example.app', 60);
      expect(result).toHaveProperty('exceeded');
      expect(result).toHaveProperty('currentUsage');
    });
  });
});

describe('BadgeVerificationSystem', () => {
  const mockNotificationService = {
    sendAchievementUnlocked: jest.fn().mockResolvedValue(undefined),
  } as unknown as PushNotificationService;

  let badgeSystem: BadgeVerificationSystem;

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

    it('should have badges with valid structure', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(badge.tier).toMatch(/^(bronze|silver|gold|platinum)$/);
        expect(badge.requirement).toBeDefined();
        expect(badge.reward).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('initializeBadges', () => {
    it('should initialize badges without throwing', async () => {
      await expect(badgeSystem.initializeBadges()).resolves.not.toThrow();
    });
  });

  describe('checkBadgeEligibility', () => {
    it('should return false for non-existent user', async () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_7')!;
      const result = await badgeSystem.checkBadgeEligibility('nonexistent', badge);
      expect(result).toBe(false);
    });
  });

  describe('awardBadge', () => {
    it('should award badge without throwing', async () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES[0];
      await expect(badgeSystem.awardBadge('user123', badge)).resolves.not.toThrow();
    });
  });

  describe('getBadgeProgress', () => {
    it('should return badges array', async () => {
      const result = await badgeSystem.getBadgeProgress('user123');
      expect(Array.isArray(result)).toBe(true);
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
