import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
  category: string;
  search: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const initialState: FilterState = {
  category: '',
  search: '',
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setDateRange(state, action: PayloadAction<{ start: string; end: string }>) {
      state.dateRange = action.payload;
    },
    resetFilters(state) {
      return initialState;
    },
  },
});

export const { setCategory, setSearch, setDateRange, resetFilters } = filterSlice.actions;
export default filterSlice.reducer;
