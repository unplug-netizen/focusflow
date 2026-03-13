/**
 * Analytics Service
 * 
 * Provides detailed analytics and insights for user behavior,
 * app usage patterns, and productivity metrics.
 */

import {db, Timestamp} from '../config/firebase';

export interface DailyAnalytics {
  date: string;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalFocusTime: number;
  totalBlockedAttempts: number;
  avgScreenTime: number;
  avgFocusTime: number;
}

export interface UserAnalytics {
  userId: string;
  streak: number;
  totalFocusTime: number;
  totalBlockedTime: number;
  productivityScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AppCategoryAnalytics {
  category: string;
  totalUsage: number;
  avgDailyUsage: number;
  blockedAttempts: number;
  userCount: number;
}

export class AnalyticsService {
  private readonly ANALYTICS_COLLECTION = 'analytics';
  private readonly DAILY_STATS_COLLECTION = 'dailyStats';

  /**
   * Generate daily analytics report
   */
  async generateDailyReport(date: string): Promise<DailyAnalytics> {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Count new users (created today)
    const newUsers = usersSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt >= startOfDay && createdAt < endOfDay;
    }).length;

    // Get active users (had activity today)
    let activeUsers = 0;
    let totalFocusTime = 0;
    let totalBlockedAttempts = 0;
    let totalScreenTime = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Check if user had activity today
      const usageDoc = await db
        .collection('users')
        .doc(userId)
        .collection('usageStats')
        .doc(date)
        .get();

      if (usageDoc.exists) {
        activeUsers++;
        const data = usageDoc.data();
        totalScreenTime += data?.totalScreenTime || 0;
        totalBlockedAttempts += data?.blockedAttempts || 0;
      }

      // Get focus time
      const focusSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('focusSessions')
        .where('startTime', '>=', Timestamp.fromDate(startOfDay))
        .where('startTime', '<', Timestamp.fromDate(endOfDay))
        .where('completed', '==', true)
        .get();

      focusSnapshot.docs.forEach(doc => {
        totalFocusTime += doc.data().actualDuration || doc.data().duration || 0;
      });
    }

    const analytics: DailyAnalytics = {
      date,
      totalUsers,
      activeUsers,
      newUsers,
      totalFocusTime,
      totalBlockedAttempts,
      avgScreenTime: activeUsers > 0 ? Math.round(totalScreenTime / activeUsers) : 0,
      avgFocusTime: activeUsers > 0 ? Math.round(totalFocusTime / activeUsers) : 0,
    };

    // Store analytics
    await db
      .collection(this.ANALYTICS_COLLECTION)
      .doc(this.DAILY_STATS_COLLECTION)
      .collection('reports')
      .doc(date)
      .set(analytics);

    return analytics;
  }

  /**
   * Get user productivity analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User not found');
    }

    // Get last 14 days of stats
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const statsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('usageStats')
      .where('date', '>=', startDate.toISOString().split('T')[0])
      .where('date', '<=', endDate.toISOString().split('T')[0])
      .get();

    const stats = statsSnapshot.docs.map(doc => doc.data());

    // Calculate trend (compare first week vs second week)
    const midPoint = Math.floor(stats.length / 2);
    const firstWeek = stats.slice(0, midPoint);
    const secondWeek = stats.slice(midPoint);

    const firstWeekScreenTime = firstWeek.reduce((sum, s) => sum + (s.totalScreenTime || 0), 0);
    const secondWeekScreenTime = secondWeek.reduce((sum, s) => sum + (s.totalScreenTime || 0), 0);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondWeekScreenTime < firstWeekScreenTime * 0.9) {
      trend = 'improving';
    } else if (secondWeekScreenTime > firstWeekScreenTime * 1.1) {
      trend = 'declining';
    }

    // Calculate productivity score (0-100)
    // Based on: streak, focus time, blocked attempts ratio
    const streak = userData.currentStreak || 0;
    const totalFocusTime = userData.totalFocusTime || 0;
    const totalBlockedAttempts = userData.totalBlockedAttempts || 0;

    let productivityScore = 50; // Base score
    productivityScore += Math.min(streak * 2, 30); // Up to 30 points for streak
    productivityScore += Math.min(totalFocusTime / 60, 15); // Up to 15 points for focus time
    productivityScore += Math.min(totalBlockedAttempts / 10, 5); // Up to 5 points for blocking
    productivityScore = Math.min(100, Math.round(productivityScore));

    return {
      userId,
      streak,
      totalFocusTime,
      totalBlockedTime: userData.totalBlockedTime || 0,
      productivityScore,
      trend,
    };
  }

  /**
   * Get app category analytics across all users
   */
  async getCategoryAnalytics(days: number = 7): Promise<AppCategoryAnalytics[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usersSnapshot = await db.collection('users').get();
    const categoryMap: Map<string, {
      totalUsage: number;
      blockedAttempts: number;
      userSet: Set<string>;
    }> = new Map();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      const statsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('usageStats')
        .where('date', '>=', startDate.toISOString().split('T')[0])
        .where('date', '<=', endDate.toISOString().split('T')[0])
        .get();

      statsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const categoryBreakdown = data.categoryBreakdown || {};

        Object.entries(categoryBreakdown).forEach(([category, time]) => {
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              totalUsage: 0,
              blockedAttempts: 0,
              userSet: new Set(),
            });
          }

          const catData = categoryMap.get(category)!;
          catData.totalUsage += time as number;
          catData.userSet.add(userId);
        });
      });
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalUsage: data.totalUsage,
      avgDailyUsage: Math.round(data.totalUsage / days),
      blockedAttempts: data.blockedAttempts,
      userCount: data.userSet.size,
    }));
  }

  /**
   * Get streak leaderboard (for streak competitions)
   */
  async getStreakLeaderboard(limit: number = 10): Promise<{
    userId: string;
    displayName: string;
    streak: number;
    rank: number;
  }[]> {
    const usersSnapshot = await db
      .collection('users')
      .orderBy('currentStreak', 'desc')
      .limit(limit)
      .get();

    return usersSnapshot.docs.map((doc, index) => ({
      userId: doc.id,
      displayName: doc.data().displayName || 'Anonymous',
      streak: doc.data().currentStreak || 0,
      rank: index + 1,
    }));
  }

  /**
   * Get retention metrics
   */
  async getRetentionMetrics(): Promise<{
    dailyRetention: number;
    weeklyRetention: number;
    monthlyRetention: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get users who signed up in each period
    const [dailyUsers, weeklyUsers, monthlyUsers] = await Promise.all([
      this.getUsersCreatedBetween(oneDayAgo, now),
      this.getUsersCreatedBetween(oneWeekAgo, now),
      this.getUsersCreatedBetween(oneMonthAgo, now),
    ]);

    // Count how many were active today
    const today = now.toISOString().split('T')[0];
    
    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      this.countActiveUsers(dailyUsers, today),
      this.countActiveUsers(weeklyUsers, today),
      this.countActiveUsers(monthlyUsers, today),
    ]);

    return {
      dailyRetention: dailyUsers.length > 0 ? dailyActive / dailyUsers.length : 0,
      weeklyRetention: weeklyUsers.length > 0 ? weeklyActive / weeklyUsers.length : 0,
      monthlyRetention: monthlyUsers.length > 0 ? monthlyActive / monthlyUsers.length : 0,
    };
  }

  private async getUsersCreatedBetween(start: Date, end: Date): Promise<string[]> {
    const snapshot = await db
      .collection('users')
      .where('createdAt', '>=', Timestamp.fromDate(start))
      .where('createdAt', '<', Timestamp.fromDate(end))
      .get();

    return snapshot.docs.map(doc => doc.id);
  }

  private async countActiveUsers(userIds: string[], date: string): Promise<number> {
    let count = 0;
    
    for (const userId of userIds) {
      const doc = await db
        .collection('users')
        .doc(userId)
        .collection('usageStats')
        .doc(date)
        .get();
      
      if (doc.exists) {
        count++;
      }
    }

    return count;
  }
}

export const analyticsService = new AnalyticsService();
