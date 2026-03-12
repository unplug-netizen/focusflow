import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {BlockRule, AppUsage} from '../../types';

interface AppBlockerState {
  rules: BlockRule[];
  appUsages: AppUsage[];
  isLoading: boolean;
  activeBlock: boolean;
}

const initialState: AppBlockerState = {
  rules: [],
  appUsages: [],
  isLoading: false,
  activeBlock: false,
};

const appBlockerSlice = createSlice({
  name: 'appBlocker',
  initialState,
  reducers: {
    addRule: (state, action: PayloadAction<BlockRule>) => {
      state.rules.push(action.payload);
    },
    updateRule: (state, action: PayloadAction<BlockRule>) => {
      const index = state.rules.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rules[index] = action.payload;
      }
    },
    deleteRule: (state, action: PayloadAction<string>) => {
      state.rules = state.rules.filter(r => r.id !== action.payload);
    },
    toggleRule: (state, action: PayloadAction<string>) => {
      const rule = state.rules.find(r => r.id === action.payload);
      if (rule) {
        rule.isActive = !rule.isActive;
      }
    },
    setAppUsages: (state, action: PayloadAction<AppUsage[]>) => {
      state.appUsages = action.payload;
    },
    updateAppUsage: (state, action: PayloadAction<AppUsage>) => {
      const index = state.appUsages.findIndex(a => a.packageName === action.payload.packageName);
      if (index !== -1) {
        state.appUsages[index] = action.payload;
      } else {
        state.appUsages.push(action.payload);
      }
    },
    setActiveBlock: (state, action: PayloadAction<boolean>) => {
      state.activeBlock = action.payload;
    },
  },
});

export const {
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  setAppUsages,
  updateAppUsage,
  setActiveBlock,
} = appBlockerSlice.actions;

export default appBlockerSlice.reducer;
