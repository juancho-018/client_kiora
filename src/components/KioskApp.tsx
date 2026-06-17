import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { WelcomeScreen } from './WelcomeScreen';
import { Header } from './Header';
import { Catalog } from './Catalog';
import { Cart } from './Cart';
import { OrderSummaryBar } from './OrderSummaryBar';
import { ProductProvider } from '../context/ProductContext';
import { OrderService } from '../services/OrderService';
import Swal from 'sweetalert2';

export const KioskApp: React.FC = () => {
  const appStarted = useCartStore((state) => state.appStarted);
  const setAppStarted = useCartStore((state) => state.setAppStarted);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [successOrderId, setSuccessOrderId] = React.useState<string | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<number>(60);

  const resetKiosk = React.useCallback(() => {
    setSuccessOrderId(null);
    setPaymentError(null);
    localStorage.removeItem('kiosk_last_order');
    setAppStarted(false); // Vuelve a la pantalla de bienvenida
  }, [setAppStarted]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('order_id');
    
    if (payment === 'success' && orderId) {
      setSuccessOrderId(orderId);
      setAppStarted(true);
      clearCart();
      window.history.replaceState({}, '', window.location.pathname);

      // Verificar el pago directamente con Stripe (sin depender del webhook)
      OrderService.verifyPayment(Number(orderId))
        .then(result => {
          console.log('[KioskApp] Verificación de pago:', result);
        })
        .catch(err => {
          console.error('[KioskApp] Error verificando pago:', err);
        });

    } else if (payment === 'cancel') {
      setPaymentError('El pago fue cancelado o declinado. Por favor, intenta de nuevo o utiliza otra tarjeta.');
      setAppStarted(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setAppStarted, clearCart]);

  React.useEffect(() => {
    let timer: number;
    if (successOrderId || paymentError) {
      setTimeLeft(60); // Iniciar cuenta regresiva en 60 segundos
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            resetKiosk();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [successOrderId, paymentError, resetKiosk]);

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

          {/* Success Modal after Stripe Redirect */}
          {successOrderId && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md rounded-[2rem] bg-white p-10 text-center shadow-2xl ring-1 ring-neutral-100"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Pago exitoso en Stripe</p>
                <p className="mt-4 text-4xl font-black text-neutral-900">#{successOrderId}</p>
                <p className="mt-4 text-neutral-500">
                  Tu orden ha sido pagada. Presenta este número en caja.
                </p>
                
                <button
                  type="button"
                  onClick={resetKiosk}
                  className="mt-8 w-full py-4 font-black uppercase bg-strawberry-red text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  Continuar ({timeLeft}s)
                </button>
              </motion.div>
            </div>
          )}

          {/* Error/Cancel Modal after Stripe Redirect */}
          {paymentError && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md rounded-[2rem] bg-white p-10 text-center shadow-2xl ring-1 ring-neutral-100"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-red-600">Pago Fallido</p>
                <p className="mt-4 text-neutral-600 font-medium">
                  {paymentError}
                </p>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="mt-8 w-full py-4 font-black uppercase bg-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-300 transition-colors"
                >
                  Regresar al Kiosco
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
    </ProductProvider>
  );
};
