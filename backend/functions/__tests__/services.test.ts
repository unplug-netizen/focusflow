/**
 * Unit Tests für Backend Services
 * 
 * Diese Tests prüfen die Business-Logik der Services.
 */

import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
  BadgeTier,
} from '../src/services/badgeVerificationSystem';
import {PushNotificationService} from '../src/services/pushNotificationService';
import {LeaderboardService} from '../src/services/leaderboardService';
import {AppUsageTracker} from '../src/services/appUsageTracker';
import {AnalyticsService} from '../src/services/analyticsService';
import {ChallengeService, createChallengeService} from '../src/services/challengeService';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({exists: false, data: () => null}),
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
          get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
        })),
      })),
      add: jest.fn().mockResolvedValue({id: 'mock-doc-id'}),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
    })),
    collectionGroup: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
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
      const userData = {
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        streak: 5,
      };

      await expect(service.updateScore(userId, 'focus_time', 120, userData)).resolves.not.toThrow();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries array', async () => {
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
      expect(badgeIds).toContain('early_bird');
      expect(badgeIds).toContain('weekend_warrior');
      expect(badgeIds).toContain('time_saver');
      expect(badgeIds).toContain('master_saver');
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

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    jest.clearAllMocks();
  });

  it('should create an instance', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AnalyticsService);
  });

  describe('generateDailyReport', () => {
    it('should generate report without throwing', async () => {
      const result = await service.generateDailyReport('2024-03-13');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
    });
  });

  describe('getUserAnalytics', () => {
    it('should throw error for non-existing user', async () => {
      await expect(service.getUserAnalytics('non-existing')).rejects.toThrow();
    });
  });

  describe('getCategoryAnalytics', () => {
    it('should return category analytics array', async () => {
      const result = await service.getCategoryAnalytics(7);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return streak leaderboard', async () => {
      const result = await service.getStreakLeaderboard(10);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRetentionMetrics', () => {
    it('should return retention metrics', async () => {
      const result = await service.getRetentionMetrics();
      expect(result).toHaveProperty('dailyRetention');
      expect(result).toHaveProperty('weeklyRetention');
      expect(result).toHaveProperty('monthlyRetention');
    });
  });
});

describe('ChallengeService', () => {
  const mockNotificationService = {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  } as unknown as PushNotificationService;

  let service: ChallengeService;

  beforeEach(() => {
    service = createChallengeService(mockNotificationService);
    jest.clearAllMocks();
  });

  it('should create an instance', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ChallengeService);
  });

  describe('WEEKLY_CHALLENGES', () => {
    it('should contain predefined challenges', () => {
      expect(ChallengeService.WEEKLY_CHALLENGES.length).toBeGreaterThan(0);
    });

    it('should have valid challenge types', () => {
      const validTypes = [
        'reduce_screen_time',
        'focus_sessions',
        'social_detox',
        'early_bird',
        'weekend_warrior',
        'bedtime_streak',
        'blocked_attempts',
      ];

      ChallengeService.WEEKLY_CHALLENGES.forEach(challenge => {
        expect(validTypes).toContain(challenge.type);
      });
    });

    it('should have positive rewards', () => {
      ChallengeService.WEEKLY_CHALLENGES.forEach(challenge => {
        expect(challenge.reward).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty levels', () => {
      const validDifficulties = ['easy', 'medium', 'hard'];
      ChallengeService.WEEKLY_CHALLENGES.forEach(challenge => {
        expect(validDifficulties).toContain(challenge.difficulty);
      });
    });
  });

  describe('createWeeklyChallenges', () => {
    it('should create challenges without throwing', async () => {
      const result = await service.createWeeklyChallenges(new Date());
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCurrentChallenges', () => {
    it('should return challenges array', async () => {
      const result = await service.getCurrentChallenges();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserChallenges', () => {
    it('should return user challenges array', async () => {
      const result = await service.getUserChallenges('user123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateProgress', () => {
    it('should throw error for non-existing challenge', async () => {
      await expect(
        service.updateProgress('user123', 'non-existing', 50)
      ).rejects.toThrow('Challenge not found');
    });
  });

  describe('claimReward', () => {
    it('should throw error for non-existing progress', async () => {
      await expect(
        service.claimReward('user123', 'non-existing')
      ).rejects.toThrow('Challenge progress not found');
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('should return leaderboard array', async () => {
      const result = await service.getChallengeLeaderboard('challenge-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('Service Integration', () => {
  it('should create all services without errors', () => {
    const leaderboardService = new LeaderboardService();
    const pushNotificationService = new PushNotificationService();
    const appUsageTracker = new AppUsageTracker();
    const analyticsService = new AnalyticsService();
    const badgeSystem = createBadgeVerificationSystem(pushNotificationService);
    const challengeService = createChallengeService(pushNotificationService);

    expect(leaderboardService).toBeInstanceOf(LeaderboardService);
    expect(pushNotificationService).toBeInstanceOf(PushNotificationService);
    expect(appUsageTracker).toBeInstanceOf(AppUsageTracker);
    expect(analyticsService).toBeInstanceOf(AnalyticsService);
    expect(badgeSystem).toBeInstanceOf(BadgeVerificationSystem);
    expect(challengeService).toBeInstanceOf(ChallengeService);
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

  it('should have unique challenge IDs in templates', () => {
    const titles = ChallengeService.WEEKLY_CHALLENGES.map(c => c.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });
});
