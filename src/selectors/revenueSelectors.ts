import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Product } from '../features/products/productSlice';

const selectProducts = (state: RootState) => state.products.items;
const selectCategory = (state: RootState) => state.filters.category;
const selectSearch = (state: RootState) => state.filters.search;

// Products matching the currently active category + search filters.
// Memoized via createSelector, so the result keeps a stable reference until
// products/category/search actually change (no new array on every render).
export const selectFilteredProducts = createSelector(
  [selectProducts, selectCategory, selectSearch],
  (products, category, search) => {
    const term = search.trim().toLowerCase();
    return products.filter((p: Product) => {
      const matchesCategory = !category || p.category === category;
      const matchesSearch = !term || p.title.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }
);

// Total revenue (price * stock) across the filtered products — a single number,
// so the dashboard total moves in step with the active filters.
export const selectTotalRevenue = createSelector(
  [selectFilteredProducts],
  (products) => products.reduce((sum: number, p: Product) => sum + p.price * p.stock, 0)
);

// Count of products matching the current filters (drives the "Products Sold" card).
export const selectFilteredProductCount = createSelector(
  [selectFilteredProducts],
  (products) => products.length
);
