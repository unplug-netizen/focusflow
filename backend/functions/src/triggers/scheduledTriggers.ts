/**
 * Firebase Cloud Functions - Scheduled Functions
 * 
 * These functions run on a schedule to perform periodic tasks
 * like sending daily summaries, checking streaks, and recalculating leaderboards.
 */

import * as functions from 'firebase-functions';
import {db} from '../config/firebase';
import {leaderboardService} from '../services/leaderboardService';
import {pushNotificationService} from '../services/pushNotificationService';
import {createBadgeVerificationSystem} from '../services/badgeVerificationSystem';

const badgeSystem = createBadgeVerificationSystem(pushNotificationService);

/**
 * Scheduled: Daily at 9 PM - Send daily summary notifications
 */
export const dailySummaryNotification = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Running daily summary notification job');

    try {
      const usersSnapshot = await db.collection('users').get();
      let sentCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const today = new Date().toISOString().split('T')[0];

        // Get today's stats
        const statsDoc = await db
          .collection('users')
          .doc(userId)
          .collection('usageStats')
          .doc(today)
          .get();

        if (statsDoc.exists) {
          const stats = statsDoc.data();

          await pushNotificationService.sendDailySummary(userId, {
            screenTime: stats?.totalScreenTime || 0,
            focusTime: stats?.focusTime || 0,
            blockedAttempts: stats?.blockedAttempts || 0,
          });

          sentCount++;
        }
      }

      console.log(`Sent daily summaries to ${sentCount} users`);
      return null;
    } catch (error) {
      console.error('Error in dailySummaryNotification:', error);
      return null;
    }
  });

/**
 * Scheduled: Daily at 8 PM - Check streaks and send reminders
 */
export const streakReminderCheck = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Running streak reminder check');

    try {
      const usersSnapshot = await db.collection('users').get();
      let reminderCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const streak = userData?.currentStreak || 0;

        // Only remind users with active streaks
        if (streak >= 3) {
          // Check if user has opened app today
          const today = new Date().toISOString().split('T')[0];
          const todayUsage = await db
            .collection('users')
            .doc(userId)
            .collection('usageStats')
            .doc(today)
            .get();

          // If no usage today, send reminder
          if (!todayUsage.exists) {
            await pushNotificationService.sendStreakReminder(userId, streak);
            reminderCount++;
          }
        }
      }

      console.log(`Sent streak reminders to ${reminderCount} users`);
      return null;
    } catch (error) {
      console.error('Error in streakReminderCheck:', error);
      return null;
    }
  });

/**
 * Scheduled: Daily at midnight - Recalculate leaderboards
 */
export const dailyLeaderboardUpdate = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Running daily leaderboard update');

    try {
      await leaderboardService.recalculateAllLeaderboards();
      console.log('Leaderboards updated successfully');
      return null;
    } catch (error) {
      console.error('Error in dailyLeaderboardUpdate:', error);
      return null;
    }
  });

/**
 * Scheduled: Weekly on Monday at midnight - Reset weekly challenge
 */
export const weeklyChallengeReset = functions.pubsub
  .schedule('0 0 * * 1')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Running weekly challenge reset');

    try {
      await leaderboardService.resetWeeklyChallenge();

      // Send notification to all users about new challenge
      await pushNotificationService.sendToTopic(
        'weekly_challenge',
        {
          type: 'challenge_reminder',
          title: '🎯 Neue Wochen-Challenge!',
          body: 'Eine neue Challenge ist verfügbar. Schau dir die Details in der App an!',
          data: {
            action: 'view_challenge',
          },
        }
      );

      console.log('Weekly challenge reset successfully');
      return null;
    } catch (error) {
      console.error('Error in weeklyChallengeReset:', error);
      return null;
    }
  });

/**
 * Scheduled: Daily at 2 AM - Cleanup old usage logs
 */
export const cleanupOldLogs = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Running cleanup of old usage logs');

    try {
      const {appUsageTracker} = await import('../services/appUsageTracker');
      
      const usersSnapshot = await db.collection('users').get();
      let totalDeleted = 0;

      for (const userDoc of usersSnapshot.docs) {
        const deleted = await appUsageTracker.cleanupOldLogs(userDoc.id, 90);
        totalDeleted += deleted;
      }

      console.log(`Cleaned up ${totalDeleted} old log entries`);
      return null;
    } catch (error) {
      console.error('Error in cleanupOldLogs:', error);
      return null;
    }
  });

/**
 * Scheduled: Every hour - Process queued notifications
 */
export const processQueuedNotifications = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Processing queued notifications');

    try {
      const now = new Date();
      const queueSnapshot = await db
        .collection('notificationQueue')
        .where('scheduledFor', '<=', now)
        .limit(100)
        .get();

      let processedCount = 0;

      for (const doc of queueSnapshot.docs) {
        const {userId, payload} = doc.data();

        await pushNotificationService.sendToUser(userId, payload, {
          respectQuietHours: false, // Already waited for quiet hours
        });

        await doc.ref.delete();
        processedCount++;
      }

      console.log(`Processed ${processedCount} queued notifications`);
      return null;
    } catch (error) {
      console.error('Error in processQueuedNotifications:', error);
      return null;
    }
  });

/**
 * Scheduled: Daily at 6 AM - Check badge progress and send updates
 */
export const dailyBadgeCheck = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('Running daily badge check');

    try {
      const usersSnapshot = await db.collection('users').get();
      let awardedCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const newBadges = await badgeSystem.checkAndAwardBadges(userId);
        awardedCount += newBadges.length;
      }

      console.log(`Awarded ${awardedCount} badges`);
      return null;
    } catch (error) {
      console.error('Error in dailyBadgeCheck:', error);
      return null;
    }
  });
