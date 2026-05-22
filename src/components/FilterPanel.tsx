import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '../services/ProductService';

interface FilterPanelProps {
  show: boolean;
  categories: Category[];
  filters: {
    minPrice: number;
    maxPrice: number;
    stockStatus: string;
    selectedCategories: number[];
  };
  setFilters: (filters: any) => void;
  resetFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ show, categories, filters, setFilters, resetFilters }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden mb-10"
        >
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl flex flex-col gap-8">

            {/* Categorías — full width, pills fluidas */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-600">Categorías</span>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <button
                    key={c.cod_cat}
                    onClick={() => {
                      const newCats = filters.selectedCategories.includes(c.cod_cat)
                        ? filters.selectedCategories.filter(x => x !== c.cod_cat)
                        : [...filters.selectedCategories, c.cod_cat];
                      setFilters({ ...filters, selectedCategories: newCats });
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                      filters.selectedCategories.includes(c.cod_cat)
                        ? 'bg-[#ec131e] text-white shadow-md shadow-[#ec131e]/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.nom_cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rango de precio + Limpiar en la misma fila */}
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex-1 min-w-[220px] space-y-3">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-600">Rango de Precio</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#ec131e]/20 text-slate-700"
                  />
                  <span className="text-slate-400 shrink-0">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#ec131e]/20 text-slate-700"
                  />
                </div>
              </div>

              <button
                onClick={resetFilters}
                className="shrink-0 text-xs font-black text-slate-400 hover:text-[#ec131e] transition-all py-2.5"
              >
                Limpiar filtros
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
