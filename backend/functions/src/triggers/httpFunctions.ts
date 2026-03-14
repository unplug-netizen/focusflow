/**
 * Firebase Cloud Functions - HTTP Callable Functions
 * 
 * These functions can be called directly from the client app
 * for operations like registering tokens, updating scores, etc.
 */

import * as functions from 'firebase-functions';
import {db} from '../config/firebase';
import {leaderboardService, LeaderboardCategory} from '../services/leaderboardService';
import {pushNotificationService} from '../services/pushNotificationService';
import {appUsageTracker} from '../services/appUsageTracker';
import {createBadgeVerificationSystem} from '../services/badgeVerificationSystem';

const badgeSystem = createBadgeVerificationSystem(pushNotificationService);

/**
 * Register FCM token for push notifications
 */
export const registerFcmToken = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {token, platform} = data;

  if (!token || !platform) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Token and platform are required'
    );
  }

  if (platform !== 'ios' && platform !== 'android') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Platform must be ios or android'
    );
  }

  try {
    await pushNotificationService.registerToken(
      context.auth.uid,
      token,
      platform
    );
    return {success: true};
  } catch (error: unknown) {
    console.error('Error registering token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Unregister FCM token
 */
export const unregisterFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {token} = data;

  if (!token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Token is required'
    );
  }

  try {
    await pushNotificationService.unregisterToken(context.auth.uid, token);
    return {success: true};
  } catch (error: unknown) {
    console.error('Error unregistering token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Get leaderboard for a category
 */
export const getLeaderboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {category, limit = 100} = data;

  if (!category) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Category is required'
    );
  }

  const validCategories: LeaderboardCategory[] = [
    'screen_time',
    'focus_time',
    'badges',
    'streak',
    'weekly_challenge',
  ];

  if (!validCategories.includes(category)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid category'
    );
  }

  try {
    const entries = await leaderboardService.getLeaderboard(category, limit);
    const userRank = await leaderboardService.getUserRank(
      context.auth.uid,
      category
    );

    return {
      entries,
      userRank: userRank.rank,
      totalParticipants: userRank.total,
    };
  } catch (error: unknown) {
    console.error('Error getting leaderboard:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Log app usage
 */
export const logAppUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {packageName, appName, usageTime, category, isBlocked} = data;

  if (!packageName || !appName || usageTime === undefined) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'packageName, appName, and usageTime are required'
    );
  }

  try {
    await appUsageTracker.logUsage(context.auth.uid, {
      packageName,
      appName,
      usageTime,
      category: category || 'other',
      isBlocked: isBlocked || false,
    });

    return {success: true};
  } catch (error: unknown) {
    console.error('Error logging app usage:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Get user's badge progress
 */
export const getUserBadges = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    const badges = await badgeSystem.getBadgeProgress(context.auth.uid);
    return {badges};
  } catch (error: unknown) {
    console.error('Error getting user badges:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Check and update badges
 */
export const checkBadges = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    const newBadges = await badgeSystem.checkAndAwardBadges(context.auth.uid);
    return {newBadges};
  } catch (error: unknown) {
    console.error('Error checking badges:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Subscribe to topic
 */
export const subscribeToTopic = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {topic} = data;

  if (!topic) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Topic is required'
    );
  }

  try {
    await pushNotificationService.subscribeToTopic(context.auth.uid, topic);
    return {success: true};
  } catch (error: unknown) {
    console.error('Error subscribing to topic:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Unsubscribe from topic
 */
export const unsubscribeFromTopic = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {topic} = data;

  if (!topic) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Topic is required'
    );
  }

  try {
    await pushNotificationService.unsubscribeFromTopic(context.auth.uid, topic);
    return {success: true};
  } catch (error: unknown) {
    console.error('Error unsubscribing from topic:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const {
      streakReminders,
      achievementNotifications,
      leaderboardUpdates,
      dailySummary,
      challengeReminders,
      limitWarnings,
      focusReminders,
      quietHoursStart,
      quietHoursEnd,
    } = data;

    try {
      const prefsRef = db
        .collection('users')
        .doc(context.auth.uid)
        .collection('settings')
        .doc('notifications');

      await prefsRef.set(
        {
          ...(streakReminders !== undefined && {streakReminders}),
          ...(achievementNotifications !== undefined && {achievementNotifications}),
          ...(leaderboardUpdates !== undefined && {leaderboardUpdates}),
          ...(dailySummary !== undefined && {dailySummary}),
          ...(challengeReminders !== undefined && {challengeReminders}),
          ...(limitWarnings !== undefined && {limitWarnings}),
          ...(focusReminders !== undefined && {focusReminders}),
          ...(quietHoursStart !== undefined && {quietHoursStart}),
          ...(quietHoursEnd !== undefined && {quietHoursEnd}),
          updatedAt: new Date(),
        },
        {merge: true}
      );

      return {success: true};
    } catch (error: unknown) {
      console.error('Error updating preferences:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new functions.https.HttpsError('internal', message);
    }
  }
);

/**
 * Get daily usage stats
 */
export const getDailyStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {date} = data;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const stats = await appUsageTracker.getDailyStats(
      context.auth.uid,
      targetDate
    );
    return {stats};
  } catch (error: unknown) {
    console.error('Error getting daily stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Get weekly usage stats
 */
export const getWeeklyStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {endDate} = data;
  const targetDate = endDate ? new Date(endDate) : new Date();

  try {
    const stats = await appUsageTracker.getWeeklyStats(
      context.auth.uid,
      targetDate
    );
    return {stats};
  } catch (error: unknown) {
    console.error('Error getting weekly stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});
