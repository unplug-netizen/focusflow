/**
 * Firebase Cloud Functions - Index
 * 
 * Exports all Cloud Functions for deployment
 */

import * as functions from 'firebase-functions';

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

// Export config for Firebase
export const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '256MB' as const,
};

// Set runtime options for all functions
export const configureFunctions = () => {
  return functions.runWith(runtimeOpts);
};
