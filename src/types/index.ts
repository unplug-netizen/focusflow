export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  isAnonymous: boolean;
}

export interface AppUsage {
  packageName: string;
  appName: string;
  icon?: string;
  usageTime: number; // in minutes
  dailyLimit?: number;
  isBlocked: boolean;
  category: AppCategory;
}

export type AppCategory = 
  | 'social'
  | 'entertainment'
  | 'productivity'
  | 'communication'
  | 'games'
  | 'shopping'
  | 'other';

export interface BlockRule {
  id: string;
  packageName: string;
  appName: string;
  type: 'schedule' | 'limit' | 'permanent';
  schedule?: {
    startTime: string; // HH:mm
    endTime: string;
    days: number[]; // 0-6, Sunday = 0
  };
  dailyLimit?: number; // in minutes
  isActive: boolean;
  createdAt: Date;
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  type: 'pomodoro' | 'deep_work' | 'custom';
  completed: boolean;
  interruptions: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

export interface UserStats {
  totalFocusTime: number; // in minutes
  totalBlockedTime: number;
  currentStreak: number;
  longestStreak: number;
  focusCoins: number;
  badges: Badge[];
  weeklyScreenTime: number[]; // 7 days
  dailyAverage: number;
  lifeTimeGained: number; // in hours
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
}

export type LeaderboardCategory = 
  | 'screen_time'
  | 'focus_time'
  | 'badges'
  | 'streak'
  | 'weekly_challenge';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  startDate: Date;
  endDate: Date;
  reward: number; // Focus Coins
  participants: number;
  isCompleted: boolean;
}

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerState {
  status: TimerStatus;
  timeRemaining: number; // in seconds
  totalTime: number;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  currentSession: number;
  totalSessions: number;
}
