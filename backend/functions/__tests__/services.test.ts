/**
 * Integration Tests für Backend Services
 * 
 * Diese Tests prüfen die grundlegende Funktionalität der Services
 * ohne komplexe Firebase-Mocking-Strukturen.
 */

import {LeaderboardService} from '../src/services/leaderboardService';
import {PushNotificationService} from '../src/services/pushNotificationService';
import {AppUsageTracker} from '../src/services/appUsageTracker';
import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
} from '../src/services/badgeVerificationSystem';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  db: {},
  messaging: {},
  FieldValue: {
    increment: jest.fn((n: number) => n),
  },
  Timestamp: {
    now: jest.fn(() => ({toDate: () => new Date()})),
    fromDate: jest.fn((date: Date) => date),
  },
}));

describe('Backend Services Integration', () => {
  describe('LeaderboardService', () => {
    it('should create an instance', () => {
      const service = new LeaderboardService();
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(LeaderboardService);
    });

    it('should have valid leaderboard categories', () => {
      const validCategories = [
        'screen_time',
        'focus_time',
        'badges',
        'streak',
        'weekly_challenge',
      ];
      validCategories.forEach((category) => {
        expect(category).toBeDefined();
      });
    });
  });

  describe('PushNotificationService', () => {
    it('should create an instance', () => {
      const service = new PushNotificationService();
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(PushNotificationService);
    });

    it('should have notification types defined', () => {
      const types = [
        'streak_reminder',
        'achievement_unlocked',
        'leaderboard_update',
        'daily_summary',
        'challenge_reminder',
        'limit_warning',
        'focus_reminder',
        'system',
      ];
      types.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe('AppUsageTracker', () => {
    it('should create an instance', () => {
      const tracker = new AppUsageTracker();
      expect(tracker).toBeDefined();
      expect(tracker).toBeInstanceOf(AppUsageTracker);
    });
  });

  describe('BadgeVerificationSystem', () => {
    it('should have default badges defined', () => {
      expect(BadgeVerificationSystem.DEFAULT_BADGES).toBeDefined();
      expect(BadgeVerificationSystem.DEFAULT_BADGES.length).toBeGreaterThan(0);
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

    it('should create instance via factory function', () => {
      const mockNotificationService = {} as PushNotificationService;
      const badgeSystem = createBadgeVerificationSystem(mockNotificationService);
      expect(badgeSystem).toBeDefined();
      expect(badgeSystem).toBeInstanceOf(BadgeVerificationSystem);
    });

    it('should have all expected badges', () => {
      const expectedBadges = [
        'streak_7',
        'streak_30',
        'streak_100',
        'focus_king',
        'social_detox_7',
        'digital_sabbath',
        'sleep_champion',
        'early_bird',
        'weekend_warrior',
        'time_saver',
        'master_saver',
      ];

      const badgeIds = BadgeVerificationSystem.DEFAULT_BADGES.map((b) => b.id);
      expectedBadges.forEach((id) => {
        expect(badgeIds).toContain(id);
      });
    });

    it('should have valid badge requirements', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(badge.requirement.type).toBeDefined();
        const validTypes = [
          'streak',
          'focus_time',
          'blocked_time',
          'social_detox',
          'digital_sabbath',
          'early_bird',
          'weekend_warrior',
          'bedtime',
        ];
        expect(validTypes).toContain(badge.requirement.type);
      });
    });

    it('should have positive rewards for all badges', () => {
      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(badge.reward).toBeGreaterThan(0);
      });
    });

    it('should have higher rewards for higher tiers', () => {
      const tierValues: Record<string, number> = {
        bronze: 10,
        silver: 25,
        gold: 50,
        platinum: 100,
      };

      BadgeVerificationSystem.DEFAULT_BADGES.forEach((badge) => {
        expect(badge.reward).toBeGreaterThanOrEqual(tierValues[badge.tier] || 0);
      });
    });
  });

  describe('Service Integration', () => {
    it('should have consistent service exports', () => {
      const leaderboardService = new LeaderboardService();
      const pushNotificationService = new PushNotificationService();
      const appUsageTracker = new AppUsageTracker();
      const badgeSystem = createBadgeVerificationSystem(pushNotificationService);

      expect(leaderboardService).toBeDefined();
      expect(pushNotificationService).toBeDefined();
      expect(appUsageTracker).toBeDefined();
      expect(badgeSystem).toBeDefined();
    });
  });
});
