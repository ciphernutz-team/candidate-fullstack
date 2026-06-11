import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts, setCurrentPage, sortProducts, setFilteredProducts, Product } from '../features/products/productSlice';
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from 'lucide-react';

const ProductTable = () => {
  const dispatch = useAppDispatch();
  const { filteredItems, loading, currentPage, total, limit } = useAppSelector((state) => state.products);
  const { category, search } = useAppSelector((state) => state.filters);

  useEffect(() => {
    const skip = (currentPage - 1) * limit;
    dispatch(fetchProducts({ limit, skip, q: search, category }));
  }, [dispatch, currentPage, limit, search, category]);

  const totalPages = Math.ceil(total / limit);

  // Sorting handler
  const handleSort = (key: keyof Product) => {
    dispatch(sortProducts({ key, order: 'desc' }));
  };

  if (loading && filteredItems.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading products...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => handleSort('category')}>
                <div className="flex items-center gap-1">Category <ArrowUpDown size={14} /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1">Price <ArrowUpDown size={14} /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => handleSort('stock')}>
                <div className="flex items-center gap-1">Stock <ArrowUpDown size={14} /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={product.thumbnail} alt={product.title} className="w-10 h-10 rounded shadow-sm object-cover" />
                    <span className="font-medium text-slate-900">{product.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-900 font-semibold">${product.price}</td>
                <td className="px-6 py-4 text-slate-600">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-orange-400">
                    <span className="font-bold text-slate-900">{product.rating}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{Math.min(total, (currentPage - 1) * limit + 1)}</span> to <span className="font-semibold text-slate-900">{Math.min(total, currentPage * limit)}</span> of <span className="font-semibold">{total}</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(setCurrentPage(Math.max(1, currentPage - 1)))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => dispatch(setCurrentPage(Math.min(totalPages, currentPage + 1)))}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
