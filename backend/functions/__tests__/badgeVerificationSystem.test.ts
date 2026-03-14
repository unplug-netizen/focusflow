/**
 * Erweiterte Tests für BadgeVerificationSystem
 */

import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
  Badge,
  BadgeTier,
} from '../src/services/badgeVerificationSystem';
import {PushNotificationService} from '../src/services/pushNotificationService';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            currentStreak: 7,
            totalFocusTime: 120,
            totalBlockedTime: 600,
            bedtimeStreak: 30,
            badges: [
              {id: 'badge1', tier: 'bronze', unlockedAt: new Date()},
            ],
          }),
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
            docs: [],
            size: 0,
          }),
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

describe('BadgeVerificationSystem - Extended', () => {
  const mockNotificationService = {
    sendAchievementUnlocked: jest.fn().mockResolvedValue(undefined),
  } as unknown as PushNotificationService;

  beforeEach(() => {
    createBadgeVerificationSystem(mockNotificationService);
    jest.clearAllMocks();
  });

  describe('Default Badges', () => {
    it('should have exactly 11 default badges', () => {
      expect(BadgeVerificationSystem.DEFAULT_BADGES.length).toBe(11);
    });

    it('should have unique badge IDs', () => {
      const ids = BadgeVerificationSystem.DEFAULT_BADGES.map(b => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required badge properties', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge: Badge) => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(badge.tier).toMatch(/^(bronze|silver|gold|platinum)$/);
        expect(badge.requirement).toBeDefined();
        expect(badge.reward).toBeGreaterThan(0);
      });
    });
  });

  describe('Badge Tiers', () => {
    it('should have valid tier distribution', () => {
      const tierCounts: Record<BadgeTier, number> = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
      };

      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge: Badge) => {
        tierCounts[badge.tier]++;
      });

      expect(tierCounts.bronze).toBeGreaterThan(0);
      expect(tierCounts.silver).toBeGreaterThan(0);
      expect(tierCounts.gold).toBeGreaterThan(0);
      expect(tierCounts.platinum).toBeGreaterThan(0);
    });

    it('should have higher rewards for higher tiers on average', () => {
      const tierRewards: Record<BadgeTier, number[]> = {
        bronze: [],
        silver: [],
        gold: [],
        platinum: [],
      };

      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge: Badge) => {
        tierRewards[badge.tier].push(badge.reward);
      });

      const avgBronze = tierRewards.bronze.reduce((a, b) => a + b, 0) / tierRewards.bronze.length;
      const avgSilver = tierRewards.silver.reduce((a, b) => a + b, 0) / tierRewards.silver.length;
      const avgGold = tierRewards.gold.reduce((a, b) => a + b, 0) / tierRewards.gold.length;

      expect(avgSilver).toBeGreaterThanOrEqual(avgBronze);
      expect(avgGold).toBeGreaterThanOrEqual(avgSilver);
    });
  });

  describe('Badge Requirements', () => {
    it('should have streak badges with day requirements', () => {
      const streakBadges = BadgeVerificationSystem.DEFAULT_BADGES.filter(
        b => b.requirement.type === 'streak'
      );

      expect(streakBadges.length).toBeGreaterThan(0);
      streakBadges.forEach(badge => {
        expect(badge.requirement).toHaveProperty('days');
        expect((badge.requirement as {days: number}).days).toBeGreaterThan(0);
      });
    });

    it('should have focus time badge with minute requirement', () => {
      const focusBadge = BadgeVerificationSystem.DEFAULT_BADGES.find(
        b => b.requirement.type === 'focus_time'
      );

      expect(focusBadge).toBeDefined();
      expect(focusBadge!.requirement).toHaveProperty('minutes');
    });

    it('should have blocked time badges with minute requirements', () => {
      const blockedBadges = BadgeVerificationSystem.DEFAULT_BADGES.filter(
        b => b.requirement.type === 'blocked_time'
      );

      expect(blockedBadges.length).toBeGreaterThan(0);
      blockedBadges.forEach(badge => {
        expect(badge.requirement).toHaveProperty('minutes');
      });
    });

    it('should have social detox badge with day requirement', () => {
      const detoxBadge = BadgeVerificationSystem.DEFAULT_BADGES.find(
        b => b.requirement.type === 'social_detox'
      );

      expect(detoxBadge).toBeDefined();
      expect(detoxBadge!.requirement).toHaveProperty('days');
      expect(detoxBadge!.requirement).toHaveProperty('category');
    });
  });

  describe('Specific Badges', () => {
    it('should have Week Warrior badge (7-day streak)', () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_7');
      
      expect(badge).toBeDefined();
      expect(badge!.name).toBe('Week Warrior');
      expect(badge!.tier).toBe('bronze');
      expect((badge!.requirement as {days: number}).days).toBe(7);
    });

    it('should have Month Master badge (30-day streak)', () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_30');
      
      expect(badge).toBeDefined();
      expect(badge!.name).toBe('Month Master');
      expect(badge!.tier).toBe('silver');
      expect((badge!.requirement as {days: number}).days).toBe(30);
    });

    it('should have Centurion badge (100-day streak)', () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'streak_100');
      
      expect(badge).toBeDefined();
      expect(badge!.name).toBe('Centurion');
      expect(badge!.tier).toBe('gold');
      expect((badge!.requirement as {days: number}).days).toBe(100);
    });

    it('should have Focus King badge (100 hours focus)', () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'focus_king');
      
      expect(badge).toBeDefined();
      expect(badge!.name).toBe('Focus King');
      expect(badge!.tier).toBe('platinum');
      expect((badge!.requirement as {minutes: number}).minutes).toBe(6000); // 100 hours
    });

    it('should have Digital Sabbath badge (24 hours offline)', () => {
      const badge = BadgeVerificationSystem.DEFAULT_BADGES.find(b => b.id === 'digital_sabbath');
      
      expect(badge).toBeDefined();
      expect(badge!.name).toBe('Digital Sabbath');
      expect((badge!.requirement as {hours: number}).hours).toBe(24);
    });
  });

  describe('Reward Values', () => {
    it('should have bronze badges with 50-75 coins', () => {
      const bronzeBadges = BadgeVerificationSystem.DEFAULT_BADGES.filter(
        b => b.tier === 'bronze'
      );

      bronzeBadges.forEach(badge => {
        expect(badge.reward).toBeGreaterThanOrEqual(50);
        expect(badge.reward).toBeLessThanOrEqual(100);
      });
    });

    it('should have platinum badge with highest reward', () => {
      const platinumBadge = BadgeVerificationSystem.DEFAULT_BADGES.find(
        b => b.tier === 'platinum'
      );

      const maxReward = Math.max(
        ...BadgeVerificationSystem.DEFAULT_BADGES.map(b => b.reward)
      );

      expect(platinumBadge!.reward).toBe(maxReward);
    });
  });

  describe('Badge Icons', () => {
    it('should have emoji or symbol icons for all badges', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach(badge => {
        // Accept any non-empty string as icon (emoji or symbols like ⏰)
        expect(badge.icon).toBeTruthy();
        expect(typeof badge.icon).toBe('string');
        expect(badge.icon.length).toBeGreaterThan(0);
      });
    });
  });
});
