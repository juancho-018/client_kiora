import React from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { WelcomeScreen } from './WelcomeScreen';
import { Header } from './Header';
import { Catalog } from './Catalog';
import { Cart } from './Cart';
import { OrderSummaryBar } from './OrderSummaryBar';

import { ProductProvider } from '../context/ProductContext';

export const KioskApp: React.FC = () => {
  const appStarted = useCartStore((state) => state.appStarted);

  return (
    <ProductProvider>
      <div className="min-h-screen relative overflow-x-hidden bg-cream">
      {!appStarted ? (
        <WelcomeScreen key="welcome" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col min-h-screen"
        >
          <Header />
          <main className="flex-1 relative z-10">
            <div className="max-w-7xl mx-auto px-6 pt-24 pb-4">
              <div className="text-left py-8 px-4">
                <p className="text-lg text-neutral-500 max-w-xl font-medium leading-relaxed">
                  Explora nuestras delicias tradicionales especialmente para ti.
                </p>
              </div>
            </div>
            <Catalog />
          </main>
          
          <OrderSummaryBar />
          
          <Cart />
        </motion.div>
      )}
    </div>
    </ProductProvider>
  );
};
