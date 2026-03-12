import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserStats, Badge} from '../../types';

const initialState: UserStats = {
  totalFocusTime: 0,
  totalBlockedTime: 0,
  currentStreak: 0,
  longestStreak: 0,
  focusCoins: 0,
  badges: [],
  weeklyScreenTime: [0, 0, 0, 0, 0, 0, 0],
  dailyAverage: 0,
  lifeTimeGained: 0,
};

const defaultBadges: Badge[] = [
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7 days without blocked apps',
    icon: '🔥',
    tier: 'bronze',
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: '30 days without blocked apps',
    icon: '🔥',
    tier: 'silver',
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'social_detox_7',
    name: 'Social Detox',
    description: '1 week without social media',
    icon: '🏆',
    tier: 'silver',
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'digital_sabbath',
    name: 'Digital Sabbath',
    description: '24 hours completely offline',
    icon: '📵',
    tier: 'gold',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'sleep_champion',
    name: 'Sleep Champion',
    description: '30 days bedtime mode maintained',
    icon: '🌙',
    tier: 'gold',
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'focus_king',
    name: 'Focus King',
    description: '100 hours Focus Mode used',
    icon: '🎯',
    tier: 'platinum',
    progress: 0,
    maxProgress: 6000, // 100 hours in minutes
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'No social media before 8 AM',
    icon: '🥇',
    tier: 'bronze',
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete weekend without mobile games',
    icon: '💪',
    tier: 'silver',
    progress: 0,
    maxProgress: 1,
  },
];

const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    ...initialState,
    badges: defaultBadges,
  },
  reducers: {
    addFocusTime: (state, action: PayloadAction<number>) => {
      state.totalFocusTime += action.payload;
      
      // Update Focus King badge
      const focusKing = state.badges.find(b => b.id === 'focus_king');
      if (focusKing && !focusKing.unlockedAt) {
        focusKing.progress = Math.min(focusKing.progress + action.payload, focusKing.maxProgress);
        if (focusKing.progress >= focusKing.maxProgress) {
          focusKing.unlockedAt = new Date();
        }
      }
    },
    addBlockedTime: (state, action: PayloadAction<number>) => {
      state.totalBlockedTime += action.payload;
      state.lifeTimeGained = Math.floor(state.totalBlockedTime / 60);
    },
    incrementStreak: (state) => {
      state.currentStreak += 1;
      if (state.currentStreak > state.longestStreak) {
        state.longestStreak = state.currentStreak;
      }
      
      // Update streak badges
      const weekWarrior = state.badges.find(b => b.id === 'streak_7');
      const monthMaster = state.badges.find(b => b.id === 'streak_30');
      
      if (weekWarrior && !weekWarrior.unlockedAt) {
        weekWarrior.progress = Math.min(state.currentStreak, weekWarrior.maxProgress);
        if (weekWarrior.progress >= weekWarrior.maxProgress) {
          weekWarrior.unlockedAt = new Date();
          state.focusCoins += 50;
        }
      }
      
      if (monthMaster && !monthMaster.unlockedAt) {
        monthMaster.progress = Math.min(state.currentStreak, monthMaster.maxProgress);
        if (monthMaster.progress >= monthMaster.maxProgress) {
          monthMaster.unlockedAt = new Date();
          state.focusCoins += 200;
        }
      }
    },
    resetStreak: (state) => {
      state.currentStreak = 0;
    },
    addFocusCoins: (state, action: PayloadAction<number>) => {
      state.focusCoins += action.payload;
    },
    spendFocusCoins: (state, action: PayloadAction<number>) => {
      state.focusCoins = Math.max(0, state.focusCoins - action.payload);
    },
    updateWeeklyScreenTime: (state, action: PayloadAction<number[]>) => {
      state.weeklyScreenTime = action.payload;
      state.dailyAverage = action.payload.reduce((a, b) => a + b, 0) / 7;
    },
    unlockBadge: (state, action: PayloadAction<string>) => {
      const badge = state.badges.find(b => b.id === action.payload);
      if (badge && !badge.unlockedAt) {
        badge.unlockedAt = new Date();
        badge.progress = badge.maxProgress;
      }
    },
    updateBadgeProgress: (state, action: PayloadAction<{id: string; progress: number}>) => {
      const badge = state.badges.find(b => b.id === action.payload.id);
      if (badge && !badge.unlockedAt) {
        badge.progress = Math.min(action.payload.progress, badge.maxProgress);
        if (badge.progress >= badge.maxProgress) {
          badge.unlockedAt = new Date();
        }
      }
    },
  },
});

export const {
  addFocusTime,
  addBlockedTime,
  incrementStreak,
  resetStreak,
  addFocusCoins,
  spendFocusCoins,
  updateWeeklyScreenTime,
  unlockBadge,
  updateBadgeProgress,
} = statsSlice.actions;

export default statsSlice.reducer;
