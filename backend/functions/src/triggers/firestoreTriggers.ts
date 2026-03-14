/**
 * Firebase Cloud Functions - Firestore Triggers (Enhanced)
 * 
 * These functions respond to Firestore document changes
 * and perform backend operations like updating leaderboards,
 * sending notifications, and verifying badges.
 * 
 * Enhanced with:
 * - Retry logic for transient failures
 * - Structured error handling and logging
 * - Batch processing optimizations
 */

import * as functions from 'firebase-functions';
import {db} from '../config/firebase';
import {leaderboardService} from '../services/leaderboardService';
import {pushNotificationService} from '../services/pushNotificationService';
import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
} from '../services/badgeVerificationSystem';
import {withRetry, createLogger} from '../utils/errorTracker';

// Initialize services
const badgeSystem = createBadgeVerificationSystem(pushNotificationService);
const logger = createLogger('firestoreTriggers');

/**
 * Trigger: When a user's stats are updated
 * Updates leaderboard entries for the user
 */
export const onUserStatsUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    const oldData = change.before.data();

    try {
      // Update streak leaderboard if streak changed
      if (newData.currentStreak !== oldData.currentStreak) {
        await withRetry(
          () => leaderboardService.updateScore(
            userId,
            'streak',
            newData.currentStreak || 0,
            {
              displayName: newData.displayName || 'Anonymous',
              photoURL: newData.photoURL,
              streak: newData.currentStreak || 0,
            }
          ),
          {
            functionName: 'onUserStatsUpdate',
            operation: 'updateStreakLeaderboard',
            userId,
          },
          3,
          1000
        );
      }

      // Update badges leaderboard if badges changed
      if (
        JSON.stringify(newData.badges) !== JSON.stringify(oldData.badges)
      ) {
        const badgeScore = (newData.badges || []).reduce(
          (sum: number, badge: {unlockedAt?: Date; tier: string}) => {
            if (badge.unlockedAt) {
              const points: Record<string, number> = {
                bronze: 10,
                silver: 25,
                gold: 50,
                platinum: 100,
              };
              return sum + (points[badge.tier] || 0);
            }
            return sum;
          },
          0
        );

        await withRetry(
          () => leaderboardService.updateScore(
            userId,
            'badges',
            badgeScore,
            {
              displayName: newData.displayName || 'Anonymous',
              photoURL: newData.photoURL,
              streak: newData.currentStreak || 0,
            }
          ),
          {
            functionName: 'onUserStatsUpdate',
            operation: 'updateBadgesLeaderboard',
            userId,
          },
          3,
          1000
        );
      }

      // Check for new badge unlocks
      const newBadges = await withRetry(
        () => badgeSystem.checkAndAwardBadges(userId),
        {
          functionName: 'onUserStatsUpdate',
          operation: 'checkAndAwardBadges',
          userId,
        },
        3,
        1000
      );

      if (newBadges.length > 0) {
        logger.info('User unlocked badges', { userId, newBadges });
      }

      return null;
    } catch (error) {
      logger.error(error as Error, 'onUserStatsUpdate', { userId });
      return null;
    }
  });

/**
 * Trigger: When a focus session is completed
 * Updates focus time leaderboard
 */
export const onFocusSessionComplete = functions.firestore
  .document('users/{userId}/focusSessions/{sessionId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const sessionData = snap.data();

    if (!sessionData.completed) {
      return null;
    }

    try {
      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        logger.warn('User not found for focus session', { userId });
        return null;
      }

      // Calculate weekly focus time
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const focusSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('focusSessions')
        .where('completed', '==', true)
        .where('startTime', '>=', weekAgo)
        .get();

      const weeklyFocusTime = focusSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().duration || 0),
        0
      );

      // Update leaderboard
      await withRetry(
        () => leaderboardService.updateScore(
          userId,
          'focus_time',
          weeklyFocusTime,
          {
            displayName: userData.displayName || 'Anonymous',
            photoURL: userData.photoURL,
            streak: userData.currentStreak || 0,
          }
        ),
        {
          functionName: 'onFocusSessionComplete',
          operation: 'updateFocusTimeLeaderboard',
          userId,
        },
        3,
        1000
      );

      // Check badges
      await withRetry(
        () => badgeSystem.checkAndAwardBadges(userId),
        {
          functionName: 'onFocusSessionComplete',
          operation: 'checkBadges',
          userId,
        },
        3,
        1000
      );

      logger.info('Focus session completed and processed', { 
        userId, 
        sessionId: context.params.sessionId,
        weeklyFocusTime 
      });

      return null;
    } catch (error) {
      logger.error(error as Error, 'onFocusSessionComplete', { 
        userId,
        sessionId: context.params.sessionId 
      });
      return null;
    }
  });

/**
 * Trigger: When daily usage stats are updated
 * Updates screen time leaderboard
 */
export const onDailyStatsUpdate = functions.firestore
  .document('users/{userId}/usageStats/{date}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const statsData = change.after.exists ? change.after.data() : null;

    if (!statsData) {
      return null;
    }

    try {
      // Get user data
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        logger.warn('User not found for daily stats update', { userId });
        return null;
      }

      // Calculate weekly screen time
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const weeklySnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('usageStats')
        .where('date', '>=', weekAgoStr)
        .get();

      const weeklyScreenTime = weeklySnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().totalScreenTime || 0),
        0
      );

      // Update leaderboard (inverted score: less screen time = higher score)
      const maxScreenTime = 3360; // 8 hours/day * 7 days
      const score = Math.max(0, Math.round(maxScreenTime - weeklyScreenTime));

      await withRetry(
        () => leaderboardService.updateScore(
          userId,
          'screen_time',
          score,
          {
            displayName: userData.displayName || 'Anonymous',
            photoURL: userData.photoURL,
            streak: userData.currentStreak || 0,
          }
        ),
        {
          functionName: 'onDailyStatsUpdate',
          operation: 'updateScreenTimeLeaderboard',
          userId,
        },
        3,
        1000
      );

      return null;
    } catch (error) {
      logger.error(error as Error, 'onDailyStatsUpdate', { userId });
      return null;
    }
  });

/**
 * Trigger: When a user is created
 * Initialize their badges and settings
 */
export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;

    try {
      // Initialize badges
      await withRetry(
        () => badgeSystem.initializeBadges(),
        {
          functionName: 'onUserCreate',
          operation: 'initializeBadges',
          userId,
        },
        3,
        1000
      );

      // Create default notification settings
      await withRetry(
        () => db
          .collection('users')
          .doc(userId)
          .collection('settings')
          .doc('notifications')
          .set({
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
        {
          functionName: 'onUserCreate',
          operation: 'createNotificationSettings',
          userId,
        },
        3,
        1000
      );

      // Initialize user badges
      const batch = db.batch();
      for (const badge of BadgeVerificationSystem.DEFAULT_BADGES) {
        const badgeRef = db
          .collection('users')
          .doc(userId)
          .collection('userBadges')
          .doc(badge.id);

        batch.set(badgeRef, {
          badgeId: badge.id,
          progress: 0,
          maxProgress:
            badge.requirement.type === 'streak'
              ? badge.requirement.days
              : (badge.requirement as {minutes?: number}).minutes || 1,
        });
      }
      
      await withRetry(
        () => batch.commit(),
        {
          functionName: 'onUserCreate',
          operation: 'initializeUserBadges',
          userId,
        },
        3,
        1000
      );

      logger.info('New user initialized successfully', { userId });

      return null;
    } catch (error) {
      logger.error(error as Error, 'onUserCreate', { userId });
      return null;
    }
  });

/**
 * Trigger: When a blocked app attempt is logged
 * Send limit warning if needed
 */
export const onBlockedAttempt = functions.firestore
  .document('users/{userId}/blockedAttempts/{attemptId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const attemptData = snap.data();

    try {
      // Check if this is a repeated attempt
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentAttempts = await db
        .collection('users')
        .doc(userId)
        .collection('blockedAttempts')
        .where('packageName', '==', attemptData.packageName)
        .where('timestamp', '>=', fiveMinutesAgo)
        .get();

      // Send warning if multiple attempts in short time
      if (recentAttempts.size >= 3) {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (userData) {
          const appName = attemptData.appName || 'diese App';
          
          await withRetry(
            () => pushNotificationService.sendToUser(
              userId,
              {
                type: 'limit_warning',
                title: '🚫 Bleib fokussiert!',
                body: `Du hast versucht, ${appName} mehrmals zu öffnen. Bleib stark!`,
                data: {
                  appName,
                  attempts: recentAttempts.size.toString(),
                  action: 'view_focus_mode',
                },
              },
              {respectQuietHours: true}
            ),
            {
              functionName: 'onBlockedAttempt',
              operation: 'sendWarningNotification',
              userId,
            },
            3,
            1000
          );

          logger.info('Warning notification sent for repeated blocked attempts', {
            userId,
            appName,
            attemptCount: recentAttempts.size,
          });
        }
      }

      return null;
    } catch (error) {
      logger.error(error as Error, 'onBlockedAttempt', { 
        userId,
        attemptId: context.params.attemptId 
      });
      return null;
    }
  });
