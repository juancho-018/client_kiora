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
              {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
            </span>
          </div>
          {products.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-neutral-200 bg-white/80 py-20 text-center">
              <p className="text-lg font-black text-neutral-700">No hay productos con estos filtros</p>
              <p className="mt-2 text-sm text-neutral-400">Prueba otra categoría o limpia los filtros.</p>
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
