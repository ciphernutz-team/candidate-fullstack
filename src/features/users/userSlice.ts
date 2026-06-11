import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { randomUserApi } from '../../services/api';

interface UserState {
  activeUsers: number;
  recentActivity: { id: string; user: string; action: string; time: string }[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  activeUsers: 0,
  recentActivity: [],
  loading: false,
  error: null,
};

export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async () => {
    const response = await randomUserApi.get('/?results=5');
    return response.data.results;
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.activeUsers = Math.floor(Math.random() * 5000) + 1000;
        state.recentActivity = action.payload.map((user: any) => ({
          id: user.login.uuid,
          user: `${user.name.first} ${user.name.last}`,
          action: ['Purchased Item', 'Logged In', 'Updated Profile', 'Viewed Chart'][Math.floor(Math.random() * 4)],
          time: new Date().toLocaleTimeString(),
        }));
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user stats';
      });
  },
});

export default userSlice.reducer;
