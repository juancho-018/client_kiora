import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Product } from '../services/ProductService';
import { useCartStore } from '../store/cartStore';
import { getImageUrl } from '../utils/getImageUrl';

interface Props {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState((product.stock_actual || 0) > 0 ? 1 : 0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAdd = () => {
    if ((product.stock_actual || 0) <= 0) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    onClose();
  };

  const totalPrice = product.precio_prod * quantity;
  const isOutOfStock = (product.stock_actual || 0) <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col md:flex-row h-auto max-h-[90vh]"
        >
          {/* Product Image */}
          <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto bg-[#f5f0eb] p-8 md:p-12 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <img 
              src={getImageUrl(product.imagen_prod) || '/placeholder.png'} 
              alt={product.nom_prod}
              className="w-full h-full max-h-[400px] object-contain mix-blend-multiply"
            />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-4xl font-black text-neutral-900 mb-2 leading-tight">{product.nom_prod}</h2>
              <p className="text-3xl font-bold text-strawberry-red mb-6">
                ${product.precio_prod.toLocaleString()}
              </p>
              
              <div className="max-h-40 overflow-y-auto no-scrollbar">
                <p className="text-neutral-500 font-medium text-lg leading-relaxed">
                  {product.desc_prod || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-6 mb-10 bg-neutral-100 p-2 rounded-[2rem] w-fit">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all font-black text-3xl text-neutral-300 hover:text-emerald-500 disabled:opacity-50 disabled:hover:text-neutral-300"
              >
                −
              </button>
              <span className="text-3xl font-black w-10 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(product.stock_actual || 0, quantity + 1))}
                disabled={quantity >= (product.stock_actual || 0)}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all font-black text-3xl text-neutral-300 hover:text-emerald-500 disabled:opacity-50 disabled:hover:text-neutral-300"
              >
                +
              </button>
            </div>

            {/* Stock Warning */}
            {quantity === product.stock_actual && (product.stock_actual || 0) > 0 && (
              <p className="text-xs font-bold text-strawberry-red mb-4 animate-pulse uppercase tracking-wider">
                Has alcanzado el límite de stock disponible
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-4 mt-auto">
              <button
                onClick={onClose}
                className="flex-1 py-5 bg-neutral-100 text-neutral-500 font-bold rounded-[2rem] hover:bg-neutral-200 transition-all text-lg"
              >
                Volver
              </button>
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`flex-[2] py-5 font-black rounded-[2rem] shadow-lg transition-all duration-300 text-xl ${
                  isOutOfStock 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 hover:from-emerald-400 hover:to-teal-400 active:scale-95 active:translate-y-0'
                }`}
              >
                {isOutOfStock ? 'Agotado' : `Agregar $${totalPrice.toLocaleString()}`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
