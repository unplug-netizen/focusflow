import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TimerState, FocusSession} from '../../types';

interface FocusModeState {
  timer: TimerState;
  sessions: FocusSession[];
  soundEnabled: boolean;
  selectedSound: string;
  notificationsBlocked: boolean;
}

const initialState: FocusModeState = {
  timer: {
    status: 'idle',
    timeRemaining: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    mode: 'pomodoro',
    currentSession: 1,
    totalSessions: 4,
  },
  sessions: [],
  soundEnabled: true,
  selectedSound: 'rain',
  notificationsBlocked: false,
};

const focusModeSlice = createSlice({
  name: 'focusMode',
  initialState,
  reducers: {
    startTimer: (state) => {
      state.timer.status = 'running';
    },
    pauseTimer: (state) => {
      state.timer.status = 'paused';
    },
    resumeTimer: (state) => {
      state.timer.status = 'running';
    },
    stopTimer: (state) => {
      state.timer.status = 'idle';
      state.timer.timeRemaining = state.timer.totalTime;
    },
    tick: (state) => {
      if (state.timer.status === 'running' && state.timer.timeRemaining > 0) {
        state.timer.timeRemaining -= 1;
      }
      if (state.timer.timeRemaining === 0) {
        state.timer.status = 'completed';
      }
    },
    setTimerMode: (state, action: PayloadAction<TimerState['mode']>) => {
      state.timer.mode = action.payload;
      switch (action.payload) {
        case 'pomodoro':
          state.timer.totalTime = 25 * 60;
          break;
        case 'shortBreak':
          state.timer.totalTime = 5 * 60;
          break;
        case 'longBreak':
          state.timer.totalTime = 15 * 60;
          break;
      }
      state.timer.timeRemaining = state.timer.totalTime;
      state.timer.status = 'idle';
    },
    setCustomTime: (state, action: PayloadAction<number>) => {
      state.timer.totalTime = action.payload * 60;
      state.timer.timeRemaining = action.payload * 60;
    },
    completeSession: (state, action: PayloadAction<FocusSession>) => {
      state.sessions.push(action.payload);
      state.timer.currentSession += 1;
      if (state.timer.currentSession > state.timer.totalSessions) {
        state.timer.currentSession = 1;
      }
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    setSound: (state, action: PayloadAction<string>) => {
      state.selectedSound = action.payload;
    },
    toggleNotifications: (state) => {
      state.notificationsBlocked = !state.notificationsBlocked;
    },
  },
});

export const {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  tick,
  setTimerMode,
  setCustomTime,
  completeSession,
  toggleSound,
  setSound,
  toggleNotifications,
} = focusModeSlice.actions;

export default focusModeSlice.reducer;
