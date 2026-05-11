import React from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { type Product } from '../services/ProductService';
import { getImageUrl } from '../utils/getImageUrl';

const TAGS = [
  { id: 'Comida', label: 'Comida', icon: '🍔' },
  { id: 'Bebida', label: 'Bebida', icon: '🥤' },
  { id: 'Dulce', label: 'Dulce', icon: '🍬' },
  { id: 'Snack', label: 'Snack', icon: '🍿' },
  { id: 'Fruta', label: 'Fruta', icon: '🍎' },
  { id: 'Lacteo', label: 'Lácteo', icon: '🥛' },
  { id: 'Aseo', label: 'Aseo', icon: '🧼' },
] as const;

interface Props {
  product: Product;
  onSelect: (p: Product) => void;
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export const ProductCard: React.FC<Props> = ({ product, onSelect }) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const isLowStock = product.stock_actual !== undefined && product.stock_minimo !== undefined && product.stock_actual <= product.stock_minimo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(product)}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col group p-0 border border-neutral-100"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white mb-0 p-4">
        <img
          src={getImageUrl(product.imagen_prod) || '/placeholder.png'}
          alt={product.nom_prod}
          className="w-full h-full object-contain transition-all duration-700"
        />
        {isLowStock && (
          <div className="absolute top-4 left-4 bg-strawberry-red text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
            Bajo Stock
          </div>
        )}
      </div>
      
      <div className="p-5 pt-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tipos_prod?.map(t => {
              const tag = TAGS.find(x => x.id === t);
              return (
                <span key={t} className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter bg-neutral-50 px-1.5 py-0.5 rounded">
                  {tag?.icon} {t}
                </span>
              );
            })}
          </div>
          <h3 className="text-lg font-bold text-neutral-800 line-clamp-2 leading-tight mb-2">{product.nom_prod}</h3>
          <p className="text-xs text-neutral-500 font-bold mb-4">
            Stock disponible: <span className={isLowStock ? 'text-strawberry-red' : 'text-emerald-500'}>{product.stock_actual ?? 0}</span>
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-strawberry-red">
            ${product.precio_prod.toLocaleString()}
          </span>
          
          <button
            onClick={handleAdd}
            className="w-10 h-10 bg-strawberry-red text-white flex items-center justify-center rounded-full shadow-lg shadow-strawberry-red/30 hover:scale-110 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
