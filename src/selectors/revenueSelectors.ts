import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Product } from '../features/products/productSlice';

const selectProducts = (state: RootState) => state.products.items;

export const selectTotalRevenue = (state: RootState) => {
  const products = state.products.items;
  return products.map((p: Product) => ({
    id: p.id,
    value: p.price * p.stock, 
    name: p.title
  }));
};

export const selectFilteredRevenue = createSelector(
  [selectProducts, (state: RootState) => state.filters.category],
  (products, category) => {
    const filtered = category 
      ? products.filter((p: Product) => p.category === category)
      : products;
    
    const value = filtered.reduce((acc: number, p: Product) => acc + (p.price * p.stock), 0);
    
    return {
      total: value,
      currency: 'USD',
      timestamp: Date.now() 
    };
  }
);
