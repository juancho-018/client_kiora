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
  const [showManualEntry, setShowManualEntry] = React.useState<boolean>(false);
  const [manualId, setManualId] = React.useState<string>('');

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
        <WelcomeScreen key="welcome" onOpenManual={() => setShowManualEntry(true)} />
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

          {/* Manual Entry Modal */}
          {showManualEntry && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
              >
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-[#ec131e]/10 rounded-full flex items-center justify-center mb-4 text-[#ec131e]">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">Consultar Pedido</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Ingresa tu número de orden para ver el estado del pago.
                  </p>
                </div>

                <input
                  type="number"
                  placeholder="Ej: 364"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && manualId.trim() && document.getElementById('btn-consultar')?.click()}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-[#ec131e] focus:ring-4 focus:ring-[#ec131e]/10 outline-none text-2xl font-black text-center mb-5 bg-slate-50 transition-all"
                />

                <div className="flex flex-col gap-3">
                  <button
                    id="btn-consultar"
                    onClick={async () => {
                      const trimmed = manualId.trim();
                      if (!trimmed) return;
                      try {
                        const order = await OrderService.getOrderById(Number(trimmed));
                        setShowManualEntry(false);
                        setManualId('');
                        const estadoLabel = order.estado ? `<span style="background:#f0fdf4;color:#16a34a;padding:2px 10px;border-radius:999px;font-size:0.7rem;font-weight:900;letter-spacing:0.05em;text-transform:uppercase">${order.estado}</span>` : '';
                        void Swal.fire({
                          title: `Orden #${order.id_vent}`,
                          html: `
                            <div style="text-align:left;margin-top:0.5rem;">
                              <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem;">
                                <span style="color:#94a3b8;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Estado</span>
                                ${estadoLabel}
                              </div>
                              <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem;">
                                <span style="color:#94a3b8;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Método</span>
                                <span style="font-weight:900;color:#1e293b;font-size:0.85rem;">${order.metodopago_usu || '—'}</span>
                              </div>
                              <div style="border-top:1px dashed #e2e8f0;padding-top:0.75rem;margin-top:0.25rem;display:flex;justify-content:space-between;align-items:center;">
                                <span style="color:#94a3b8;font-size:0.75rem;font-weight:700;text-transform:uppercase;">Total</span>
                                <span style="font-size:1.5rem;font-weight:900;color:#ec131e;">$${Number(order.montofinal_vent || 0).toLocaleString('es-CO')}</span>
                              </div>
                            </div>
                          `,
                          icon: 'info',
                          iconColor: '#ec131e',
                          confirmButtonText: 'Cerrar',
                          confirmButtonColor: '#ec131e',
                          background: '#ffffff',
                          customClass: { popup: 'rounded-3xl' },
                        });
                      } catch {
                        void Swal.fire({
                          title: 'Pedido no encontrado',
                          text: `No existe ningún pedido con el número #${trimmed}. Verifica e intenta de nuevo.`,
                          icon: 'error',
                          iconColor: '#ec131e',
                          confirmButtonText: 'Intentar de nuevo',
                          confirmButtonColor: '#ec131e',
                        });
                      }
                    }}
                    className="w-full py-4 bg-[#ec131e] text-white font-black uppercase rounded-2xl hover:bg-[#d0111a] transition-all shadow-lg shadow-[#ec131e]/30 hover:scale-[1.02] active:scale-95 text-sm tracking-wider"
                  >
                    Consultar Pedido
                  </button>
                  <button
                    onClick={() => { setShowManualEntry(false); setManualId(''); }}
                    className="w-full py-3 text-slate-400 font-bold uppercase text-xs hover:text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
    </ProductProvider>
  );
};
