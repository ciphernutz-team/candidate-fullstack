import { configureStore } from '@reduxjs/toolkit';
import filterReducer from '../features/filters/filterSlice';
import productReducer from '../features/products/productSlice';
import marketReducer from '../features/market/marketSlice';
import userReducer from '../features/users/userSlice';
import launchReducer from '../features/launches/launchSlice';

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    products: productReducer,
    market: marketReducer,
    users: userReducer,
    launches: launchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
