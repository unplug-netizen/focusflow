/**
 * Firebase Cloud Functions - Index
 * 
 * Exports all Cloud Functions for deployment
 */

import * as functions from 'firebase-functions';

// Export services for external use
export {LeaderboardService, leaderboardService} from './services/leaderboardService';
export {PushNotificationService, pushNotificationService} from './services/pushNotificationService';
export {AppUsageTracker, appUsageTracker} from './services/appUsageTracker';
export {BadgeVerificationSystem, createBadgeVerificationSystem} from './services/badgeVerificationSystem';
export {AnalyticsService, analyticsService} from './services/analyticsService';
export {ChallengeService, createChallengeService} from './services/challengeService';

// Export utilities
export {
  checkRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  cleanupRateLimiterStore,
  withRateLimit,
  rateLimitConfigs,
} from './utils/rateLimiter';

export {
  logError,
  withRetry,
  withErrorHandling,
  getRecentErrors,
  getErrorStats,
  clearErrorLog,
  createLogger,
} from './utils/errorTracker';

export {
  validateString,
  validateNumber,
  validateArray,
  validateEnum,
  validateDateString,
  combineValidations,
  assertValid,
  sanitizeString,
  validateFcmToken,
  validateUserId,
} from './utils/validation';

// Firestore triggers
import {
  onUserStatsUpdate,
  onFocusSessionComplete,
  onDailyStatsUpdate,
  onUserCreate,
  onBlockedAttempt,
} from './triggers/firestoreTriggers';

// Scheduled functions
import {
  dailySummaryNotification,
  streakReminderCheck,
  dailyLeaderboardUpdate,
  weeklyChallengeReset,
  cleanupOldLogs,
  processQueuedNotifications,
  dailyBadgeCheck,
} from './triggers/scheduledTriggers';

// HTTP callable functions
import {
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
} from './triggers/httpFunctions';

// Additional HTTP functions
import {
  getUserProfile,
  updateUserProfile,
  startFocusSession,
  completeFocusSession,
  logBlockedAttempt,
  getAllRanks,
  getFriendsLeaderboard,
  sendTestNotification,
  getAppInsights,
} from './triggers/additionalFunctions';

// Export Firestore triggers
export {
  onUserStatsUpdate,
  onFocusSessionComplete,
  onDailyStatsUpdate,
  onUserCreate,
  onBlockedAttempt,
};

// Export scheduled functions
export {
  dailySummaryNotification,
  streakReminderCheck,
  dailyLeaderboardUpdate,
  weeklyChallengeReset,
  cleanupOldLogs,
  processQueuedNotifications,
  dailyBadgeCheck,
};

// Export HTTP callable functions
export {
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
};

// Export additional HTTP functions
export {
  getUserProfile,
  updateUserProfile,
  startFocusSession,
  completeFocusSession,
  logBlockedAttempt,
  getAllRanks,
  getFriendsLeaderboard,
  sendTestNotification,
  getAppInsights,
};

// Export config for Firebase
export const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '256MB' as const,
};

// Set runtime options for all functions
export const configureFunctions = () => {
  return functions.runWith(runtimeOpts);
};
