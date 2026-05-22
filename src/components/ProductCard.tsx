import React from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { type Product } from '../services/ProductService';
import { getImageUrl } from '../utils/getImageUrl';


interface Props {
  product: Product;
  onSelect: (p: Product) => void;
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">.




    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export const ProductCard: React.FC<Props> = ({ product, onSelect }) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };



  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(product)}
      className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col group p-0 border border-slate-200/60 ring-1 ring-slate-900/5"
    >
      <div className="relative w-full h-[180px] overflow-hidden bg-[#f5f0eb] mb-0 p-6 flex items-center justify-center border-b border-slate-100/80">
        <img
          src={getImageUrl(product.imagen_prod) || '/placeholder.png'}
          alt={product.nom_prod}
          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="p-5 pt-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-tight mb-3">{product.nom_prod}</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-strawberry-red">
            ${product.precio_prod.toLocaleString()}
          </span>

          <button
            onClick={handleAdd}
            className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
