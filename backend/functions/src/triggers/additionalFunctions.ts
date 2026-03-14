/**
 * Zusätzliche HTTP Callable Functions für FocusFlow
 * 
 * Erweiterte Funktionen für User-Profile, Challenges und Statistiken
 */

import * as functions from 'firebase-functions';
import {db, FieldValue, Timestamp} from '../config/firebase';
import {leaderboardService} from '../services/leaderboardService';
import {pushNotificationService} from '../services/pushNotificationService';
import {appUsageTracker} from '../services/appUsageTracker';
import {createBadgeVerificationSystem} from '../services/badgeVerificationSystem';

const badgeSystem = createBadgeVerificationSystem(pushNotificationService);

/**
 * Get user profile with stats
 */
export const getUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  try {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    
    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await appUsageTracker.getDailyStats(context.auth.uid, today);
    
    // Get weekly stats
    const weeklyStats = await appUsageTracker.getWeeklyStats(context.auth.uid);
    const weeklyScreenTime = weeklyStats.reduce((sum, day) => sum + (day.totalScreenTime || 0), 0);
    const weeklyBlockedAttempts = weeklyStats.reduce((sum, day) => sum + (day.blockedAttempts || 0), 0);

    // Get badge progress
    const badges = await badgeSystem.getBadgeProgress(context.auth.uid);
    const unlockedBadges = badges.filter(b => b.unlockedAt);

    return {
      profile: {
        uid: context.auth.uid,
        ...userData,
      },
      todayStats: todayStats || {
        date: today,
        totalScreenTime: 0,
        appBreakdown: {},
        categoryBreakdown: {},
        blockedAttempts: 0,
        focusSessionsCompleted: 0,
      },
      weeklySummary: {
        totalScreenTime: weeklyScreenTime,
        blockedAttempts: weeklyBlockedAttempts,
        daysTracked: weeklyStats.length,
      },
      badges: {
        total: badges.length,
        unlocked: unlockedBadges.length,
        progress: badges,
      },
    };
  } catch (error: unknown) {
    console.error('Error getting user profile:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Update user profile
 */
export const updateUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {displayName, photoURL, dailyGoal, bedtime} = data;

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (dailyGoal !== undefined) updateData.dailyGoal = dailyGoal;
    if (bedtime !== undefined) updateData.bedtime = bedtime;

    await db.collection('users').doc(context.auth.uid).update(updateData);

    return {success: true};
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Start a focus session
 */
export const startFocusSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {duration, blockedApps, sessionType = 'standard'} = data;

  if (!duration || duration < 1) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Duration must be at least 1 minute'
    );
  }

  try {
    const sessionRef = await db
      .collection('users')
      .doc(context.auth.uid)
      .collection('focusSessions')
      .add({
        startTime: Timestamp.now(),
        duration,
        blockedApps: blockedApps || [],
        sessionType,
        completed: false,
        interrupted: false,
        createdAt: Timestamp.now(),
      });

    return {
      success: true,
      sessionId: sessionRef.id,
    };
  } catch (error: unknown) {
    console.error('Error starting focus session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Complete a focus session
 */
export const completeFocusSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {sessionId, interrupted = false} = data;

  if (!sessionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Session ID is required'
    );
  }

  try {
    const sessionRef = db
      .collection('users')
      .doc(context.auth.uid)
      .collection('focusSessions')
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();
    const startTime = sessionData?.startTime?.toDate() || new Date();
    const actualDuration = Math.floor(
      (Date.now() - startTime.getTime()) / 60000
    );

    await sessionRef.update({
      completed: !interrupted,
      interrupted,
      actualDuration,
      endTime: Timestamp.now(),
    });

    // Update user stats
    if (!interrupted) {
      await db.collection('users').doc(context.auth.uid).update({
        totalFocusTime: FieldValue.increment(actualDuration),
        sessionsCompleted: FieldValue.increment(1),
        lastFocusSession: Timestamp.now(),
      });
    }

    return {
      success: true,
      actualDuration,
      completed: !interrupted,
    };
  } catch (error: unknown) {
    console.error('Error completing focus session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Log blocked app attempt
 */
export const logBlockedAttempt = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {packageName, appName, category, attemptedDuration = 0} = data;

  if (!packageName || !appName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Package name and app name are required'
    );
  }

  try {
    const attemptRef = await db
      .collection('users')
      .doc(context.auth.uid)
      .collection('blockedAttempts')
      .add({
        packageName,
        appName,
        category: category || 'other',
        attemptedDuration,
        timestamp: Timestamp.now(),
      });

    // Update total blocked time
    await db.collection('users').doc(context.auth.uid).update({
      totalBlockedTime: FieldValue.increment(attemptedDuration),
      totalBlockedAttempts: FieldValue.increment(1),
    });

    return {
      success: true,
      attemptId: attemptRef.id,
    };
  } catch (error: unknown) {
    console.error('Error logging blocked attempt:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Get user's rank in all categories
 */
export const getAllRanks = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const categories = ['screen_time', 'focus_time', 'badges', 'streak', 'weekly_challenge'] as const;

  try {
    const ranks = await Promise.all(
      categories.map(async (category) => {
        const rankData = await leaderboardService.getUserRank(
          context.auth!.uid,
          category
        );
        return {
          category,
          rank: rankData.rank,
          total: rankData.total,
          score: rankData.entry?.score || 0,
        };
      })
    );

    return {ranks};
  } catch (error: unknown) {
    console.error('Error getting ranks:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Get friends leaderboard (compare with friends)
 */
export const getFriendsLeaderboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {category = 'streak', friendIds = []} = data;

  try {
    // Include current user
    const allUserIds = [context.auth.uid, ...friendIds];
    
    const entries = await leaderboardService.getLeaderboard(category, 100);
    const filteredEntries = entries.filter(entry => 
      allUserIds.includes(entry.userId)
    );

    // Re-rank filtered entries
    const rankedEntries = filteredEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return {
      entries: rankedEntries,
      category,
    };
  } catch (error: unknown) {
    console.error('Error getting friends leaderboard:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Send test notification
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {type = 'test'} = data;

  try {
    switch (type) {
      case 'streak':
        await pushNotificationService.sendStreakReminder(context.auth.uid, 7);
        break;
      case 'achievement':
        await pushNotificationService.sendAchievementUnlocked(
          context.auth.uid,
          'Test Badge',
          'bronze'
        );
        break;
      case 'daily_summary':
        await pushNotificationService.sendDailySummary(context.auth.uid, {
          screenTime: 120,
          focusTime: 45,
          blockedAttempts: 3,
        });
        break;
      default:
        await pushNotificationService.sendToUser(context.auth.uid, {
          type: 'system',
          title: 'Test Notification',
          body: 'This is a test notification from FocusFlow!',
          data: {test: 'true'},
        });
    }

    return {success: true, type};
  } catch (error: unknown) {
    console.error('Error sending test notification:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});

/**
 * Get app usage insights
 */
export const getAppInsights = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const {days = 7} = data;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const weeklyStats = await appUsageTracker.getWeeklyStats(context.auth.uid, endDate);
    
    // Aggregate app usage
    const appTotals: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    let totalBlocked = 0;

    weeklyStats.forEach(day => {
      Object.entries(day.appBreakdown || {}).forEach(([app, time]) => {
        appTotals[app] = (appTotals[app] || 0) + time;
      });
      Object.entries(day.categoryBreakdown || {}).forEach(([cat, time]) => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + time;
      });
      totalBlocked += day.blockedAttempts || 0;
    });

    // Sort by usage
    const topApps = Object.entries(appTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, time]) => ({name, time}));

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, time]) => ({name, time}));

    const totalScreenTime = Object.values(appTotals).reduce((a, b) => a + b, 0);

    return {
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalScreenTime,
        totalBlockedAttempts: totalBlocked,
        averageDailyScreenTime: Math.round(totalScreenTime / days),
      },
      topApps,
      topCategories,
    };
  } catch (error: unknown) {
    console.error('Error getting app insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', message);
  }
});
