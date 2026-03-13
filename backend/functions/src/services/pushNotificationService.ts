/**
 * Push Notification Service
 * 
 * Handles sending push notifications to users via Firebase Cloud Messaging.
 * Supports various notification types: streak reminders, achievement unlocks,
 * leaderboard updates, and custom messages.
 */

import {messaging, db, Timestamp} from '../config/firebase';
import {Message, MulticastMessage} from 'firebase-admin/messaging';

export type NotificationType =
  | 'streak_reminder'
  | 'achievement_unlocked'
  | 'leaderboard_update'
  | 'daily_summary'
  | 'challenge_reminder'
  | 'limit_warning'
  | 'focus_reminder'
  | 'system';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface UserPreferences {
  streakReminders: boolean;
  achievementNotifications: boolean;
  leaderboardUpdates: boolean;
  dailySummary: boolean;
  challengeReminders: boolean;
  limitWarnings: boolean;
  focusReminders: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
}

export class PushNotificationService {
  private readonly TOKENS_COLLECTION = 'fcmTokens';
  private readonly NOTIFICATIONS_COLLECTION = 'notifications';

  /**
   * Register a user's FCM token
   */
  async registerToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    const tokenRef = db
      .collection('users')
      .doc(userId)
      .collection(this.TOKENS_COLLECTION)
      .doc(token);

    await tokenRef.set({
      token,
      platform,
      createdAt: Timestamp.now(),
      lastUsed: Timestamp.now(),
      active: true,
    });
  }

  /**
   * Unregister a token
   */
  async unregisterToken(userId: string, token: string): Promise<void> {
    await db
      .collection('users')
      .doc(userId)
      .collection(this.TOKENS_COLLECTION)
      .doc(token)
      .delete();
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload,
    options: {respectQuietHours?: boolean; respectPreferences?: boolean} = {}
  ): Promise<{success: boolean; error?: string}> {
    try {
      // Check preferences if needed
      if (options.respectPreferences !== false) {
        const shouldSend = await this.shouldSendNotification(userId, payload.type);
        if (!shouldSend) {
          return {success: true}; // Silently skip
        }
      }

      // Check quiet hours if needed
      if (options.respectQuietHours !== false) {
        const inQuietHours = await this.isInQuietHours(userId);
        if (inQuietHours) {
          // Queue for later delivery
          await this.queueNotification(userId, payload);
          return {success: true};
        }
      }

      // Get user's tokens
      const tokensSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection(this.TOKENS_COLLECTION)
        .where('active', '==', true)
        .get();

      if (tokensSnapshot.empty) {
        return {success: false, error: 'No active tokens found'};
      }

      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

      // Send multicast
      const message: MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          type: payload.type,
          ...payload.data,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: payload.type,
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);

      // Handle failures and token cleanup
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            // Check for invalid token errors
            if (
              resp.error?.code === 'messaging/registration-token-not-registered' ||
              resp.error?.code === 'messaging/invalid-registration-token'
            ) {
              this.unregisterToken(userId, tokens[idx]);
            }
          }
        });
      }

      // Log notification
      await this.logNotification(userId, payload, response.successCount > 0);

      return {success: response.successCount > 0};
    } catch (error: any) {
      console.error('Error sending notification:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultiple(
    userIds: string[],
    payload: NotificationPayload
  ): Promise<{successful: number; failed: number}> {
    let successful = 0;
    let failed = 0;

    // Process in batches of 500
    const batchSize = 500;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((userId) => this.sendToUser(userId, payload))
      );

      results.forEach((result) => {
        if (result.success) successful++;
        else failed++;
      });
    }

    return {successful, failed};
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    payload: NotificationPayload
  ): Promise<{success: boolean; error?: string}> {
    try {
      const message: Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          type: payload.type,
          ...payload.data,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: payload.type,
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      await messaging.send(message);
      return {success: true};
    } catch (error: any) {
      console.error('Error sending topic notification:', error);
      return {success: false, error: error.message};
    }
  }

  /**
   * Subscribe user to topic
   */
  async subscribeToTopic(userId: string, topic: string): Promise<void> {
    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection(this.TOKENS_COLLECTION)
      .where('active', '==', true)
      .get();

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    if (tokens.length > 0) {
      await messaging.subscribeToTopic(tokens, topic);
    }
  }

  /**
   * Unsubscribe user from topic
   */
  async unsubscribeFromTopic(userId: string, topic: string): Promise<void> {
    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection(this.TOKENS_COLLECTION)
      .where('active', '==', true)
      .get();

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    if (tokens.length > 0) {
      await messaging.unsubscribeFromTopic(tokens, topic);
    }
  }

  /**
   * Send streak reminder notification
   */
  async sendStreakReminder(userId: string, streak: number): Promise<void> {
    await this.sendToUser(userId, {
      type: 'streak_reminder',
      title: '🔥 Streak in Gefahr!',
      body: `Du hast eine ${streak}-Tage-Streak. Öffne die App, um sie zu erhalten!`,
      data: {
        streak: streak.toString(),
        action: 'open_app',
      },
    });
  }

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlocked(
    userId: string,
    badgeName: string,
    tier: string
  ): Promise<void> {
    const tierEmojis: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };

    await this.sendToUser(userId, {
      type: 'achievement_unlocked',
      title: `${tierEmojis[tier] || '🏆'} Badge freigeschaltet!`,
      body: `Herzlichen Glückwunsch! Du hast "${badgeName}" freigeschaltet.`,
      data: {
        badgeName,
        tier,
        action: 'view_badges',
      },
    });
  }

  /**
   * Send leaderboard update notification
   */
  async sendLeaderboardUpdate(
    userId: string,
    newRank: number,
    oldRank: number
  ): Promise<void> {
    if (newRank < oldRank) {
      await this.sendToUser(userId, {
        type: 'leaderboard_update',
        title: '📈 Aufstieg in der Rangliste!',
        body: `Super! Du bist jetzt auf Platz ${newRank} (vorher: ${oldRank}).`,
        data: {
          newRank: newRank.toString(),
          oldRank: oldRank.toString(),
          action: 'view_leaderboard',
        },
      });
    }
  }

  /**
   * Send daily summary notification
   */
  async sendDailySummary(
    userId: string,
    stats: {
      screenTime: number;
      focusTime: number;
      blockedAttempts: number;
    }
  ): Promise<void> {
    const hours = Math.floor(stats.screenTime / 60);
    const minutes = stats.screenTime % 60;

    await this.sendToUser(userId, {
      type: 'daily_summary',
      title: '📊 Dein Tagesbericht',
      body: `Bildschirmzeit: ${hours}h ${minutes}m | Fokus: ${stats.focusTime}m | Blockiert: ${stats.blockedAttempts}x`,
      data: {
        screenTime: stats.screenTime.toString(),
        focusTime: stats.focusTime.toString(),
        blockedAttempts: stats.blockedAttempts.toString(),
        action: 'view_stats',
      },
    });
  }

  /**
   * Send app limit warning
   */
  async sendLimitWarning(
    userId: string,
    appName: string,
    currentUsage: number,
    limit: number
  ): Promise<void> {
    const remaining = Math.max(0, limit - currentUsage);

    await this.sendToUser(userId, {
      type: 'limit_warning',
      title: '⏰ Zeitlimit erreicht',
      body: `Du hast dein Limit für ${appName} fast erreicht. Noch ${remaining} Minuten übrig.`,
      data: {
        appName,
        remaining: remaining.toString(),
        action: 'view_limits',
      },
    });
  }

  /**
   * Check if user has enabled this notification type
   */
  private async shouldSendNotification(
    userId: string,
    type: NotificationType
  ): Promise<boolean> {
    const prefsDoc = await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('notifications')
      .get();

    if (!prefsDoc.exists) {
      return true; // Default to sending if no preferences set
    }

    const prefs = prefsDoc.data() as UserPreferences;

    const typeMap: Record<NotificationType, keyof UserPreferences> = {
      streak_reminder: 'streakReminders',
      achievement_unlocked: 'achievementNotifications',
      leaderboard_update: 'leaderboardUpdates',
      daily_summary: 'dailySummary',
      challenge_reminder: 'challengeReminders',
      limit_warning: 'limitWarnings',
      focus_reminder: 'focusReminders',
      system: 'streakReminders', // System notifications always respect streak setting
    };

    const setting = typeMap[type];
    const value = prefs[setting];
    return typeof value === 'boolean' ? value : true;
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private async isInQuietHours(userId: string): Promise<boolean> {
    const prefsDoc = await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('notifications')
      .get();

    if (!prefsDoc.exists) {
      return false;
    }

    const prefs = prefsDoc.data() as UserPreferences;

    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const {quietHoursStart, quietHoursEnd} = prefs;

    if (quietHoursStart <= quietHoursEnd) {
      // Same day range (e.g., 22:00 - 08:00 doesn't work with this)
      return currentTime >= quietHoursStart && currentTime <= quietHoursEnd;
    } else {
      // Overnight range (e.g., 22:00 - 08:00)
      return currentTime >= quietHoursStart || currentTime <= quietHoursEnd;
    }
  }

  /**
   * Queue notification for later delivery
   */
  private async queueNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    await db.collection('notificationQueue').add({
      userId,
      payload,
      createdAt: Timestamp.now(),
      scheduledFor: this.getNextNonQuietHour(userId),
    });
  }

  /**
   * Log sent notification
   */
  private async logNotification(
    userId: string,
    payload: NotificationPayload,
    delivered: boolean
  ): Promise<void> {
    await db
      .collection('users')
      .doc(userId)
      .collection(this.NOTIFICATIONS_COLLECTION)
      .add({
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        delivered,
        timestamp: Timestamp.now(),
      });
  }

  /**
   * Get next time outside quiet hours
   */
  private getNextNonQuietHour(userId: string): Date {
    // Simplified - in production, fetch user's quiet hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }
}

export const pushNotificationService = new PushNotificationService();
