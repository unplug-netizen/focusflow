/**
 * Integration Tests für HTTP Callable Functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firebase Admin
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
            badges: [{id: 'badge1', tier: 'bronze', unlockedAt: new Date()}],
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
          })),
          add: jest.fn().mockResolvedValue({id: 'mock-id'}),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [{
              data: () => ({
                token: 'token1',
                platform: 'ios',
                active: true,
              }),
            }],
            size: 1,
          }),
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

// Mock firebase-functions
jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn((handler) => handler),
    onRequest: jest.fn((handler) => handler),
  },
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

describe('HTTP Functions - Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerFcmToken', () => {
    it('should require authentication', async () => {
      const {registerFcmToken} = require('../src/triggers/httpFunctions');
      const context = {auth: null};

      await expect(registerFcmToken({}, context)).rejects.toThrow();
    });

    it('should require token and platform', async () => {
      const {registerFcmToken} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(registerFcmToken({}, context)).rejects.toThrow();
      await expect(registerFcmToken({token: 'abc'}, context)).rejects.toThrow();
    });

    it('should validate platform values', async () => {
      const {registerFcmToken} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(
        registerFcmToken({token: 'abc', platform: 'invalid'}, context)
      ).rejects.toThrow();
    });

    it('should accept valid ios platform', async () => {
      const {registerFcmToken} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await registerFcmToken(
        {token: 'valid-token', platform: 'ios'},
        context
      );

      expect(result).toEqual({success: true});
    });

    it('should accept valid android platform', async () => {
      const {registerFcmToken} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await registerFcmToken(
        {token: 'valid-token', platform: 'android'},
        context
      );

      expect(result).toEqual({success: true});
    });
  });

  describe('getLeaderboard', () => {
    it('should require category parameter', async () => {
      const {getLeaderboard} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(getLeaderboard({}, context)).rejects.toThrow();
    });

    it('should validate category values', async () => {
      const {getLeaderboard} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(
        getLeaderboard({category: 'invalid_category'}, context)
      ).rejects.toThrow();
    });

    it('should accept valid categories', async () => {
      const {getLeaderboard} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const validCategories = [
        'screen_time',
        'focus_time',
        'badges',
        'streak',
        'weekly_challenge',
      ];

      for (const category of validCategories) {
        const result = await getLeaderboard({category}, context);
        expect(result).toHaveProperty('entries');
        expect(result).toHaveProperty('userRank');
        expect(result).toHaveProperty('totalParticipants');
      }
    });

    it('should use default limit of 100', async () => {
      const {getLeaderboard} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getLeaderboard({category: 'streak'}, context);
      expect(result).toBeDefined();
    });

    it('should accept custom limit', async () => {
      const {getLeaderboard} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getLeaderboard(
        {category: 'streak', limit: 50},
        context
      );
      expect(result).toBeDefined();
    });
  });

  describe('logAppUsage', () => {
    it('should require packageName and appName', async () => {
      const {logAppUsage} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(logAppUsage({}, context)).rejects.toThrow();
      await expect(
        logAppUsage({packageName: 'com.test'}, context)
      ).rejects.toThrow();
    });

    it('should require usageTime', async () => {
      const {logAppUsage} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(
        logAppUsage({packageName: 'com.test', appName: 'Test'}, context)
      ).rejects.toThrow();
    });

    it('should accept valid usage data', async () => {
      const {logAppUsage} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await logAppUsage(
        {
          packageName: 'com.instagram.android',
          appName: 'Instagram',
          usageTime: 30,
          category: 'social',
          isBlocked: false,
        },
        context
      );

      expect(result).toEqual({success: true});
    });

    it('should use default category', async () => {
      const {logAppUsage} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await logAppUsage(
        {
          packageName: 'com.test.app',
          appName: 'Test App',
          usageTime: 10,
        },
        context
      );

      expect(result).toEqual({success: true});
    });
  });

  describe('subscribeToTopic / unsubscribeFromTopic', () => {
    it('should require topic parameter', async () => {
      const {subscribeToTopic, unsubscribeFromTopic} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(subscribeToTopic({}, context)).rejects.toThrow();
      await expect(unsubscribeFromTopic({}, context)).rejects.toThrow();
    });

    it('should accept valid topic', async () => {
      const {subscribeToTopic, unsubscribeFromTopic} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const subscribeResult = await subscribeToTopic(
        {topic: 'weekly_challenge'},
        context
      );
      expect(subscribeResult).toEqual({success: true});

      const unsubscribeResult = await unsubscribeFromTopic(
        {topic: 'weekly_challenge'},
        context
      );
      expect(unsubscribeResult).toEqual({success: true});
    });
  });

  describe('getDailyStats', () => {
    it('should use today as default date', async () => {
      const {getDailyStats} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getDailyStats({}, context);
      expect(result).toHaveProperty('stats');
    });

    it('should accept specific date', async () => {
      const {getDailyStats} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getDailyStats({date: '2024-03-13'}, context);
      expect(result).toHaveProperty('stats');
    });
  });

  describe('getWeeklyStats', () => {
    it('should use today as default end date', async () => {
      const {getWeeklyStats} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getWeeklyStats({}, context);
      expect(result).toHaveProperty('stats');
      expect(Array.isArray(result.stats)).toBe(true);
    });

    it('should accept specific end date', async () => {
      const {getWeeklyStats} = require('../src/triggers/httpFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getWeeklyStats(
        {endDate: '2024-03-13'},
        context
      );
      expect(result).toHaveProperty('stats');
    });
  });
});

describe('HTTP Functions - Additional Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return complete user profile', async () => {
      const {getUserProfile} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getUserProfile({}, context);

      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('todayStats');
      expect(result).toHaveProperty('weeklySummary');
      expect(result).toHaveProperty('badges');
    });

    it('should require authentication', async () => {
      const {getUserProfile} = require('../src/triggers/additionalFunctions');
      const context = {auth: null};

      await expect(getUserProfile({}, context)).rejects.toThrow();
    });
  });

  describe('updateUserProfile', () => {
    it('should update allowed fields', async () => {
      const {updateUserProfile} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await updateUserProfile(
        {
          displayName: 'New Name',
          dailyGoal: 120,
        },
        context
      );

      expect(result).toEqual({success: true});
    });

    it('should ignore undefined fields', async () => {
      const {updateUserProfile} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await updateUserProfile({}, context);
      expect(result).toEqual({success: true});
    });
  });

  describe('startFocusSession', () => {
    it('should require duration', async () => {
      const {startFocusSession} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(startFocusSession({}, context)).rejects.toThrow();
    });

    it('should validate minimum duration', async () => {
      const {startFocusSession} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(
        startFocusSession({duration: 0}, context)
      ).rejects.toThrow();
    });

    it('should create session with valid data', async () => {
      const {startFocusSession} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await startFocusSession(
        {
          duration: 25,
          blockedApps: ['com.instagram.android'],
          sessionType: 'pomodoro',
        },
        context
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('sessionId');
    });
  });

  describe('completeFocusSession', () => {
    it('should require sessionId', async () => {
      const {completeFocusSession} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(completeFocusSession({}, context)).rejects.toThrow();
    });
  });

  describe('logBlockedAttempt', () => {
    it('should require packageName and appName', async () => {
      const {logBlockedAttempt} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      await expect(logBlockedAttempt({}, context)).rejects.toThrow();
    });

    it('should log attempt with valid data', async () => {
      const {logBlockedAttempt} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await logBlockedAttempt(
        {
          packageName: 'com.instagram.android',
          appName: 'Instagram',
          category: 'social',
          attemptedDuration: 5,
        },
        context
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('attemptId');
    });
  });

  describe('getAllRanks', () => {
    it('should return ranks for all categories', async () => {
      const {getAllRanks} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getAllRanks({}, context);

      expect(result).toHaveProperty('ranks');
      expect(Array.isArray(result.ranks)).toBe(true);
      expect(result.ranks.length).toBe(5); // All categories
    });

    it('should include category, rank, total, and score for each', async () => {
      const {getAllRanks} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getAllRanks({}, context);

      result.ranks.forEach((rank: any) => {
        expect(rank).toHaveProperty('category');
        expect(rank).toHaveProperty('rank');
        expect(rank).toHaveProperty('total');
        expect(rank).toHaveProperty('score');
      });
    });
  });

  describe('getFriendsLeaderboard', () => {
    it('should use default category', async () => {
      const {getFriendsLeaderboard} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getFriendsLeaderboard({}, context);

      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('category', 'streak');
    });

    it('should accept friendIds array', async () => {
      const {getFriendsLeaderboard} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getFriendsLeaderboard(
        {
          category: 'focus_time',
          friendIds: ['user456', 'user789'],
        },
        context
      );

      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('category', 'focus_time');
    });
  });

  describe('getAppInsights', () => {
    it('should use default of 7 days', async () => {
      const {getAppInsights} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getAppInsights({}, context);

      expect(result).toHaveProperty('period');
      expect(result.period.days).toBe(7);
    });

    it('should accept custom days parameter', async () => {
      const {getAppInsights} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getAppInsights({days: 14}, context);

      expect(result.period.days).toBe(14);
    });

    it('should return complete insights structure', async () => {
      const {getAppInsights} = require('../src/triggers/additionalFunctions');
      const context = {auth: {uid: 'user123'}};

      const result = await getAppInsights({}, context);

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('topApps');
      expect(result).toHaveProperty('topCategories');
      expect(Array.isArray(result.topApps)).toBe(true);
      expect(Array.isArray(result.topCategories)).toBe(true);
    });
  });
});
