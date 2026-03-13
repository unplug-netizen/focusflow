/**
 * Unit Tests für Backend Services
 * 
 * Diese Tests prüfen die Business-Logik der Services.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
  BadgeTier,
} from '../src/services/badgeVerificationSystem';
import {PushNotificationService} from '../src/services/pushNotificationService';

// Simple mock for Firebase
jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({exists: false}),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue({exists: false}),
          })),
          add: jest.fn().mockResolvedValue({id: 'mock-id'}),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({empty: true, docs: [], size: 0}),
        })),
      })),
      add: jest.fn().mockResolvedValue({id: 'mock-id'}),
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

describe('BadgeVerificationSystem', () => {
  const mockNotificationService = {
    sendAchievementUnlocked: jest.fn().mockResolvedValue(undefined),
  } as unknown as PushNotificationService;

  beforeEach(() => {
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

    it('should have badges with all required fields', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(badge.tier).toBeDefined();
        expect(badge.requirement).toBeDefined();
        expect(badge.reward).toBeDefined();
      });
    });
  });

  describe('Badge Tiers and Rewards', () => {
    it('should have bronze badges with lowest rewards', () => {
      const bronzeBadges = BadgeVerificationSystem.DEFAULT_BADGES.filter(
        b => b.tier === 'bronze'
      );
      expect(bronzeBadges.length).toBeGreaterThan(0);
      bronzeBadges.forEach(badge => {
        expect(badge.reward).toBeLessThan(100);
      });
    });

    it('should have platinum badge with highest reward', () => {
      const platinumBadges = BadgeVerificationSystem.DEFAULT_BADGES.filter(
        b => b.tier === 'platinum'
      );
      expect(platinumBadges.length).toBeGreaterThan(0);
      platinumBadges.forEach(badge => {
        expect(badge.reward).toBeGreaterThanOrEqual(500);
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

      expect(avgSilver).toBeGreaterThan(avgBronze);
      expect(avgGold).toBeGreaterThanOrEqual(avgSilver);
    });
  });

  describe('Badge Requirements', () => {
    it('should have streak badges with increasing day requirements', () => {
      const streakBadges = BadgeVerificationSystem.DEFAULT_BADGES.filter(
        b => b.requirement.type === 'streak'
      );
      expect(streakBadges.length).toBeGreaterThanOrEqual(3);
      
      const dayRequirements = streakBadges.map(b => (b.requirement as any).days).sort((a, b) => a - b);
      expect(dayRequirements[0]).toBe(7);
      expect(dayRequirements[dayRequirements.length - 1]).toBeGreaterThanOrEqual(100);
    });

    it('should have focus time requirement for Focus King badge', () => {
      const focusKing = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'focus_king');
      expect(focusKing).toBeDefined();
      expect(focusKing?.requirement.type).toBe('focus_time');
      expect((focusKing?.requirement as any).minutes).toBeGreaterThanOrEqual(6000);
    });

    it('should have blocked time requirements for time saver badges', () => {
      const timeSaver = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'time_saver');
      const masterSaver = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'master_saver');
      
      expect(timeSaver?.requirement.type).toBe('blocked_time');
      expect(masterSaver?.requirement.type).toBe('blocked_time');
      expect((masterSaver?.requirement as any).minutes).toBeGreaterThan(
        (timeSaver?.requirement as any).minutes
      );
    });
  });

  describe('Service Creation', () => {
    it('should create instance via factory function', () => {
      const system = createBadgeVerificationSystem(mockNotificationService);
      expect(system).toBeDefined();
      expect(system).toBeInstanceOf(BadgeVerificationSystem);
    });
  });
});

describe('Service Integration', () => {
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

  it('should have at least 10 default badges', () => {
    expect(BadgeVerificationSystem.DEFAULT_BADGES.length).toBeGreaterThanOrEqual(10);
  });
});
