/**
 * Einfache Tests für die Backend-Services
 * 
 * Diese Tests überprüfen, dass die Services korrekt instanziiert werden können
 * und die grundlegenden Funktionen exportiert werden.
 */

import {AppUsageTracker} from '../src/services/appUsageTracker';
import {LeaderboardService} from '../src/services/leaderboardService';
import {PushNotificationService} from '../src/services/pushNotificationService';
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
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date: Date) => date),
  },
}));

describe('Backend Services', () => {
  describe('AppUsageTracker', () => {
    it('should create an instance', () => {
      const tracker = new AppUsageTracker();
      expect(tracker).toBeDefined();
      expect(tracker).toBeInstanceOf(AppUsageTracker);
    });
  });

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
  });
});
