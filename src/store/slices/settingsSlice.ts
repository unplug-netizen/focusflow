import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_BEDTIME_START, DEFAULT_BEDTIME_END } from "../../constants";

interface SettingsState {
  darkMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  language: string;
  privacyMode: "public" | "friends" | "private";
  bedtimeMode: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

const initialState: SettingsState = {
  darkMode: true,
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
  language: "en",
  privacyMode: "friends",
  bedtimeMode: {
    enabled: false,
    startTime: DEFAULT_BEDTIME_START,
    endTime: DEFAULT_BEDTIME_END,
  },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    toggleNotifications: (state) => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    toggleHaptic: (state) => {
      state.hapticEnabled = !state.hapticEnabled;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setPrivacyMode: (
      state,
      action: PayloadAction<SettingsState["privacyMode"]>
    ) => {
      state.privacyMode = action.payload;
    },
    setBedtimeMode: (
      state,
      action: PayloadAction<Partial<SettingsState["bedtimeMode"]>>
    ) => {
      state.bedtimeMode = { ...state.bedtimeMode, ...action.payload };
    },
    toggleBedtimeMode: (state) => {
      state.bedtimeMode.enabled = !state.bedtimeMode.enabled;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleNotifications,
  toggleSound,
  toggleHaptic,
  setLanguage,
  setPrivacyMode,
  setBedtimeMode,
  toggleBedtimeMode,
} = settingsSlice.actions;

export default settingsSlice.reducer;
