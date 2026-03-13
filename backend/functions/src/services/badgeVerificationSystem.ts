/**
 * Badge Verification System
 * 
 * Handles badge unlock logic and verification.
 * Checks user progress against badge requirements and awards badges.
 */

import {db, FieldValue, Timestamp} from '../config/firebase';
import {PushNotificationService} from './pushNotificationService';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  requirement: BadgeRequirement;
  reward: number; // Focus Coins
}

export type BadgeRequirement =
  | {type: 'streak'; days: number}
  | {type: 'focus_time'; minutes: number}
  | {type: 'blocked_time'; minutes: number}
  | {type: 'social_detox'; days: number; category: string}
  | {type: 'digital_sabbath'; hours: number}
  | {type: 'early_bird'; days: number; beforeHour: number}
  | {type: 'weekend_warrior'; consecutiveWeekends: number}
  | {type: 'bedtime'; days: number}
  | {type: 'custom'; check: (userId: string) => Promise<boolean>};

export interface UserBadge {
  badgeId: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

export class BadgeVerificationSystem {
  private readonly BADGES_COLLECTION = 'badges';
  private readonly USER_BADGES_COLLECTION = 'userBadges';
  private notificationService: PushNotificationService;

  constructor(notificationService: PushNotificationService) {
    this.notificationService = notificationService;
  }

  // Predefined badges
  static readonly DEFAULT_BADGES: Badge[] = [
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: '7 Tage ohne blockierte Apps',
      icon: '🔥',
      tier: 'bronze',
      requirement: {type: 'streak', days: 7},
      reward: 50,
    },
    {
      id: 'streak_30',
      name: 'Month Master',
      description: '30 Tage ohne blockierte Apps',
      icon: '🔥',
      tier: 'silver',
      requirement: {type: 'streak', days: 30},
      reward: 200,
    },
    {
      id: 'streak_100',
      name: 'Centurion',
      description: '100 Tage Streak',
      icon: '💯',
      tier: 'gold',
      requirement: {type: 'streak', days: 100},
      reward: 500,
    },
    {
      id: 'focus_king',
      name: 'Focus King',
      description: '100 Stunden Fokus-Modus',
      icon: '🎯',
      tier: 'platinum',
      requirement: {type: 'focus_time', minutes: 6000},
      reward: 1000,
    },
    {
      id: 'social_detox_7',
      name: 'Social Detox',
      description: '1 Woche ohne Social Media',
      icon: '🏆',
      tier: 'silver',
      requirement: {type: 'social_detox', days: 7, category: 'social'},
      reward: 150,
    },
    {
      id: 'digital_sabbath',
      name: 'Digital Sabbath',
      description: '24 Stunden komplett offline',
      icon: '📵',
      tier: 'gold',
      requirement: {type: 'digital_sabbath', hours: 24},
      reward: 300,
    },
    {
      id: 'sleep_champion',
      name: 'Sleep Champion',
      description: '30 Tage Schlafenszeit eingehalten',
      icon: '🌙',
      tier: 'gold',
      requirement: {type: 'bedtime', days: 30},
      reward: 300,
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: '7 Tage kein Social Media vor 8 Uhr',
      icon: '🥇',
      tier: 'bronze',
      requirement: {type: 'early_bird', days: 7, beforeHour: 8},
      reward: 50,
    },
    {
      id: 'weekend_warrior',
      name: 'Weekend Warrior',
      description: 'Wochenende ohne Mobile Games',
      icon: '💪',
      tier: 'silver',
      requirement: {type: 'weekend_warrior', consecutiveWeekends: 1},
      reward: 100,
    },
    {
      id: 'time_saver',
      name: 'Time Saver',
      description: '10 Stunden gespart durch App-Blocking',
      icon: '⏰',
      tier: 'bronze',
      requirement: {type: 'blocked_time', minutes: 600},
      reward: 75,
    },
    {
      id: 'master_saver',
      name: 'Master Saver',
      description: '100 Stunden gespart durch App-Blocking',
      icon: '⏳',
      tier: 'gold',
      requirement: {type: 'blocked_time', minutes: 6000},
      reward: 500,
    },
  ];

  /**
   * Initialize default badges in Firestore
   */
  async initializeBadges(): Promise<void> {
    const batch = db.batch();

    for (const badge of BadgeVerificationSystem.DEFAULT_BADGES) {
      const badgeRef = db.collection(this.BADGES_COLLECTION).doc(badge.id);
      batch.set(badgeRef, badge, {merge: true});
    }

    await batch.commit();
  }

  /**
   * Check and award badges for a user
   */
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const awardedBadges: string[] = [];

    // Get user's current badges
    const userBadgesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection(this.USER_BADGES_COLLECTION)
      .get();

    const unlockedBadgeIds = new Set(
      userBadgesSnapshot.docs
        .filter((doc) => doc.data().unlockedAt)
        .map((doc) => doc.id)
    );

    // Check each badge
    for (const badge of BadgeVerificationSystem.DEFAULT_BADGES) {
      if (unlockedBadgeIds.has(badge.id)) {
        continue; // Already unlocked
      }

      const isEligible = await this.checkBadgeEligibility(userId, badge);

      if (isEligible) {
        await this.awardBadge(userId, badge);
        awardedBadges.push(badge.id);
      }
    }

    return awardedBadges;
  }

  /**
   * Check if user is eligible for a specific badge
   */
  async checkBadgeEligibility(userId: string, badge: Badge): Promise<boolean> {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return false;
    }

    const req = badge.requirement;

    switch (req.type) {
      case 'streak':
        return (userData.currentStreak || 0) >= req.days;

      case 'focus_time': {
        const focusSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('focusSessions')
          .where('completed', '==', true)
          .get();
        const totalFocusTime = focusSnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().duration || 0),
          0
        );
        return totalFocusTime >= req.minutes;
      }

      case 'blocked_time':
        return (userData.totalBlockedTime || 0) >= req.minutes;

      case 'social_detox': {
        const detoxSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('socialDetoxPeriods')
          .where('completed', '==', true)
          .where('duration', '>=', req.days)
          .get();
        return !detoxSnapshot.empty;
      }

      case 'digital_sabbath': {
        const sabbathSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('digitalSabbaths')
          .where('completed', '==', true)
          .get();
        return !sabbathSnapshot.empty;
      }

      case 'bedtime':
        return (userData.bedtimeStreak || 0) >= req.days;

      case 'early_bird': {
        const earlyBirdSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('earlyBirdDays')
          .where('date', '>=', this.getDateDaysAgo(req.days))
          .get();
        return earlyBirdSnapshot.size >= req.days;
      }

      case 'weekend_warrior': {
        const weekendSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('weekendWarrior')
          .where('completed', '==', true)
          .get();
        return weekendSnapshot.size >= req.consecutiveWeekends;
      }

      default:
        return false;
    }
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badge: Badge): Promise<void> {
    const batch = db.batch();

    // Add to user's badges
    const userBadgeRef = db
      .collection('users')
      .doc(userId)
      .collection(this.USER_BADGES_COLLECTION)
      .doc(badge.id);

    batch.set(userBadgeRef, {
      badgeId: badge.id,
      unlockedAt: Timestamp.now(),
      progress: badge.requirement.type === 'streak' 
        ? badge.requirement.days 
        : (badge.requirement as any).minutes || 1,
      maxProgress: badge.requirement.type === 'streak'
        ? badge.requirement.days
        : (badge.requirement as any).minutes || 1,
    });

    // Add Focus Coins reward
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, {
      focusCoins: FieldValue.increment(badge.reward),
    });

    await batch.commit();

    // Send notification
    await this.notificationService.sendAchievementUnlocked(
      userId,
      badge.name,
      badge.tier
    );
  }

  /**
   * Get badge progress for a user
   */
  async getBadgeProgress(userId: string): Promise<UserBadge[]> {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection(this.USER_BADGES_COLLECTION)
      .get();

    return snapshot.docs.map((doc) => doc.data() as UserBadge);
  }

  /**
   * Update progress for a specific badge type
   */
  async updateProgress(
    userId: string,
    badgeId: string,
    progress: number
  ): Promise<void> {
    const badgeRef = db
      .collection('users')
      .doc(userId)
      .collection(this.USER_BADGES_COLLECTION)
      .doc(badgeId);

    await badgeRef.set(
      {
        progress,
        updatedAt: Timestamp.now(),
      },
      {merge: true}
    );
  }

  /**
   * Record early bird day (no social media before specified hour)
   */
  async recordEarlyBirdDay(userId: string, beforeHour: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await db
      .collection('users')
      .doc(userId)
      .collection('earlyBirdDays')
      .doc(today)
      .set({
        date: today,
        beforeHour,
        timestamp: Timestamp.now(),
      });
  }

  /**
   * Record digital sabbath attempt
   */
  async recordDigitalSabbath(
    userId: string,
    startTime: Date,
    endTime: Date,
    completed: boolean
  ): Promise<void> {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

    await db.collection('users').doc(userId).collection('digitalSabbaths').add({
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      duration,
      completed,
      timestamp: Timestamp.now(),
    });
  }

  /**
   * Record weekend warrior completion
   */
  async recordWeekendWarrior(userId: string, weekendDate: Date): Promise<void> {
    const weekendKey = weekendDate.toISOString().split('T')[0];

    await db
      .collection('users')
      .doc(userId)
      .collection('weekendWarrior')
      .doc(weekendKey)
      .set({
        weekendDate: weekendKey,
        completed: true,
        timestamp: Timestamp.now(),
      });
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

export const createBadgeVerificationSystem = (
  notificationService: PushNotificationService
) => new BadgeVerificationSystem(notificationService);
