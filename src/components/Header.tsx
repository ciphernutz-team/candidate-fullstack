import React from 'react';
import { Search, Bell, RefreshCw, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts, fetchCatalog } from '../features/products/productSlice';
import { fetchUserStats } from '../features/users/userSlice';
import { fetchMarketData } from '../features/market/marketSlice';

const Header = () => {
  const dispatch = useAppDispatch();
  const { currentPage, limit } = useAppSelector((state) => state.products);
  const { category, search } = useAppSelector((state) => state.filters);

  const handleRefresh = () => {
    // Previously gated on document.getElementById('dashboard-metrics-container'),
    // an id that is never rendered, so the market fetch below was permanently
    // dead. Refresh now reliably re-fetches everything — and re-fetches the
    // table's CURRENT page + filters (not a hard-coded page 1) so the rows and
    // pagination footer stay consistent.
    dispatch(fetchProducts({ limit, skip: (currentPage - 1) * limit, q: search, category }));
    dispatch(fetchCatalog());
    dispatch(fetchUserStats());
    dispatch(fetchMarketData());
    console.log('Global data refresh requested.');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4 bg-slate-100 px-3 py-2 rounded-lg w-full max-w-md">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search global metrics..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          <RefreshCw size={18} />
          <span>Refresh Data</span>
        </button>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">Admin User</p>
            <p className="text-xs text-slate-500">Market Analyst</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
