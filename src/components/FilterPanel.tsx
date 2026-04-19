import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TAGS = [
  { id: 'Comida', label: 'Comida', icon: '🍔' },
  { id: 'Bebida', label: 'Bebida', icon: '🥤' },
  { id: 'Dulce', label: 'Dulce', icon: '🍬' },
  { id: 'Snack', label: 'Snack', icon: '🍿' },
  { id: 'Fruta', label: 'Fruta', icon: '🍎' },
  { id: 'Lacteo', label: 'Lácteo', icon: '🥛' },
  { id: 'Aseo', label: 'Aseo', icon: '🧼' },
] as const;

interface FilterPanelProps {
  show: boolean;
  filters: {
    minPrice: number;
    maxPrice: number;
    stockStatus: string;
    selectedTags: string[];
  };
  setFilters: (filters: any) => void;
  resetFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ show, filters, setFilters, resetFilters }) => {
  return (
    <AnimatePresence>
        {show && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-10"
          >
            <div className="bg-white rounded-[2rem] p-8 border border-neutral-100 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Tags */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Etiquetas</span>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        const newTags = filters.selectedTags.includes(t.id)
                          ? filters.selectedTags.filter(x => x !== t.id)
                          : [...filters.selectedTags, t.id];
                        setFilters({ ...filters, selectedTags: newTags });
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        filters.selectedTags.includes(t.id)
                          ? 'bg-strawberry-red text-white shadow-md'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Rango de Precio</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-strawberry-red/20"
                  />
                  <span className="text-neutral-300">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-strawberry-red/20"
                  />
                </div>
              </div>

              {/* Stock Status */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Estado</span>
                <div className="flex gap-2">
                  {[
                    { id: '', label: 'Todo' },
                    { id: 'disponible', label: '✅ Disponible' },
                    { id: 'bajo', label: '⚠️ Bajo' },
                    { id: 'agotado', label: '❌ Agotado' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFilters({ ...filters, stockStatus: s.id as any })}
                      className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${
                        filters.stockStatus === s.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <div className="md:col-span-3 pt-4 border-t border-neutral-50 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="text-xs font-black text-neutral-400 hover:text-strawberry-red transition-all flex items-center gap-2"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  );
};
