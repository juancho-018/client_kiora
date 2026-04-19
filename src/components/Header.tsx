import React from 'react';
import { X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export const Header: React.FC = () => {
  const { items, setAppStarted, searchQuery, setSearchQuery } = useCartStore();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Logo - Official Vectorized Colored Image */}
        <div className="flex items-center">
          <img 
            src="/logo-kiora-vectorizado.png" 
            alt="Kiora" 
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Search Bar - Re-added as per request */}
        <div className="flex-1 max-w-xl relative group hidden md:block">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-strawberry-red transition-colors w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Qué se te antoja hoy? (Busca con errores)"
            className="w-full pl-14 pr-6 py-4 bg-white/50 backdrop-blur-md border-2 border-transparent focus:border-strawberry-red/20 focus:bg-white rounded-[2rem] outline-none transition-all text-lg placeholder:text-neutral-400 shadow-sm"
          />
        </div>

        {/* Cancel Button - Right Aligned as seen in Image 2 */}
        <button
          onClick={() => setAppStarted(false)}
          className="bg-neutral-200/50 backdrop-blur-md text-neutral-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-200 transition-all border border-transparent active:scale-95"
        >
          <X className="w-5 h-5" />
          <span className="text-sm uppercase tracking-wider">Cancelar</span>
        </button>
      </div>
    </header>
  );
};
