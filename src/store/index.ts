import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import appBlockerReducer from "./slices/appBlockerSlice";
import focusModeReducer from "./slices/focusModeSlice";
import statsReducer from "./slices/statsSlice";
import leaderboardReducer from "./slices/leaderboardSlice";
import settingsReducer from "./slices/settingsSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "appBlocker", "stats", "settings"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  appBlocker: appBlockerReducer,
  focusMode: focusModeReducer,
  stats: statsReducer,
  leaderboard: leaderboardReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
