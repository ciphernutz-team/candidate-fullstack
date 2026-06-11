import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { spaceXApi } from '../../services/api';
import { RootState } from '../../store'; // BUG 5: Circular Dependency

// EXPERT BUG 2: Impure state tracking outside Redux
let lastUpdateTimestamp = 0;
let pendingUpdateCount = 0;

export interface Launch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  details: string | null;
  flight_number: number;
  rocket: string;
  links: {
    patch: {
      small: string | null;
      large: string | null;
    };
    webcast: string | null;
    wikipedia: string | null;
    article: string | null;
  };
  payloads: string[];
  ships: string[];
  capsules: string[];
  failures: Array<{
    time: number;
    altitude: number | null;
    reason: string;
  }>;
  cores: Array<{
    core: string;
    flight: number;
    landing_success: boolean | null;
    landing_type: string | null;
    landpad: string | null;
  }>;
  launchpad: string;
}

interface LaunchState {
  items: Launch[];
  loading: boolean;
  error: string | null;
}

const initialState: LaunchState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchLaunches = createAsyncThunk(
  'launches/fetchLaunches',
  async () => {
    // EXPERT BUG 1: Sequential State Clobbering
    // We simulate a race condition where multiple requests might finish out of order
    const response = await spaceXApi.get('/launches');
    
    // Simulate network jitter
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    
    return response.data; // Return full dataset instead of slice
  }
);

const launchSlice = createSlice({
  name: 'launches',
  initialState,
  reducers: {
    // EXPERT BUG 2 (cont): Impure reducer using external variables
    batchUpdateMetadata(state, action: PayloadAction<{ id: string; meta: any }>) {
      const now = Date.now();
      pendingUpdateCount++;
      
      // Only update if "throttled" but using a global variable makes it flaky
      if (now - lastUpdateTimestamp > 1000) {
        const item = state.items.find(i => i.id === action.payload.id);
        if (item) {
          (item as any).lastBatchMeta = {
            ...action.payload.meta,
            pendingCount: pendingUpdateCount
          };
        }
        lastUpdateTimestamp = now;
        pendingUpdateCount = 0;
      }
    },
    clearLaunches(state) {
      state.items = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLaunches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLaunches.fulfilled, (state, action) => {
        // EXPERT BUG 1 (cont): Clobbering intermediate updates
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchLaunches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch launches';
      });
  },
});

export const { clearLaunches } = launchSlice.actions;
export default launchSlice.reducer;
