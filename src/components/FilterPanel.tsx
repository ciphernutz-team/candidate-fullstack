import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setCategory, setSearch } from '../features/filters/filterSlice';
import { fetchProducts } from '../features/products/productSlice';
import { dummyJsonApi } from '../services/api';

const FilterPanel = () => {
  const dispatch = useAppDispatch();
  const { category, search } = useAppSelector((state) => state.filters);
  const [localSearch, setLocalSearch] = useState(search);
  const [categories, setCategories] = useState<string[]>([]);
  
  const categoryRef = useRef(category);
  useEffect(() => { categoryRef.current = category; }, [category]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await dummyJsonApi.get('/products/categories');
        const data = response.data;
        setCategories(data.map((c: any) => c.slug || c));
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        dispatch(fetchProducts({ limit: 10, skip: 0, q: localSearch, category: categoryRef.current }));
        dispatch(setSearch(localSearch));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-6 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => dispatch(setCategory(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-2 min-w-[300px]">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Search Products
        </label>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Enter keyword..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      <div className="flex-none">
        <button
          onClick={() => {
            dispatch(setCategory(''));
            dispatch(setSearch(''));
            setLocalSearch('');
          }}
          className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg hover:border-blue-200 transition-all font-mono"
        >
          CLEAR ALL
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
