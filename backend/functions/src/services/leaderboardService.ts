/**
 * Leaderboard Service
 * 
 * Manages leaderboard calculations and updates.
 * Supports multiple categories: screen_time, focus_time, badges, streak, weekly_challenge
 */

import {db, Timestamp} from '../config/firebase';

export type LeaderboardCategory = 
  | 'screen_time'
  | 'focus_time'
  | 'badges'
  | 'streak'
  | 'weekly_challenge';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  streak: number;
  rank?: number;
  updatedAt: Date;
}

export interface LeaderboardData {
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  totalParticipants: number;
}

export class LeaderboardService {
  private readonly LEADERBOARD_COLLECTION = 'leaderboard';
  private readonly ENTRIES_COLLECTION = 'entries';

  /**
   * Update a user's score in a specific category
   */
  async updateScore(
    userId: string,
    category: LeaderboardCategory,
    score: number,
    userData: {
      displayName: string;
      photoURL?: string;
      streak?: number;
    }
  ): Promise<void> {
    const entryRef = db
      .collection(this.LEADERBOARD_COLLECTION)
      .doc(category)
      .collection(this.ENTRIES_COLLECTION)
      .doc(userId);

    await entryRef.set({
      userId,
      displayName: userData.displayName,
      photoURL: userData.photoURL || null,
      score,
      streak: userData.streak || 0,
      updatedAt: Timestamp.now(),
    }, {merge: true});
  }

  /**
   * Get top entries for a category
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const snapshot = await db
      .collection(this.LEADERBOARD_COLLECTION)
      .doc(category)
      .collection(this.ENTRIES_COLLECTION)
      .orderBy('score', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => ({
      ...(doc.data() as LeaderboardEntry),
      rank: index + 1,
    }));
  }

  /**
   * Get a specific user's rank in a category
   */
  async getUserRank(
    userId: string,
    category: LeaderboardCategory
  ): Promise<{rank: number; total: number; entry: LeaderboardEntry | null}> {
    // Get user's entry
    const userDoc = await db
      .collection(this.LEADERBOARD_COLLECTION)
      .doc(category)
      .collection(this.ENTRIES_COLLECTION)
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return {rank: 0, total: 0, entry: null};
    }

    const userScore = userDoc.data()?.score || 0;

    // Count users with higher scores
    const higherScores = await db
      .collection(this.LEADERBOARD_COLLECTION)
      .doc(category)
      .collection(this.ENTRIES_COLLECTION)
      .where('score', '>', userScore)
      .count()
      .get();

    // Get total count
    const totalSnapshot = await db
      .collection(this.LEADERBOARD_COLLECTION)
      .doc(category)
      .collection(this.ENTRIES_COLLECTION)
      .count()
      .get();

    return {
      rank: higherScores.data().count + 1,
      total: totalSnapshot.data().count,
      entry: userDoc.data() as LeaderboardEntry,
    };
  }

  /**
   * Recalculate and update all leaderboards
   * Should be run periodically (e.g., daily)
   */
  async recalculateAllLeaderboards(): Promise<void> {
    const categories: LeaderboardCategory[] = [
      'screen_time',
      'focus_time',
      'badges',
      'streak',
      'weekly_challenge',
    ];

    for (const category of categories) {
      await this.recalculateCategory(category);
    }
  }

  /**
   * Recalculate a specific category
   */
  private async recalculateCategory(category: LeaderboardCategory): Promise<void> {
    // Get all users
    const usersSnapshot = await db.collection('users').get();

    const batch = db.batch();
    let processedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      let score = 0;

      switch (category) {
        case 'screen_time':
          score = await this.calculateScreenTimeScore(userId);
          break;
        case 'focus_time':
          score = await this.calculateFocusTimeScore(userId);
          break;
        case 'badges':
          score = await this.calculateBadgesScore(userId);
          break;
        case 'streak':
          score = userData.currentStreak || 0;
          break;
        case 'weekly_challenge':
          score = await this.calculateWeeklyChallengeScore(userId);
          break;
      }

      const entryRef = db
        .collection(this.LEADERBOARD_COLLECTION)
        .doc(category)
        .collection(this.ENTRIES_COLLECTION)
        .doc(userId);

      batch.set(
        entryRef,
        {
          userId,
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL || null,
          score,
          streak: userData.currentStreak || 0,
          updatedAt: Timestamp.now(),
        },
        {merge: true}
      );

      processedCount++;

      // Commit batch every 500 operations
      if (processedCount % 500 === 0) {
        await batch.commit();
      }
    }

    // Commit remaining operations
    if (processedCount % 500 !== 0) {
      await batch.commit();
    }

    // Update metadata
    await db.collection(this.LEADERBOARD_COLLECTION).doc(category).set({
      lastUpdated: Timestamp.now(),
      totalParticipants: processedCount,
    }, {merge: true});
  }

  /**
   * Calculate screen time score (lower is better for screen time reduction)
   * We invert it so less screen time = higher score
   */
  private async calculateScreenTimeScore(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('usageStats')
      .where('date', '>=', weekAgo.toISOString().split('T')[0])
      .get();

    const totalScreenTime = snapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().totalScreenTime || 0),
      0
    );

    // Invert: max 1000 points, subtract screen time (capped at reasonable max)
    // Assuming 8 hours/day average = 3360 minutes/week
    const maxScreenTime = 3360;
    return Math.max(0, Math.round(maxScreenTime - totalScreenTime));
  }

  /**
   * Calculate focus time score
   */
  private async calculateFocusTimeScore(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('focusSessions')
      .where('completed', '==', true)
      .where('startTime', '>=', Timestamp.fromDate(weekAgo))
      .get();

    return snapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().duration || 0),
      0
    );
  }

  /**
   * Calculate badges score
   */
  private async calculateBadgesScore(userId: string): Promise<number> {
    const userDoc = await db.collection('users').doc(userId).get();
    const badges = userDoc.data()?.badges || [];
    
    // Score based on tier: bronze=10, silver=25, gold=50, platinum=100
    const tierPoints: Record<string, number> = {
      bronze: 10,
      silver: 25,
      gold: 50,
      platinum: 100,
    };

    return badges.reduce((total: number, badge: {unlockedAt?: Date; tier: string}) => {
      if (badge.unlockedAt) {
        return total + (tierPoints[badge.tier] || 0);
      }
      return total;
    }, 0);
  }

  /**
   * Calculate weekly challenge score
   */
  private async calculateWeeklyChallengeScore(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('completedChallenges')
      .where('completedAt', '>=', Timestamp.fromDate(weekAgo))
      .get();

    return snapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().points || 0),
      0
    );
  }

  /**
   * Reset weekly challenge leaderboard
   */
  async resetWeeklyChallenge(): Promise<void> {
    const snapshot = await db
      .collection(this.LEADERBOARD_COLLECTION)
      .doc('weekly_challenge')
      .collection(this.ENTRIES_COLLECTION)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {score: 0});
    });

    await batch.commit();

    // Update metadata
    await db.collection(this.LEADERBOARD_COLLECTION).doc('weekly_challenge').set({
      lastReset: Timestamp.now(),
      lastUpdated: Timestamp.now(),
    }, {merge: true});
  }
}

export const leaderboardService = new LeaderboardService();
