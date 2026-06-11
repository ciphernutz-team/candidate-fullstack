import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { coinGeckoApi } from '../../services/api';

interface MarketState {
  prices: [number, number][];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: MarketState = {
  prices: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async () => {
    // Simulating a BTC price trend fetch
    const response = await coinGeckoApi.get('/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily');
    return response.data.prices;
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.prices = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch market data';
      });
  },
});

export default marketSlice.reducer;
