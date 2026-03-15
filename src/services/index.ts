import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "@focusflow:";

/**
 * Storage service for persistent data
 */
export const storage = {
  /**
   * Get item from storage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  /**
   * Set item in storage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },

  /**
   * Clear all app storage
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => key.replace(STORAGE_PREFIX, ""));
    } catch (error) {
      console.error("Error getting keys:", error);
      return [];
    }
  },
};

/**
 * App usage tracking service
 * Note: Actual implementation requires native modules
 */
export const appUsageService = {
  /**
   * Get app usage stats
   */
  async getAppUsage(): Promise<
    { packageName: string; usageTime: number }[]
  > {
    // TODO: Implement with native module
    return [];
  },

  /**
   * Check if app blocking is available
   */
  async isBlockingAvailable(): Promise<boolean> {
    // TODO: Implement with native module
    return false;
  },

  /**
   * Block an app
   */
  async blockApp(packageName: string): Promise<boolean> {
    // TODO: Implement with native module
    console.log(`Blocking app: ${packageName}`);
    return true;
  },

  /**
   * Unblock an app
   */
  async unblockApp(packageName: string): Promise<boolean> {
    // TODO: Implement with native module
    console.log(`Unblocking app: ${packageName}`);
    return true;
  },
};

/**
 * Notification service
 * Note: Actual implementation requires native modules
 */
export const notificationService = {
  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    delaySeconds: number
  ): Promise<string | null> {
    // TODO: Implement with native module
    console.log(`Scheduling notification in ${delaySeconds}s: ${title}`);
    return null;
  },

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(id: string): Promise<void> {
    // TODO: Implement with native module
    console.log(`Canceling notification: ${id}`);
  },

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    // TODO: Implement with native module
    return true;
  },
};
