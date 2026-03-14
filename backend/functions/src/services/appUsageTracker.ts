/**
 * App Usage Tracking Service
 *
 * Handles tracking and aggregation of app usage data for FocusFlow users.
 * Provides methods for logging usage, calculating daily/weekly stats,
 * and detecting violations of app blocking rules.
 *
 * Features:
 * - Real-time usage logging with batch operations
 * - Daily and weekly statistics aggregation
 * - App limit violation detection
 * - Leaderboard data aggregation
 * - Automatic cleanup of old logs (90 days retention)
 * - Category-based usage breakdown
 */

import {db, FieldValue, Timestamp} from '../config/firebase';

export interface AppUsageLog {
  packageName: string;
  appName: string;
  usageTime: number; // in minutes
  timestamp: Date;
  category: string;
  isBlocked: boolean;
}

export interface DailyUsageStats {
  date: string; // YYYY-MM-DD
  totalScreenTime: number; // in minutes
  appBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  blockedAttempts: number;
  focusSessionsCompleted: number;
}

export class AppUsageTracker {
  private readonly USAGE_COLLECTION = 'appUsage';
  private readonly STATS_COLLECTION = 'usageStats';

  /**
   * Log app usage for a user
   */
  async logUsage(
    userId: string,
    usage: Omit<AppUsageLog, 'timestamp'>
  ): Promise<void> {
    const timestamp = Timestamp.now();
    const date = this.getDateString(new Date());

    const batch = db.batch();

    // Add to usage log
    const logRef = db
      .collection('users')
      .doc(userId)
      .collection(this.USAGE_COLLECTION)
      .doc();

    batch.set(logRef, {
      ...usage,
      timestamp,
      date,
    });

    // Update daily stats
    const statsRef = db
      .collection('users')
      .doc(userId)
      .collection(this.STATS_COLLECTION)
      .doc(date);

    batch.set(
      statsRef,
      {
        totalScreenTime: FieldValue.increment(usage.usageTime),
        [`appBreakdown.${usage.packageName}`]: FieldValue.increment(usage.usageTime),
        [`categoryBreakdown.${usage.category}`]: FieldValue.increment(usage.usageTime),
        blockedAttempts: usage.isBlocked ? FieldValue.increment(1) : FieldValue.increment(0),
        lastUpdated: timestamp,
        date,
      },
      {merge: true}
    );

    await batch.commit();
  }

  /**
   * Get daily usage stats for a user
   */
  async getDailyStats(userId: string, date: string): Promise<DailyUsageStats | null> {
    const doc = await db
      .collection('users')
      .doc(userId)
      .collection(this.STATS_COLLECTION)
      .doc(date)
      .get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as DailyUsageStats;
  }

  /**
   * Get weekly usage stats
   */
  async getWeeklyStats(userId: string, endDate: Date = new Date()): Promise<DailyUsageStats[]> {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);

    const startDateStr = this.getDateString(startDate);
    const endDateStr = this.getDateString(endDate);

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection(this.STATS_COLLECTION)
      .where('date', '>=', startDateStr)
      .where('date', '<=', endDateStr)
      .orderBy('date', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as DailyUsageStats);
  }

  /**
   * Check if user has exceeded daily limit for an app
   */
  async checkLimitExceeded(
    userId: string,
    packageName: string,
    dailyLimit: number
  ): Promise<{exceeded: boolean; currentUsage: number}> {
    const date = this.getDateString(new Date());
    const stats = await this.getDailyStats(userId, date);

    const currentUsage = stats?.appBreakdown[packageName] || 0;
    
    return {
      exceeded: currentUsage >= dailyLimit,
      currentUsage,
    };
  }

  /**
   * Aggregate usage data for leaderboard calculations
   */
  async aggregateForLeaderboard(userId: string): Promise<{
    screenTime: number;
    focusTime: number;
    streak: number;
  }> {
    const weeklyStats = await this.getWeeklyStats(userId);

    const totalScreenTime = weeklyStats.reduce(
      (sum, day) => sum + (day.totalScreenTime || 0),
      0
    );

    // Get user's focus sessions from a separate collection
    const focusSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('focusSessions')
      .where('completed', '==', true)
      .where('timestamp', '>=', Timestamp.fromDate(this.getWeekAgo()))
      .get();

    const totalFocusTime = focusSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().duration || 0),
      0
    );

    // Get current streak
    const userDoc = await db.collection('users').doc(userId).get();
    const streak = userDoc.data()?.currentStreak || 0;

    return {
      screenTime: totalScreenTime,
      focusTime: totalFocusTime,
      streak,
    };
  }

  /**
   * Clean up old usage logs (keep last 90 days)
   */
  async cleanupOldLogs(userId: string, daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection(this.USAGE_COLLECTION)
      .where('timestamp', '<', cutoffTimestamp)
      .limit(500)
      .get();

    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return deletedCount;
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getWeekAgo(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }
}

export const appUsageTracker = new AppUsageTracker();
