import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';

export const OrderSummaryBar: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);
  
  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.precio_prod * item.cantidad, 0);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-0 right-0 z-40 px-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto bg-[#3D2B2B] text-white p-4 pr-4 pl-10 rounded-[2.5rem] shadow-2xl flex items-center justify-between pointer-events-auto border border-white/10">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/60">Tu pedido</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{totalItems} {totalItems === 1 ? 'Producto' : 'Productos'}</span>
                <span className="text-xl font-black text-strawberry-red">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-white text-[#3D2B2B] px-10 py-4 rounded-[2rem] font-black text-lg hover:bg-neutral-100 transition-all flex items-center gap-2"
            >
              Ver Pedido
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
