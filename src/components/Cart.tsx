import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBasket, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export const Cart: React.FC = () => {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, clearCart } = useCartStore();
  
  const total = items.reduce((acc, item) => acc + (item.precio_prod * item.cantidad), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBasket className="text-strawberry-red w-6 h-6" />
                <h2 className="text-2xl font-black text-neutral-900 italic">Pedido</h2>
              </div>
              <button 
                onClick={toggleCart}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-neutral-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <ShoppingBasket className="w-20 h-20" />
                  <p className="text-xl font-bold">Tu carrito está vacío</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.cod_prod} className="flex gap-4 group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img src={item.imagen_prod || '/placeholder.png'} alt={item.nom_prod} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-800 line-clamp-1">{item.nom_prod}</h4>
                      <p className="text-strawberry-red font-black text-lg">
                        ${(item.precio_prod * item.cantidad).toLocaleString()}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-3 bg-neutral-100 rounded-xl px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(item.cod_prod, -1)}
                            className="p-1 hover:text-strawberry-red transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.cantidad}</span>
                          <button 
                            onClick={() => updateQuantity(item.cod_prod, 1)}
                            className="p-1 hover:text-strawberry-red transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.cod_prod)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-neutral-50 border-t space-y-4">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold text-neutral-500">Total</span>
                  <span className="font-black text-3xl text-neutral-900">${total.toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={clearCart}
                    className="py-4 border-2 border-neutral-200 rounded-2xl font-bold text-neutral-500 hover:bg-neutral-100 transition-all"
                  >
                    VACIAR
                  </button>
                  <button className="btn-primary py-4 uppercase">
                    PAGAR AHORA
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
