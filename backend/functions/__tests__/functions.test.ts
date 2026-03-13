/**
 * Tests für Cloud Functions
 * 
 * Diese Tests prüfen die Module und Exporte.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock firebase-functions
jest.mock('firebase-functions', () => ({
  firestore: {
    document: jest.fn(() => ({
      onUpdate: jest.fn().mockReturnValue('onUpdateFunction'),
      onCreate: jest.fn().mockReturnValue('onCreateFunction'),
      onWrite: jest.fn().mockReturnValue('onWriteFunction'),
    })),
  },
  pubsub: {
    schedule: jest.fn(() => ({
      timeZone: jest.fn(() => ({
        onRun: jest.fn().mockReturnValue('scheduledFunction'),
      })),
    })),
  },
  https: {
    onCall: jest.fn().mockReturnValue('callableFunction'),
    onRequest: jest.fn().mockReturnValue('requestFunction'),
  },
  runWith: jest.fn(() => ({
    firestore: {
      document: jest.fn(() => ({
        onUpdate: jest.fn(),
        onCreate: jest.fn(),
        onWrite: jest.fn(),
      })),
    },
    https: {
      onCall: jest.fn(),
    },
  })),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

// Mock Firebase Admin
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

describe('Cloud Functions - Module Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load firestoreTriggers module without errors', () => {
    expect(() => {
      require('../src/triggers/firestoreTriggers');
    }).not.toThrow();
  });

  it('should load scheduledTriggers module without errors', () => {
    expect(() => {
      require('../src/triggers/scheduledTriggers');
    }).not.toThrow();
  });

  it('should load httpFunctions module without errors', () => {
    expect(() => {
      require('../src/triggers/httpFunctions');
    }).not.toThrow();
  });

  it('should load additionalFunctions module without errors', () => {
    expect(() => {
      require('../src/triggers/additionalFunctions');
    }).not.toThrow();
  });

  it('should load index module without errors', () => {
    expect(() => {
      require('../src/index');
    }).not.toThrow();
  });
});

describe('Cloud Functions - Trigger Definitions', () => {
  it('should define all Firestore triggers', () => {
    const {onUserStatsUpdate, onFocusSessionComplete, onDailyStatsUpdate, onUserCreate, onBlockedAttempt} =
      require('../src/triggers/firestoreTriggers');

    expect(onUserStatsUpdate).toBeDefined();
    expect(onFocusSessionComplete).toBeDefined();
    expect(onDailyStatsUpdate).toBeDefined();
    expect(onUserCreate).toBeDefined();
    expect(onBlockedAttempt).toBeDefined();
  });

  it('should define all scheduled triggers', () => {
    const {
      dailySummaryNotification,
      streakReminderCheck,
      dailyLeaderboardUpdate,
      weeklyChallengeReset,
      cleanupOldLogs,
      processQueuedNotifications,
      dailyBadgeCheck,
    } = require('../src/triggers/scheduledTriggers');

    expect(dailySummaryNotification).toBeDefined();
    expect(streakReminderCheck).toBeDefined();
    expect(dailyLeaderboardUpdate).toBeDefined();
    expect(weeklyChallengeReset).toBeDefined();
    expect(cleanupOldLogs).toBeDefined();
    expect(processQueuedNotifications).toBeDefined();
    expect(dailyBadgeCheck).toBeDefined();
  });

  it('should define all HTTP callable functions', () => {
    const {
      registerFcmToken,
      unregisterFcmToken,
      getLeaderboard,
      logAppUsage,
      getUserBadges,
      checkBadges,
      subscribeToTopic,
      unsubscribeFromTopic,
      updateNotificationPreferences,
      getDailyStats,
      getWeeklyStats,
    } = require('../src/triggers/httpFunctions');

    expect(registerFcmToken).toBeDefined();
    expect(unregisterFcmToken).toBeDefined();
    expect(getLeaderboard).toBeDefined();
    expect(logAppUsage).toBeDefined();
    expect(getUserBadges).toBeDefined();
    expect(checkBadges).toBeDefined();
    expect(subscribeToTopic).toBeDefined();
    expect(unsubscribeFromTopic).toBeDefined();
    expect(updateNotificationPreferences).toBeDefined();
    expect(getDailyStats).toBeDefined();
    expect(getWeeklyStats).toBeDefined();
  });

  it('should define all additional HTTP functions', () => {
    const {
      getUserProfile,
      updateUserProfile,
      startFocusSession,
      completeFocusSession,
      logBlockedAttempt,
      getAllRanks,
      getFriendsLeaderboard,
      sendTestNotification,
      getAppInsights,
    } = require('../src/triggers/additionalFunctions');

    expect(getUserProfile).toBeDefined();
    expect(updateUserProfile).toBeDefined();
    expect(startFocusSession).toBeDefined();
    expect(completeFocusSession).toBeDefined();
    expect(logBlockedAttempt).toBeDefined();
    expect(getAllRanks).toBeDefined();
    expect(getFriendsLeaderboard).toBeDefined();
    expect(sendTestNotification).toBeDefined();
    expect(getAppInsights).toBeDefined();
  });
});

describe('Index Exports', () => {
  it('should export all required functions and services', () => {
    const index = require('../src/index');

    // Services
    expect(index.LeaderboardService).toBeDefined();
    expect(index.PushNotificationService).toBeDefined();
    expect(index.AppUsageTracker).toBeDefined();
    expect(index.BadgeVerificationSystem).toBeDefined();
    expect(index.AnalyticsService).toBeDefined();
    expect(index.ChallengeService).toBeDefined();

    // Firestore triggers
    expect(index.onUserStatsUpdate).toBeDefined();
    expect(index.onFocusSessionComplete).toBeDefined();
    expect(index.onDailyStatsUpdate).toBeDefined();
    expect(index.onUserCreate).toBeDefined();
    expect(index.onBlockedAttempt).toBeDefined();

    // Scheduled functions
    expect(index.dailySummaryNotification).toBeDefined();
    expect(index.streakReminderCheck).toBeDefined();
    expect(index.dailyLeaderboardUpdate).toBeDefined();
    expect(index.weeklyChallengeReset).toBeDefined();
    expect(index.cleanupOldLogs).toBeDefined();
    expect(index.processQueuedNotifications).toBeDefined();
    expect(index.dailyBadgeCheck).toBeDefined();

    // HTTP functions
    expect(index.registerFcmToken).toBeDefined();
    expect(index.unregisterFcmToken).toBeDefined();
    expect(index.getLeaderboard).toBeDefined();
    expect(index.logAppUsage).toBeDefined();
    expect(index.getUserBadges).toBeDefined();
    expect(index.checkBadges).toBeDefined();
    expect(index.subscribeToTopic).toBeDefined();
    expect(index.unsubscribeFromTopic).toBeDefined();
    expect(index.updateNotificationPreferences).toBeDefined();
    expect(index.getDailyStats).toBeDefined();
    expect(index.getWeeklyStats).toBeDefined();

    // Additional functions
    expect(index.getUserProfile).toBeDefined();
    expect(index.updateUserProfile).toBeDefined();
    expect(index.startFocusSession).toBeDefined();
    expect(index.completeFocusSession).toBeDefined();
    expect(index.logBlockedAttempt).toBeDefined();
    expect(index.getAllRanks).toBeDefined();
    expect(index.getFriendsLeaderboard).toBeDefined();
    expect(index.sendTestNotification).toBeDefined();
    expect(index.getAppInsights).toBeDefined();
  });

  it('should export runtime configuration', () => {
    const index = require('../src/index');
    
    expect(index.runtimeOpts).toBeDefined();
    expect(index.runtimeOpts.timeoutSeconds).toBe(300);
    expect(index.runtimeOpts.memory).toBe('256MB');
  });
});

describe('Service Exports', () => {
  it('should export singleton instances', () => {
    const index = require('../src/index');

    expect(index.leaderboardService).toBeDefined();
    expect(index.pushNotificationService).toBeDefined();
    expect(index.appUsageTracker).toBeDefined();
    expect(index.analyticsService).toBeDefined();
  });

  it('should export factory functions', () => {
    const index = require('../src/index');

    expect(typeof index.createBadgeVerificationSystem).toBe('function');
    expect(typeof index.createChallengeService).toBe('function');
  });
});

describe('Service Classes', () => {
  it('should create LeaderboardService instance', () => {
    const {LeaderboardService} = require('../src/services/leaderboardService');
    const service = new LeaderboardService();
    expect(service).toBeDefined();
  });

  it('should create PushNotificationService instance', () => {
    const {PushNotificationService} = require('../src/services/pushNotificationService');
    const service = new PushNotificationService();
    expect(service).toBeDefined();
  });

  it('should create AppUsageTracker instance', () => {
    const {AppUsageTracker} = require('../src/services/appUsageTracker');
    const tracker = new AppUsageTracker();
    expect(tracker).toBeDefined();
  });
});
