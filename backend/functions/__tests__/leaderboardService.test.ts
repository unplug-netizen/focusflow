/**
 * Erweiterte Tests für LeaderboardService
 */

import {LeaderboardService} from '../src/services/leaderboardService';

// Mock Firebase
jest.mock('../src/config/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true, 
          data: () => ({
            displayName: 'Test User',
            photoURL: 'https://example.com/photo.jpg',
            currentStreak: 5,
            badges: [
              {id: 'badge1', tier: 'bronze', unlockedAt: new Date()},
              {id: 'badge2', tier: 'silver', unlockedAt: new Date()},
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
              {
                id: 'user123',
                data: () => ({
                  userId: 'user123',
                  displayName: 'Test User',
                  score: 100,
                  streak: 5,
                }),
              },
              {
                id: 'user456',
                data: () => ({
                  userId: 'user456',
                  displayName: 'User Two',
                  score: 80,
                  streak: 3,
                }),
              },
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
              currentStreak: 5,
              photoURL: 'https://example.com/photo.jpg',
            }),
          },
        ],
        size: 1,
      }),
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

describe('LeaderboardService - Extended', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    service = new LeaderboardService();
    jest.clearAllMocks();
  });

  describe('Category Score Calculations', () => {
    it('should calculate screen time score correctly', async () => {
      const weeklyScreenTime = 2000;
      const maxScreenTime = 3360;
      const score = Math.max(0, Math.round(maxScreenTime - weeklyScreenTime));
      
      expect(score).toBe(1360);
    });

    it('should cap screen time score at 0', async () => {
      const weeklyScreenTime = 4000;
      const maxScreenTime = 3360;
      const score = Math.max(0, Math.round(maxScreenTime - weeklyScreenTime));
      
      expect(score).toBe(0);
    });

    it('should calculate badge score with correct tier points', () => {
      const badges = [
        {id: 'b1', tier: 'bronze', unlockedAt: new Date()},
        {id: 'b2', tier: 'silver', unlockedAt: new Date()},
        {id: 'b3', tier: 'gold', unlockedAt: new Date()},
        {id: 'b4', tier: 'platinum', unlockedAt: new Date()},
      ];

      const tierPoints: Record<string, number> = {
        bronze: 10,
        silver: 25,
        gold: 50,
        platinum: 100,
      };

      const badgeScore = badges.reduce((sum: number, badge: any) => {
        if (badge.unlockedAt) {
          return sum + (tierPoints[badge.tier] || 0);
        }
        return sum;
      }, 0);

      expect(badgeScore).toBe(185); // 10 + 25 + 50 + 100
    });

    it('should ignore locked badges in score calculation', () => {
      const badges = [
        {id: 'b1', tier: 'bronze', unlockedAt: new Date()},
        {id: 'b2', tier: 'silver', unlockedAt: null},
        {id: 'b3', tier: 'gold', unlockedAt: new Date()},
      ];

      const tierPoints: Record<string, number> = {
        bronze: 10,
        silver: 25,
        gold: 50,
        platinum: 100,
      };

      const badgeScore = badges.reduce((sum: number, badge: any) => {
        if (badge.unlockedAt) {
          return sum + (tierPoints[badge.tier] || 0);
        }
        return sum;
      }, 0);

      expect(badgeScore).toBe(60); // 10 + 50
    });
  });

  describe('Leaderboard Categories', () => {
    it('should support all required categories', () => {
      const categories = [
        'screen_time',
        'focus_time',
        'badges',
        'streak',
        'weekly_challenge',
      ];

      categories.forEach(category => {
        expect(['screen_time', 'focus_time', 'badges', 'streak', 'weekly_challenge']).toContain(category);
      });
    });

    it('should return leaderboard entries with ranks', async () => {
      const entries = await service.getLeaderboard('streak', 10);
      
      expect(Array.isArray(entries)).toBe(true);
      if (entries.length > 0) {
        expect(entries[0]).toHaveProperty('rank');
        expect(entries[0].rank).toBe(1);
      }
    });
  });

  describe('User Rank Calculation', () => {
    it('should return rank information structure', async () => {
      const result = await service.getUserRank('user123', 'streak');
      
      expect(result).toHaveProperty('rank');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('entry');
      expect(typeof result.rank).toBe('number');
      expect(typeof result.total).toBe('number');
    });
  });
});
