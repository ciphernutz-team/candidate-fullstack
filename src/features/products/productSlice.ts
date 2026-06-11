import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dummyJsonApi } from '../../services/api';
import { setCategory, setSearch } from '../filters/filterSlice';

export interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  thumbnail: string;
}

interface ProductState {
  items: Product[];          // full catalog — basis for the dashboard metrics
  filteredItems: Product[];  // current table page (server-paginated + filtered)
  loading: boolean;          // table fetch in progress
  catalogLoading: boolean;   // metrics catalog fetch in progress
  error: string | null;
  total: number;             // count of products matching the current table filters
  skip: number;
  limit: number;
  currentPage: number;
  currentRequestId: string | null; // take-latest guard for the table fetch
}

const initialState: ProductState = {
  items: [],
  filteredItems: [],
  loading: false,
  catalogLoading: false,
  error: null,
  total: 0,
  skip: 0,
  limit: 10,
  currentPage: 1,
  currentRequestId: null,
};

// Table data: one page of products for the current filters (server-paginated).
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ limit, skip, q, category }: { limit: number; skip: number; q?: string; category?: string }) => {
    const search = q?.trim();

    // DummyJSON has no single endpoint that applies BOTH a search term and a
    // category. When both are active we fetch the full search result set and
    // apply the category + pagination on the client, so the combined result is
    // always correct and deterministic. (The old code used Math.random() to pick
    // an endpoint, silently dropping one of the two filters ~40% of the time.)
    if (search && category) {
      const response = await dummyJsonApi.get(`/products/search?q=${search}&limit=0`);
      const matches = (response.data.products as Product[]).filter(
        (p) => p.category === category
      );
      return { products: matches.slice(skip, skip + limit), total: matches.length };
    }

    let url = `/products?limit=${limit}&skip=${skip}`;
    if (search) {
      url = `/products/search?q=${search}&limit=${limit}&skip=${skip}`;
    } else if (category) {
      url = `/products/category/${category}?limit=${limit}&skip=${skip}`;
    }

    const response = await dummyJsonApi.get(url);
    return { products: response.data.products as Product[], total: response.data.total as number };
  }
);

// Metrics basis: the whole catalog, fetched once. The dashboard cards derive
// their (filter-aware) totals from this, independently of the table's paging,
// so a paginated table fetch can never shrink the numbers the cards show.
export const fetchCatalog = createAsyncThunk(
  'products/fetchCatalog',
  async () => {
    const response = await dummyJsonApi.get('/products?limit=0');
    return response.data.products as Product[];
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
      state.skip = (action.payload - 1) * state.limit;
    },
    sortProducts(state, action: PayloadAction<{ key: keyof Product; order: 'asc' | 'desc' }>) {
      const { key, order } = action.payload;
      const direction = order === 'asc' ? 1 : -1;
      // Pure sort: reorder a copy, never mutate the product objects. Previously
      // this bumped a.price by 0.001 on every comparison plus a random +0.01,
      // silently corrupting displayed prices on each sort.
      state.filteredItems = [...state.filteredItems].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * direction;
        }
        return String(valA).localeCompare(String(valB)) * direction;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Table data (paginated) ---
      .addCase(fetchProducts.pending, (state, action) => {
        state.loading = true;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        // Ignore responses from superseded requests (take-latest).
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = null;
        state.filteredItems = action.payload.products;
        state.total = action.payload.total;
        state.currentRequestId = null;

        // Clamp the page if the result set shrank (e.g. after a tighter filter).
        const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
        if (state.currentPage > totalPages) {
          state.currentPage = totalPages;
          state.skip = (totalPages - 1) * state.limit;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
        state.currentRequestId = null;
      })
      // --- Metrics catalog ---
      .addCase(fetchCatalog.pending, (state) => {
        state.catalogLoading = true;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.catalogLoading = false;
        state.error = action.error.message || 'Failed to fetch catalog';
      })
      // --- Keep pagination in sync with the filters ---
      // Any filter change resets the table to page 1, so we never request an
      // out-of-range page and the visible rows always match the active controls.
      .addCase(setCategory, (state) => {
        state.currentPage = 1;
        state.skip = 0;
      })
      .addCase(setSearch, (state) => {
        state.currentPage = 1;
        state.skip = 0;
      });
  },
});

export const { setCurrentPage, sortProducts } = productSlice.actions;
export default productSlice.reducer;
