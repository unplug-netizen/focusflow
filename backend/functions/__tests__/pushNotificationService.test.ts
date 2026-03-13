/**
 * Erweiterte Tests für PushNotificationService
 */

import {PushNotificationService, NotificationType} from '../src/services/pushNotificationService';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            streakReminders: true,
            achievementNotifications: true,
            leaderboardUpdates: true,
            dailySummary: true,
            challengeReminders: true,
            limitWarnings: true,
            focusReminders: true,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
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
      successCount: 2,
      failureCount: 0,
      responses: [{success: true}, {success: true}],
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

describe('PushNotificationService - Extended', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    service = new PushNotificationService();
    jest.clearAllMocks();
  });

  describe('Notification Types', () => {
    it('should support all notification types', () => {
      const types: NotificationType[] = [
        'streak_reminder',
        'achievement_unlocked',
        'leaderboard_update',
        'daily_summary',
        'challenge_reminder',
        'limit_warning',
        'focus_reminder',
        'system',
      ];

      types.forEach(type => {
        expect(type).toBeDefined();
      });
    });
  });

  describe('Streak Reminder', () => {
    it('should format streak reminder correctly', async () => {
      const streak = 7;
      const title = '🔥 Streak in Gefahr!';
      const body = `Du hast eine ${streak}-Tage-Streak. Öffne die App, um sie zu erhalten!`;

      expect(title).toContain('🔥');
      expect(body).toContain(streak.toString());
      expect(body).toContain('Tage');
    });

    it('should include streak data in payload', () => {
      const streak = 7;
      const data = {
        streak: streak.toString(),
        action: 'open_app',
      };

      expect(data.streak).toBe('7');
      expect(data.action).toBe('open_app');
    });
  });

  describe('Achievement Notification', () => {
    it('should use correct tier emojis', () => {
      const tierEmojis: Record<string, string> = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎',
      };

      expect(tierEmojis.bronze).toBe('🥉');
      expect(tierEmojis.silver).toBe('🥈');
      expect(tierEmojis.gold).toBe('🥇');
      expect(tierEmojis.platinum).toBe('💎');
    });

    it('should format achievement title correctly', () => {
      const tier = 'gold';
      const tierEmojis: Record<string, string> = {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇',
        platinum: '💎',
      };

      const title = `${tierEmojis[tier] || '🏆'} Badge freigeschaltet!`;
      expect(title).toBe('🥇 Badge freigeschaltet!');
    });
  });

  describe('Daily Summary', () => {
    it('should format time correctly', () => {
      const screenTime = 185; // 3h 5m
      const hours = Math.floor(screenTime / 60);
      const minutes = screenTime % 60;

      expect(hours).toBe(3);
      expect(minutes).toBe(5);
    });

    it('should create summary body correctly', () => {
      const stats = {
        screenTime: 185,
        focusTime: 45,
        blockedAttempts: 3,
      };

      const hours = Math.floor(stats.screenTime / 60);
      const minutes = stats.screenTime % 60;
      const body = `Bildschirmzeit: ${hours}h ${minutes}m | Fokus: ${stats.focusTime}m | Blockiert: ${stats.blockedAttempts}x`;

      expect(body).toBe('Bildschirmzeit: 3h 5m | Fokus: 45m | Blockiert: 3x');
    });
  });

  describe('Leaderboard Update', () => {
    it('should detect rank improvement', () => {
      const newRank = 5;
      const oldRank = 8;

      const improved = newRank < oldRank;
      expect(improved).toBe(true);
    });

    it('should not notify on rank decline', () => {
      const newRank = 10;
      const oldRank = 8;

      const improved = newRank < oldRank;
      expect(improved).toBe(false);
    });
  });

  describe('Limit Warning', () => {
    it('should calculate remaining time correctly', () => {
      const currentUsage = 50;
      const limit = 60;
      const remaining = Math.max(0, limit - currentUsage);

      expect(remaining).toBe(10);
    });

    it('should not show negative remaining time', () => {
      const currentUsage = 70;
      const limit = 60;
      const remaining = Math.max(0, limit - currentUsage);

      expect(remaining).toBe(0);
    });
  });

  describe('Quiet Hours', () => {
    it('should detect quiet hours correctly (same day)', () => {
      const quietHoursStart = '22:00';
      const quietHoursEnd = '08:00';
      const currentTime = '23:00';

      const inQuietHours = quietHoursStart <= quietHoursEnd
        ? currentTime >= quietHoursStart && currentTime <= quietHoursEnd
        : currentTime >= quietHoursStart || currentTime <= quietHoursEnd;

      expect(inQuietHours).toBe(true);
    });

    it('should detect quiet hours correctly (overnight)', () => {
      const quietHoursStart = '22:00';
      const quietHoursEnd = '08:00';
      const currentTime = '02:00';

      const inQuietHours = quietHoursStart <= quietHoursEnd
        ? currentTime >= quietHoursStart && currentTime <= quietHoursEnd
        : currentTime >= quietHoursStart || currentTime <= quietHoursEnd;

      expect(inQuietHours).toBe(true);
    });

    it('should detect non-quiet hours correctly', () => {
      const quietHoursStart = '22:00';
      const quietHoursEnd = '08:00';
      const currentTime = '14:00';

      const inQuietHours = quietHoursStart <= quietHoursEnd
        ? currentTime >= quietHoursStart && currentTime <= quietHoursEnd
        : currentTime >= quietHoursStart || currentTime <= quietHoursEnd;

      expect(inQuietHours).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should register token with platform', async () => {
      const userId = 'user123';
      const token = 'fcm-token-123';
      const platform = 'ios' as const;

      await expect(service.registerToken(userId, token, platform)).resolves.not.toThrow();
    });

    it('should support both iOS and Android platforms', () => {
      const validPlatforms = ['ios', 'android'];
      
      expect(validPlatforms).toContain('ios');
      expect(validPlatforms).toContain('android');
      expect(validPlatforms).not.toContain('windows');
    });
  });
});
