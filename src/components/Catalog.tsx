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
      {/* Search & Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs uppercase tracking-widest ${
              selectedCategory === null
                ? 'bg-strawberry-red text-white shadow-lg shadow-strawberry-red/20'
                : 'bg-white text-neutral-500 hover:bg-neutral-100'
            }`}
          >
             Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.cod_cat}
              onClick={() => setSelectedCategory(cat.cod_cat)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs uppercase tracking-widest ${
                selectedCategory === cat.cod_cat
                  ? 'bg-strawberry-red text-white shadow-lg shadow-strawberry-red/20'
                  : 'bg-white text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {cat.nom_cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${
            showFilters || filters.selectedTags.length > 0 || filters.stockStatus !== '' || filters.minPrice > 0
              ? 'border-strawberry-red text-strawberry-red bg-strawberry-red/5'
              : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
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
        filters={filters} 
        setFilters={setFilters} 
        resetFilters={resetFilters} 
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
          <div className="w-12 h-12 border-4 border-strawberry-red/20 border-t-strawberry-red rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center px-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              {products.length} Productos Encontrados
            </span>
          </div>
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
