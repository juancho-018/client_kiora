import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { FilterPanel } from './FilterPanel';
import { ProductDetailModal } from './ProductDetailModal';
import { useCatalog } from '../hooks/useCatalog';

export const Catalog: React.FC = () => {
  const {
    products,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedProduct,
    setSelectedProduct,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    resetFilters,
    totalProducts,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useCatalog();

  return (
    <div className="max-w-7xl mx-auto px-6 pb-32">
      {/* Filters Toolbar */}
      <div className="flex items-center justify-end gap-4 mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 border-2 active:scale-95 ${
            showFilters || filters.selectedCategories.length > 0 || filters.minPrice > 0
              ? 'border-[#ec131e] text-[#ec131e] bg-[#ec131e]/5'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros {showFilters ? '▲' : '▼'}
        </button>
      </div>

      <FilterPanel 
        show={showFilters} 
        categories={categories}
        filters={filters} 
        setFilters={setFilters} 
        resetFilters={resetFilters} 
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-50 flex flex-col overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="h-[160px] bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse"></div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="w-1/3 h-4 rounded-full bg-slate-100 animate-pulse"></div>
                <div className="w-3/4 h-6 rounded-full bg-slate-100 animate-pulse"></div>
                <div className="w-1/2 h-4 rounded-full bg-slate-100 animate-pulse mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center px-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              {totalProducts} producto{totalProducts !== 1 ? 's' : ''} encontrado{totalProducts !== 1 ? 's' : ''}
            </span>
          </div>
          {products.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-neutral-200 bg-white/80 py-20 text-center">
              <p className="text-lg font-black text-neutral-700">No se encontraron productos con esos términos</p>
            </div>
          ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <ProductCard 
                  key={product.cod_prod} 
                  product={product} 
                  onSelect={(p) => setSelectedProduct(p)} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (() => {
            // Build page numbers to display (show max 7 buttons with ellipsis)
            const delta = 2;
            const range: (number | '...')[] = [];
            for (let i = 1; i <= totalPages; i++) {
              if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
              ) {
                range.push(i);
              } else if (
                range[range.length - 1] !== '...'
              ) {
                range.push('...');
              }
            }
            return (
              <div className="mt-14 flex justify-center items-center gap-2 flex-wrap">
                {range.map((page, idx) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-12 h-12 flex items-center justify-center text-slate-400 font-semibold text-lg select-none"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-base transition-all duration-200 active:scale-90 select-none
                        ${currentPage === page
                          ? 'bg-[#ec131e] text-white shadow-lg shadow-[#ec131e]/30 scale-110'
                          : 'border-2 border-slate-200 text-slate-600 hover:border-[#ec131e] hover:text-[#ec131e] hover:scale-110 hover:shadow-md'
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            );
          })()}
        </>
      )}

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
};
