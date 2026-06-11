import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dummyJsonApi } from '../../services/api';

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
  items: Product[];
  filteredItems: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  skip: number;
  limit: number;
  currentPage: number;
}

const initialState: ProductState = {
  items: [],
  filteredItems: [],
  loading: false,
  error: null,
  total: 0,
  skip: 0,
  limit: 10,
  currentPage: 1,
};

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
    setFilteredProducts(state, action: PayloadAction<Product[]>) {
      state.filteredItems = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.filteredItems = action.payload.products;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      });
  },
});

export const { setCurrentPage, sortProducts, setFilteredProducts } = productSlice.actions;
export default productSlice.reducer;
