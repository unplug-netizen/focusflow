/**
 * Firebase Cloud Functions - HTTP Callable Functions (Enhanced)
 * 
 * These functions can be called directly from the client app
 * for operations like registering tokens, updating scores, etc.
 * 
 * Enhanced with:
 * - Rate limiting for all endpoints
 * - Input validation with detailed error messages
 * - Structured error handling and logging
 */

import * as functions from 'firebase-functions';
import {db} from '../config/firebase';
import {leaderboardService, LeaderboardCategory} from '../services/leaderboardService';
import {pushNotificationService} from '../services/pushNotificationService';
import {appUsageTracker} from '../services/appUsageTracker';
import {createBadgeVerificationSystem} from '../services/badgeVerificationSystem';
import {withRateLimit} from '../utils/rateLimiter';
import {
  validateString,
  validateNumber,
  validateEnum,
  validateDateString,
  assertValid,
  sanitizeString,
  validateFcmToken,
} from '../utils/validation';
import {createLogger} from '../utils/errorTracker';

const badgeSystem = createBadgeVerificationSystem(pushNotificationService);
const logger = createLogger('httpFunctions');

// Valid categories for leaderboard
const VALID_CATEGORIES: LeaderboardCategory[] = [
  'screen_time',
  'focus_time',
  'badges',
  'streak',
  'weekly_challenge',
];

/**
 * Register FCM token for push notifications
 * Rate limit: 20 requests/minute (notifications)
 */
export const registerFcmToken = withRateLimit(
  async (data: {token: string; platform: 'ios' | 'android'}, context) => {
    const {token, platform} = data;

    // Validate inputs
    assertValid(validateFcmToken(token));
    assertValid(validateEnum(platform, 'platform', ['ios', 'android']));

    try {
      await pushNotificationService.registerToken(
        context.auth!.uid,
        sanitizeString(token),
        platform
      );
      
      logger.info('FCM token registered', { 
        userId: context.auth!.uid, 
        platform 
      });
      
      return {success: true};
    } catch (error) {
      logger.error(error as Error, 'registerFcmToken', { userId: context.auth!.uid });
      throw error;
    }
  },
  'notifications'
);

/**
 * Unregister FCM token
 * Rate limit: 20 requests/minute (notifications)
 */
export const unregisterFcmToken = withRateLimit(
  async (data: {token: string}, context) => {
    const {token} = data;

    // Validate inputs
    assertValid(validateString(token, 'token', { minLength: 10, maxLength: 500 }));

    try {
      await pushNotificationService.unregisterToken(
        context.auth!.uid,
        sanitizeString(token)
      );
      
      logger.info('FCM token unregistered', { userId: context.auth!.uid });
      
      return {success: true};
    } catch (error) {
      logger.error(error as Error, 'unregisterFcmToken', { userId: context.auth!.uid });
      throw error;
    }
  },
  'notifications'
);

/**
 * Get leaderboard for a category
 * Rate limit: 30 requests/minute (leaderboard)
 */
export const getLeaderboard = withRateLimit(
  async (data: {category: LeaderboardCategory; limit?: number}, context) => {
    const {category, limit = 100} = data;

    // Validate inputs
    assertValid(validateEnum(category, 'category', VALID_CATEGORIES));
    assertValid(validateNumber(limit, 'limit', { min: 1, max: 500, integer: true }));

    try {
      const entries = await leaderboardService.getLeaderboard(category, limit);
      const userRank = await leaderboardService.getUserRank(
        context.auth!.uid,
        category
      );

      logger.info('Leaderboard retrieved', { 
        userId: context.auth!.uid, 
        category,
        entryCount: entries.length 
      });

      return {
        entries,
        userRank: userRank.rank,
        totalParticipants: userRank.total,
      };
    } catch (error) {
      logger.error(error as Error, 'getLeaderboard', { 
        userId: context.auth!.uid, 
        category 
      });
      throw error;
    }
  },
  'leaderboard'
);

/**
 * Log app usage
 * Rate limit: 60 requests/minute (appUsage)
 */
export const logAppUsage = withRateLimit(
  async (data: {packageName: string; appName: string; usageTime: number; category?: string; isBlocked?: boolean}, context) => {
    const {packageName, appName, usageTime, category, isBlocked} = data;

    // Validate inputs
    assertValid(validateString(packageName, 'packageName', { minLength: 1, maxLength: 255 }));
    assertValid(validateString(appName, 'appName', { minLength: 1, maxLength: 100 }));
    assertValid(validateNumber(usageTime, 'usageTime', { min: 0, max: 1440, integer: true }));

    try {
      await appUsageTracker.logUsage(context.auth!.uid, {
        packageName: sanitizeString(packageName),
        appName: sanitizeString(appName),
        usageTime,
        category: category || 'other',
        isBlocked: isBlocked || false,
      });

      return {success: true};
    } catch (error) {
      logger.error(error as Error, 'logAppUsage', { 
        userId: context.auth!.uid, 
        packageName 
      });
      throw error;
    }
  },
  'appUsage'
);

/**
 * Get user's badge progress
 * Rate limit: 30 requests/minute (leaderboard)
 */
export const getUserBadges = withRateLimit(
  async (_data, context) => {
    try {
      const badges = await badgeSystem.getBadgeProgress(context.auth!.uid);
      
      logger.info('User badges retrieved', { 
        userId: context.auth!.uid, 
        badgeCount: badges.length 
      });
      
      return {badges};
    } catch (error) {
      logger.error(error as Error, 'getUserBadges', { userId: context.auth!.uid });
      throw error;
    }
  },
  'leaderboard'
);

/**
 * Check and update badges
 * Rate limit: 30 requests/minute (leaderboard)
 */
export const checkBadges = withRateLimit(
  async (_data, context) => {
    try {
      const newBadges = await badgeSystem.checkAndAwardBadges(context.auth!.uid);
      
      if (newBadges.length > 0) {
        logger.info('New badges awarded', { 
          userId: context.auth!.uid, 
          newBadges 
        });
      }
      
      return {newBadges};
    } catch (error) {
      logger.error(error as Error, 'checkBadges', { userId: context.auth!.uid });
      throw error;
    }
  },
  'leaderboard'
);

/**
 * Subscribe to topic
 * Rate limit: 20 requests/minute (notifications)
 */
export const subscribeToTopic = withRateLimit(
  async (data: {topic: string}, context) => {
    const {topic} = data;

    // Validate inputs
    assertValid(validateString(topic, 'topic', { minLength: 1, maxLength: 100 }));

    try {
      await pushNotificationService.subscribeToTopic(
        context.auth!.uid,
        sanitizeString(topic)
      );
      
      logger.info('Subscribed to topic', { 
        userId: context.auth!.uid, 
        topic 
      });
      
      return {success: true};
    } catch (error) {
      logger.error(error as Error, 'subscribeToTopic', { 
        userId: context.auth!.uid, 
        topic 
      });
      throw error;
    }
  },
  'notifications'
);

/**
 * Unsubscribe from topic
 * Rate limit: 20 requests/minute (notifications)
 */
export const unsubscribeFromTopic = withRateLimit(
  async (data: {topic: string}, context) => {
    const {topic} = data;

    // Validate inputs
    assertValid(validateString(topic, 'topic', { minLength: 1, maxLength: 100 }));

    try {
      await pushNotificationService.unsubscribeFromTopic(
        context.auth!.uid,
        sanitizeString(topic)
      );
      
      logger.info('Unsubscribed from topic', { 
        userId: context.auth!.uid, 
        topic 
      });
      
      return {success: true};
    } catch (error) {
      logger.error(error as Error, 'unsubscribeFromTopic', { 
        userId: context.auth!.uid, 
        topic 
      });
      throw error;
    }
  },
  'notifications'
);

/**
 * Update notification preferences
 * Rate limit: 20 requests/minute (notifications)
 */
export const updateNotificationPreferences = withRateLimit(
  async (data: {
    streakReminders?: boolean;
    achievementNotifications?: boolean;
    leaderboardUpdates?: boolean;
    dailySummary?: boolean;
    challengeReminders?: boolean;
    limitWarnings?: boolean;
    focusReminders?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }, context) => {
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
        .doc(context.auth!.uid)
        .collection('settings')
        .doc('notifications');

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Only include defined values
      if (streakReminders !== undefined) updateData.streakReminders = Boolean(streakReminders);
      if (achievementNotifications !== undefined) updateData.achievementNotifications = Boolean(achievementNotifications);
      if (leaderboardUpdates !== undefined) updateData.leaderboardUpdates = Boolean(leaderboardUpdates);
      if (dailySummary !== undefined) updateData.dailySummary = Boolean(dailySummary);
      if (challengeReminders !== undefined) updateData.challengeReminders = Boolean(challengeReminders);
      if (limitWarnings !== undefined) updateData.limitWarnings = Boolean(limitWarnings);
      if (focusReminders !== undefined) updateData.focusReminders = Boolean(focusReminders);
      
      // Validate time format for quiet hours (HH:mm)
      if (quietHoursStart !== undefined) {
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quietHoursStart)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'quietHoursStart must be in HH:mm format'
          );
        }
        updateData.quietHoursStart = quietHoursStart;
      }
      
      if (quietHoursEnd !== undefined) {
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quietHoursEnd)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'quietHoursEnd must be in HH:mm format'
          );
        }
        updateData.quietHoursEnd = quietHoursEnd;
      }

      await prefsRef.set(updateData, {merge: true});

      logger.info('Notification preferences updated', { 
        userId: context.auth!.uid 
      });

      return {success: true};
    } catch (error) {
      logger.error(error as Error, 'updateNotificationPreferences', { 
        userId: context.auth!.uid 
      });
      throw error;
    }
  },
  'notifications'
);

/**
 * Get daily usage stats
 * Rate limit: 120 requests/minute (stats)
 */
export const getDailyStats = withRateLimit(
  async (data: {date?: string}, context) => {
    const {date} = data;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Validate date format
    assertValid(validateDateString(targetDate, 'date', { allowFuture: false }));

    try {
      const stats = await appUsageTracker.getDailyStats(
        context.auth!.uid,
        targetDate
      );
      
      return {stats};
    } catch (error) {
      logger.error(error as Error, 'getDailyStats', { 
        userId: context.auth!.uid, 
        date: targetDate 
      });
      throw error;
    }
  },
  'stats'
);

/**
 * Get weekly usage stats
 * Rate limit: 120 requests/minute (stats)
 */
export const getWeeklyStats = withRateLimit(
  async (data: {endDate?: string}, context) => {
    const {endDate} = data;
    const targetDate = endDate ? new Date(endDate) : new Date();

    // Validate date if provided
    if (endDate) {
      assertValid(validateDateString(endDate, 'endDate', { allowFuture: false }));
    }

    try {
      const stats = await appUsageTracker.getWeeklyStats(
        context.auth!.uid,
        targetDate
      );
      
      return {stats};
    } catch (error) {
      logger.error(error as Error, 'getWeeklyStats', { 
        userId: context.auth!.uid 
      });
      throw error;
    }
  },
  'stats'
);
