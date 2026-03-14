/**
 * Firebase Cloud Functions - Firestore Triggers
 * 
 * These functions respond to Firestore document changes
 * and perform backend operations like updating leaderboards,
 * sending notifications, and verifying badges.
 */

import * as functions from 'firebase-functions';
import {db} from '../config/firebase';
import {leaderboardService} from '../services/leaderboardService';
import {pushNotificationService} from '../services/pushNotificationService';
import {
  BadgeVerificationSystem,
  createBadgeVerificationSystem,
} from '../services/badgeVerificationSystem';

// Initialize services
const badgeSystem = createBadgeVerificationSystem(pushNotificationService);

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
        await leaderboardService.updateScore(
          userId,
          'streak',
          newData.currentStreak || 0,
          {
            displayName: newData.displayName || 'Anonymous',
            photoURL: newData.photoURL,
            streak: newData.currentStreak || 0,
          }
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

        await leaderboardService.updateScore(
          userId,
          'badges',
          badgeScore,
          {
            displayName: newData.displayName || 'Anonymous',
            photoURL: newData.photoURL,
            streak: newData.currentStreak || 0,
          }
        );
      }

      // Check for new badge unlocks
      const newBadges = await badgeSystem.checkAndAwardBadges(userId);

      if (newBadges.length > 0) {
        console.log(`User ${userId} unlocked badges:`, newBadges);
      }

      return null;
    } catch (error) {
      console.error('Error in onUserStatsUpdate:', error);
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
      await leaderboardService.updateScore(
        userId,
        'focus_time',
        weeklyFocusTime,
        {
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL,
          streak: userData.currentStreak || 0,
        }
      );

      // Check badges
      await badgeSystem.checkAndAwardBadges(userId);

      return null;
    } catch (error) {
      console.error('Error in onFocusSessionComplete:', error);
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

      await leaderboardService.updateScore(
        userId,
        'screen_time',
        score,
        {
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL,
          streak: userData.currentStreak || 0,
        }
      );

      return null;
    } catch (error) {
      console.error('Error in onDailyStatsUpdate:', error);
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
      await badgeSystem.initializeBadges();

      // Create default notification settings
      await db
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
        });

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
      await batch.commit();

      return null;
    } catch (error) {
      console.error('Error in onUserCreate:', error);
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
      const recentAttempts = await db
        .collection('users')
        .doc(userId)
        .collection('blockedAttempts')
        .where('packageName', '==', attemptData.packageName)
        .where('timestamp', '>=', new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
        .get();

      // Send warning if multiple attempts in short time
      if (recentAttempts.size >= 3) {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (userData) {
          const appName = attemptData.appName || 'diese App';
          await pushNotificationService.sendToUser(
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
          );
        }
      }

      return null;
    } catch (error) {
      console.error('Error in onBlockedAttempt:', error);
      return null;
    }
  });
