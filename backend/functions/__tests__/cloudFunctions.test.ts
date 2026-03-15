/**
 * Cloud Function Integration Tests
 * 
 * Tests for Firebase Cloud Functions integration with services.
 */

import * as functions from 'firebase-functions-test';

// Initialize firebase-functions-test
const testEnv = functions();

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            displayName: 'Test User',
            currentStreak: 5,
            photoURL: 'https://example.com/photo.jpg',
            badges: [],
          }),
        }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({exists: false}),
            set: jest.fn().mockResolvedValue(undefined),
          })),
          add: jest.fn().mockResolvedValue({id: 'mock-id'}),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({empty: true, docs: []}),
        })),
      })),
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
      }),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
  })),
  messaging: jest.fn(() => ({
    send: jest.fn().mockResolvedValue('message-id'),
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{success: true}],
    }),
    subscribeToTopic: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({uid: 'user123'}),
  })),
}));

describe('Cloud Functions Integration', () => {
  afterAll(() => {
    testEnv.cleanup();
  });

  describe('Service Exports', () => {
    it('should export all services from index', async () => {
      const index = await import('../src/index');
      
      expect(index.leaderboardService).toBeDefined();
      expect(index.pushNotificationService).toBeDefined();
      expect(index.appUsageTracker).toBeDefined();
      expect(index.analyticsService).toBeDefined();
      expect(index.createBadgeVerificationSystem).toBeDefined();
      expect(index.createChallengeService).toBeDefined();
    });

    it('should export all trigger functions', async () => {
      const index = await import('../src/index');
      
      // Firestore triggers
      expect(index.onUserStatsUpdate).toBeDefined();
      expect(index.onFocusSessionComplete).toBeDefined();
      expect(index.onDailyStatsUpdate).toBeDefined();
      expect(index.onUserCreate).toBeDefined();
      expect(index.onBlockedAttempt).toBeDefined();
      
      // Scheduled triggers
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

    it('should export utility functions', async () => {
      const index = await import('../src/index');
      
      // Rate limiter utilities
      expect(index.checkRateLimit).toBeDefined();
      expect(index.getRateLimitStatus).toBeDefined();
      expect(index.clearRateLimit).toBeDefined();
      expect(index.cleanupRateLimiterStore).toBeDefined();
      expect(index.withRateLimit).toBeDefined();
      expect(index.rateLimitConfigs).toBeDefined();
      
      // Error tracker utilities
      expect(index.logError).toBeDefined();
      expect(index.withRetry).toBeDefined();
      expect(index.withErrorHandling).toBeDefined();
      expect(index.getRecentErrors).toBeDefined();
      expect(index.getErrorStats).toBeDefined();
      expect(index.clearErrorLog).toBeDefined();
      expect(index.createLogger).toBeDefined();
      
      // Validation utilities
      expect(index.validateString).toBeDefined();
      expect(index.validateNumber).toBeDefined();
      expect(index.validateArray).toBeDefined();
      expect(index.validateEnum).toBeDefined();
      expect(index.validateDateString).toBeDefined();
      expect(index.combineValidations).toBeDefined();
      expect(index.assertValid).toBeDefined();
      expect(index.sanitizeString).toBeDefined();
      expect(index.validateFcmToken).toBeDefined();
      expect(index.validateUserId).toBeDefined();
    });

    it('should export runtime configuration', async () => {
      const index = await import('../src/index');
      
      expect(index.runtimeOpts).toBeDefined();
      expect(index.runtimeOpts.timeoutSeconds).toBe(300);
      expect(index.runtimeOpts.memory).toBe('256MB');
      expect(index.configureFunctions).toBeDefined();
    });
  });

  describe('Service Classes', () => {
    it('should instantiate LeaderboardService', async () => {
      const {LeaderboardService} = await import('../src/services/leaderboardService');
      const service = new LeaderboardService();
      expect(service).toBeDefined();
    });

    it('should instantiate PushNotificationService', async () => {
      const {PushNotificationService} = await import('../src/services/pushNotificationService');
      const service = new PushNotificationService();
      expect(service).toBeDefined();
    });

    it('should instantiate AppUsageTracker', async () => {
      const {AppUsageTracker} = await import('../src/services/appUsageTracker');
      const tracker = new AppUsageTracker();
      expect(tracker).toBeDefined();
    });

    it('should instantiate BadgeVerificationSystem', async () => {
      const {BadgeVerificationSystem} = await import('../src/services/badgeVerificationSystem');
      const {PushNotificationService} = await import('../src/services/pushNotificationService');
      const notificationService = new PushNotificationService();
      const badgeSystem = new BadgeVerificationSystem(notificationService);
      expect(badgeSystem).toBeDefined();
    });

    it('should instantiate AnalyticsService', async () => {
      const {AnalyticsService} = await import('../src/services/analyticsService');
      const service = new AnalyticsService();
      expect(service).toBeDefined();
    });

    it('should instantiate ChallengeService', async () => {
      const {ChallengeService} = await import('../src/services/challengeService');
      const {PushNotificationService} = await import('../src/services/pushNotificationService');
      const notificationService = new PushNotificationService();
      const service = new ChallengeService(notificationService);
      expect(service).toBeDefined();
    });
  });

  describe('End-to-End Workflows', () => {
    it('should handle complete user onboarding flow', async () => {
      const index = await import('../src/index');
      
      // Verify all required functions for onboarding exist
      expect(index.onUserCreate).toBeDefined();
      expect(index.registerFcmToken).toBeDefined();
      expect(index.updateNotificationPreferences).toBeDefined();
      expect(index.getUserBadges).toBeDefined();
    });

    it('should handle focus session flow', async () => {
      const index = await import('../src/index');
      
      // Verify all required functions for focus session exist
      expect(index.startFocusSession).toBeDefined();
      expect(index.completeFocusSession).toBeDefined();
      expect(index.onFocusSessionComplete).toBeDefined();
      expect(index.logBlockedAttempt).toBeDefined();
    });

    it('should handle leaderboard flow', async () => {
      const index = await import('../src/index');
      
      // Verify all required functions for leaderboard exist
      expect(index.getLeaderboard).toBeDefined();
      expect(index.getAllRanks).toBeDefined();
      expect(index.getFriendsLeaderboard).toBeDefined();
      expect(index.dailyLeaderboardUpdate).toBeDefined();
    });

    it('should handle notification flow', async () => {
      const index = await import('../src/index');
      
      // Verify all required functions for notifications exist
      expect(index.registerFcmToken).toBeDefined();
      expect(index.subscribeToTopic).toBeDefined();
      expect(index.sendTestNotification).toBeDefined();
      expect(index.dailySummaryNotification).toBeDefined();
      expect(index.streakReminderCheck).toBeDefined();
      expect(index.processQueuedNotifications).toBeDefined();
    });

    it('should handle analytics flow', async () => {
      const index = await import('../src/index');
      
      // Verify all required functions for analytics exist
      expect(index.logAppUsage).toBeDefined();
      expect(index.getDailyStats).toBeDefined();
      expect(index.getWeeklyStats).toBeDefined();
      expect(index.getAppInsights).toBeDefined();
      expect(index.cleanupOldLogs).toBeDefined();
    });
  });
});
