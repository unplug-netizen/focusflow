/**
 * Challenge Service
 * 
 * Manages weekly challenges and user participation.
 * Challenges are time-limited goals that users can complete for rewards.
 */

import {db, FieldValue, Timestamp} from '../config/firebase';
import {PushNotificationService} from './pushNotificationService';

export type ChallengeType = 
  | 'reduce_screen_time'
  | 'focus_sessions'
  | 'social_detox'
  | 'early_bird'
  | 'weekend_warrior'
  | 'bedtime_streak'
  | 'blocked_attempts';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  unit: string;
  reward: number;
  startDate: Date;
  endDate: Date;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserChallengeProgress {
  challengeId: string;
  userId: string;
  currentProgress: number;
  target: number;
  completed: boolean;
  completedAt?: Date;
  rewardClaimed: boolean;
}

export class ChallengeService {
  private readonly CHALLENGES_COLLECTION = 'challenges';
  private readonly USER_CHALLENGES_COLLECTION = 'userChallenges';
  private notificationService: PushNotificationService;

  constructor(notificationService: PushNotificationService) {
    this.notificationService = notificationService;
  }

  // Predefined weekly challenges
  static readonly WEEKLY_CHALLENGES: Omit<Challenge, 'id' | 'startDate' | 'endDate'>[] = [
    {
      title: 'Screen Time Reducer',
      description: 'Reduziere deine tägliche Bildschirmzeit um 30%',
      type: 'reduce_screen_time',
      target: 30,
      unit: 'percent',
      reward: 100,
      icon: '📱',
      difficulty: 'medium',
    },
    {
      title: 'Focus Master',
      description: 'Schließe 10 Fokus-Sitzungen erfolgreich ab',
      type: 'focus_sessions',
      target: 10,
      unit: 'sessions',
      reward: 150,
      icon: '🎯',
      difficulty: 'medium',
    },
    {
      title: 'Social Detox',
      description: 'Verbringe 3 Tage ohne Social Media Apps',
      type: 'social_detox',
      target: 3,
      unit: 'days',
      reward: 200,
      icon: '🧘',
      difficulty: 'hard',
    },
    {
      title: 'Early Bird',
      description: 'Öffne keine Social Media Apps vor 8 Uhr für 5 Tage',
      type: 'early_bird',
      target: 5,
      unit: 'days',
      reward: 100,
      icon: '🌅',
      difficulty: 'easy',
    },
    {
      title: 'Weekend Warrior',
      description: 'Bleib am Wochenende von Mobile Games frei',
      type: 'weekend_warrior',
      target: 1,
      unit: 'weekend',
      reward: 75,
      icon: '💪',
      difficulty: 'medium',
    },
    {
      title: 'Sleep Champion',
      description: 'Halte deine Schlafenszeit 7 Tage lang ein',
      type: 'bedtime_streak',
      target: 7,
      unit: 'days',
      reward: 150,
      icon: '🌙',
      difficulty: 'medium',
    },
    {
      title: 'Block Master',
      description: 'Lass dich 20x erfolgreich von der App blockieren',
      type: 'blocked_attempts',
      target: 20,
      unit: 'blocks',
      reward: 50,
      icon: '🚫',
      difficulty: 'easy',
    },
  ];

  /**
   * Create weekly challenges
   */
  async createWeeklyChallenges(weekStartDate: Date = new Date()): Promise<Challenge[]> {
    // Set start to Monday of current week
    const startDate = new Date(weekStartDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const weekId = startDate.toISOString().split('T')[0];
    const challenges: Challenge[] = [];

    // Select 3 random challenges for the week
    const shuffled = [...ChallengeService.WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    for (let i = 0; i < selected.length; i++) {
      const template = selected[i];
      const challenge: Challenge = {
        ...template,
        id: `${weekId}_${i}`,
        startDate,
        endDate,
      };

      await db
        .collection(this.CHALLENGES_COLLECTION)
        .doc(challenge.id)
        .set({
          ...challenge,
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
        });

      challenges.push(challenge);
    }

    return challenges;
  }

  /**
   * Get current week's challenges
   */
  async getCurrentChallenges(): Promise<Challenge[]> {
    const now = new Date();
    
    const snapshot = await db
      .collection(this.CHALLENGES_COLLECTION)
      .where('startDate', '<=', Timestamp.fromDate(now))
      .where('endDate', '>', Timestamp.fromDate(now))
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
      } as Challenge;
    });
  }

  /**
   * Get user's challenge progress
   */
  async getUserChallenges(userId: string): Promise<UserChallengeProgress[]> {
    const currentChallenges = await this.getCurrentChallenges();
    const progressList: UserChallengeProgress[] = [];

    for (const challenge of currentChallenges) {
      const progressDoc = await db
        .collection('users')
        .doc(userId)
        .collection(this.USER_CHALLENGES_COLLECTION)
        .doc(challenge.id)
        .get();

      if (progressDoc.exists) {
        progressList.push(progressDoc.data() as UserChallengeProgress);
      } else {
        // Initialize progress
        const progress: UserChallengeProgress = {
          challengeId: challenge.id,
          userId,
          currentProgress: 0,
          target: challenge.target,
          completed: false,
          rewardClaimed: false,
        };

        await db
          .collection('users')
          .doc(userId)
          .collection(this.USER_CHALLENGES_COLLECTION)
          .doc(challenge.id)
          .set(progress);

        progressList.push(progress);
      }
    }

    return progressList;
  }

  /**
   * Update challenge progress
   */
  async updateProgress(
    userId: string,
    challengeId: string,
    progress: number
  ): Promise<{completed: boolean; newlyCompleted: boolean}> {
    const challengeDoc = await db
      .collection(this.CHALLENGES_COLLECTION)
      .doc(challengeId)
      .get();

    if (!challengeDoc.exists) {
      throw new Error('Challenge not found');
    }

    const challenge = challengeDoc.data() as Challenge;

    const progressRef = db
      .collection('users')
      .doc(userId)
      .collection(this.USER_CHALLENGES_COLLECTION)
      .doc(challengeId);

    const progressDoc = await progressRef.get();
    const currentData = progressDoc.data() as UserChallengeProgress | undefined;
    const wasCompleted = currentData?.completed || false;
    const nowCompleted = progress >= challenge.target;

    await progressRef.set({
      challengeId,
      userId,
      currentProgress: progress,
      target: challenge.target,
      completed: nowCompleted,
      completedAt: nowCompleted && !wasCompleted ? Timestamp.now() : currentData?.completedAt,
      rewardClaimed: currentData?.rewardClaimed || false,
    }, {merge: true});

    // Send notification if newly completed
    if (nowCompleted && !wasCompleted) {
      await this.notificationService.sendToUser(userId, {
        type: 'challenge_reminder',
        title: '🏆 Challenge abgeschlossen!',
        body: `Herzlichen Glückwunsch! Du hast "${challenge.title}" abgeschlossen.`,
        data: {
          challengeId,
          reward: challenge.reward.toString(),
          action: 'claim_reward',
        },
      });
    }

    return {
      completed: nowCompleted,
      newlyCompleted: nowCompleted && !wasCompleted,
    };
  }

  /**
   * Claim challenge reward
   */
  async claimReward(userId: string, challengeId: string): Promise<{success: boolean; reward: number}> {
    const progressRef = db
      .collection('users')
      .doc(userId)
      .collection(this.USER_CHALLENGES_COLLECTION)
      .doc(challengeId);

    const progressDoc = await progressRef.get();

    if (!progressDoc.exists) {
      throw new Error('Challenge progress not found');
    }

    const progress = progressDoc.data() as UserChallengeProgress;

    if (!progress.completed) {
      throw new Error('Challenge not completed yet');
    }

    if (progress.rewardClaimed) {
      throw new Error('Reward already claimed');
    }

    // Get challenge reward amount
    const challengeDoc = await db
      .collection(this.CHALLENGES_COLLECTION)
      .doc(challengeId)
      .get();

    const challenge = challengeDoc.data() as Challenge;

    // Update progress and award coins
    const batch = db.batch();

    batch.update(progressRef, {
      rewardClaimed: true,
      claimedAt: Timestamp.now(),
    });

    batch.update(db.collection('users').doc(userId), {
      focusCoins: FieldValue.increment(challenge.reward),
    });

    await batch.commit();

    return {
      success: true,
      reward: challenge.reward,
    };
  }

  /**
   * Check and update challenge progress based on user activity
   */
  async checkChallengeProgress(userId: string, activityType: ChallengeType, value: number): Promise<void> {
    const userChallenges = await this.getUserChallenges(userId);

    for (const progress of userChallenges) {
      const challengeDoc = await db
        .collection(this.CHALLENGES_COLLECTION)
        .doc(progress.challengeId)
        .get();

      const challenge = challengeDoc.data() as Challenge;

      if (challenge.type === activityType && !progress.completed) {
        await this.updateProgress(userId, progress.challengeId, value);
      }
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string, limit: number = 10): Promise<{
    userId: string;
    displayName: string;
    progress: number;
    completed: boolean;
    completedAt?: Date;
    rank: number;
  }[]> {
    const snapshot = await db
      .collectionGroup(this.USER_CHALLENGES_COLLECTION)
      .where('challengeId', '==', challengeId)
      .orderBy('completed', 'desc')
      .orderBy('completedAt', 'asc')
      .orderBy('currentProgress', 'desc')
      .limit(limit)
      .get();

    const results = [];
    for (let i = 0; i < snapshot.docs.length; i++) {
      const doc = snapshot.docs[i];
      const data = doc.data();
      
      // Get user info
      const userDoc = await db.collection('users').doc(data.userId).get();
      const userData = userDoc.data();

      results.push({
        userId: data.userId,
        displayName: userData?.displayName || 'Anonymous',
        progress: data.currentProgress,
        completed: data.completed,
        completedAt: data.completedAt?.toDate(),
        rank: i + 1,
      });
    }

    return results;
  }
}

export const createChallengeService = (notificationService: PushNotificationService) => 
  new ChallengeService(notificationService);
