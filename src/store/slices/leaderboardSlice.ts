import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import {LeaderboardEntry, LeaderboardCategory} from '../../types';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  category: LeaderboardCategory;
  isLoading: boolean;
  userRank: number;
}

const initialState: LeaderboardState = {
  entries: [],
  category: 'screen_time',
  isLoading: false,
  userRank: 0,
};

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async (category: LeaderboardCategory, {rejectWithValue}) => {
    try {
      const snapshot = await firestore()
        .collection('leaderboard')
        .doc(category)
        .collection('entries')
        .orderBy('score', 'desc')
        .limit(100)
        .get();
      
      const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        userId: doc.id,
        displayName: doc.data().displayName,
        photoURL: doc.data().photoURL,
        score: doc.data().score,
        streak: doc.data().streak || 0,
        isCurrentUser: false,
      }));
      
      return entries;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLeaderboardScore = createAsyncThunk(
  'leaderboard/updateScore',
  async ({category, score}: {category: LeaderboardCategory; score: number}, {getState, rejectWithValue}) => {
    try {
      const state = getState() as any;
      const userId = state.auth.user?.id;
      
      if (!userId) return rejectWithValue('User not authenticated');
      
      await firestore()
        .collection('leaderboard')
        .doc(category)
        .collection('entries')
        .doc(userId)
        .set({
          score,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, {merge: true});
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<LeaderboardCategory>) => {
      state.category = action.payload;
    },
    setUserRank: (state, action: PayloadAction<number>) => {
      state.userRank = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchLeaderboard.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const {setCategory, setUserRank} = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
