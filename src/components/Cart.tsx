import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBasket, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { OrderService } from '../services/OrderService';
import { getImageUrl } from '../utils/getImageUrl';
import { useProductContext } from '../context/ProductContext';
import { StripeQRModal } from './StripeQRModal';
import Swal from 'sweetalert2';

type PaymentChoice = 'efectivo' | 'tarjeta_presencial' | 'pendiente';

export const Cart: React.FC = () => {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const { refreshData } = useProductContext();

  const [payment, setPayment] = useState<PaymentChoice>('tarjeta_presencial');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showDiningModal, setShowDiningModal] = useState(false);
  const [stripeQR, setStripeQR] = useState<{ isOpen: boolean; url: string; orderId: number } | null>(null);

  const total = items.reduce((acc, item) => acc + item.precio_prod * item.cantidad, 0);

  useEffect(() => {
    if (isOpen || showSummaryModal || showDiningModal || stripeQR) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, showSummaryModal, showDiningModal, stripeQR]);

  const handlePreCheckout = () => {
    setError(null);
    if (items.length === 0) return;

    if (!OrderService.isKioskConfigured()) {
      setError(
        'Este kiosco necesita PUBLIC_KIOSK_API_KEY en el entorno (debe coincidir con KIOSK_API_KEY del API Gateway). Consulte al administrador.'
      );
      return;
    }

    if (total < 2500) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto Mínimo',
        text: 'El monto mínimo de pago es de $2.500 pesos.',
        confirmButtonColor: '#ec131e',
        customClass: {
          popup: '!rounded-[2rem] shadow-2xl',
          confirmButton: '!rounded-xl px-6 py-3 font-bold uppercase tracking-wide',
        }
      });
      return;
    }

    setShowSummaryModal(true);
  };

  const handleCheckout = async (diningOption: string) => {
    setError(null);
    const metodoLabel = `tarjeta_presencial - ${diningOption}`;

    setSubmitting(true);
    try {
      const lines = items.map((i) => ({
        cod_prod: i.cod_prod,
        cantidad: i.cantidad,
        precio_unit: i.precio_prod,
        nom_prod: i.nom_prod,
      }));

      const created = await OrderService.createOrder(lines, metodoLabel);
      const id = created.id_vent;
      if (!id) throw new Error('Respuesta sin id de pedido');

      // (El almacenamiento temporal del recibo ha sido removido según requerimiento)

      // Generar URL de Stripe - Usar PUBLIC_KIOSK_URL si existe, sino window.location.origin
      const baseUrl = import.meta.env.PUBLIC_KIOSK_URL || window.location.origin;
      const successUrl = `${baseUrl}/payment-success?order_id=${id}`;
      const cancelUrl = `${baseUrl}/?payment=cancel&order_id=${id}`;

      const checkoutUrl = await OrderService.createCheckoutSession(id, successUrl, cancelUrl);

      if (!checkoutUrl) throw new Error('No se pudo generar el enlace de pago seguro');

      // Mostrar QR
      setShowDiningModal(false);
      setStripeQR({ isOpen: true, url: checkoutUrl, orderId: id });
      setSubmitting(false);

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo registrar el pedido';
      setError(msg);
      setSubmitting(false); // Only set to false on error, because on success we redirect
      setShowDiningModal(false);
    }
  };

  const closeSuccess = () => {
    setSuccessId(null);
    clearCart();
    toggleCart();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleCart}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-0 z-[101] flex h-full w-full flex-col bg-white/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b p-6">
                <div className="flex items-center gap-3">
                  <ShoppingBasket className="h-8 w-8 text-[#ec131e]" />
                  <h2 className="text-3xl font-black italic text-neutral-900">Tu pedido</h2>
                </div>
                <button type="button" onClick={toggleCart} className="rounded-full p-3 transition-colors hover:bg-neutral-100">
                  <X className="h-8 w-8 text-neutral-500" />
                </button>
              </div>

              <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-8 text-center">
                    <div className="opacity-50 flex flex-col items-center space-y-6">
                      <ShoppingBasket className="h-32 w-32" />
                      <p className="text-3xl font-black">Tu carrito está vacío</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCart}
                      className="px-10 py-5 text-xl uppercase tracking-wide bg-slate-100 text-slate-600 font-black rounded-[2rem] hover:bg-slate-200 transition-colors"
                    >
                      Seguir comprando
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.cod_prod} className="group flex gap-4">
                      <div className="h-32 w-32 flex-shrink-0 flex items-center justify-center p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <img
                          src={getImageUrl(item.imagen_prod) || '/placeholder.png'}
                          alt={item.nom_prod}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-2xl font-black text-neutral-800">{item.nom_prod}</h4>
                        {item.desc_prod && (
                          <p className="text-sm text-neutral-400 font-semibold line-clamp-2 mt-1">{item.desc_prod}</p>
                        )}
                        <p className="text-2xl font-black text-strawberry-red mt-2">
                          ${(item.precio_prod * item.cantidad).toLocaleString('es-CO')}
                        </p>

                        <div className="mt-4 flex items-center gap-6">
                          <div className="flex items-center gap-4 rounded-2xl bg-neutral-100 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cod_prod, -1)}
                              className="p-2 transition-colors hover:text-strawberry-red"
                            >
                              <Minus className="h-6 w-6" />
                            </button>
                            <span className="w-8 text-xl text-center font-black">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cod_prod, 1)}
                              className="p-2 transition-colors hover:text-strawberry-red"
                            >
                              <Plus className="h-6 w-6" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.cod_prod)}
                            className="text-neutral-400 transition-colors hover:text-red-500 p-2"
                          >
                            <Trash2 className="h-8 w-8" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-6 border-t bg-neutral-50 p-8">
                  <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Forma de pago</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl px-6 py-4 text-center text-lg font-black bg-[#ec131e] text-white shadow-lg shadow-[#ec131e]/30 flex items-center justify-center transition-all hover:bg-[#d0111a] hover:-translate-y-0.5 cursor-pointer">
                      <span>Tarjeta</span>
                    </div>
                    <div className="rounded-2xl px-6 py-4 text-center text-lg font-black bg-teal-500 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all hover:bg-teal-600 hover:-translate-y-0.5 cursor-pointer">
                      <span>Digital</span>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-800 ring-1 ring-red-100">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-2xl">
                    <span className="font-bold text-neutral-500">Total</span>
                    <span className="text-4xl font-black text-neutral-900">${total.toLocaleString('es-CO')}</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handlePreCheckout()}
                      className="w-full rounded-2xl bg-[#ec131e] py-5 font-black text-white shadow-lg shadow-[#ec131e]/30 hover:bg-[#d0111a] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 text-xl uppercase tracking-wider"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin" />
                          Enviando…
                        </>
                      ) : (
                        'Confirmar Pedido'
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={toggleCart}
                        className="rounded-2xl border-2 border-slate-200 py-4 text-lg font-black text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 uppercase tracking-wide"
                      >
                        Seguir comprando
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clearCart();
                          setError(null);
                        }}
                        className="rounded-2xl border-2 border-red-100 bg-red-50 py-4 text-lg font-black text-red-500 transition-all hover:bg-red-100 hover:text-red-700 uppercase tracking-wide"
                      >
                        Vaciar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="max-w-md rounded-[2rem] bg-white p-10 text-center shadow-2xl ring-1 ring-neutral-100"
            >
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Pedido registrado</p>
              <p className="mt-4 text-4xl font-black text-neutral-900">#{successId}</p>
              <p className="mt-4 text-neutral-500">
                Presenta este número en caja. El inventario se ha actualizado según disponibilidad.
              </p>
              <button
                type="button"
                onClick={closeSuccess}
                className="btn-primary mt-8 w-full py-4 font-black uppercase"
              >
                Listo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {stripeQR && (
        <StripeQRModal
          isOpen={stripeQR.isOpen}
          onClose={() => setStripeQR(null)}
          checkoutUrl={stripeQR.url}
          orderId={stripeQR.orderId}
          amount={total}
          onSuccess={() => {
            setStripeQR(null);
            setSuccessId(stripeQR.orderId);
          }}
          onCancel={() => {
            setStripeQR(null);
            setShowCancelAlert(true);
          }}
        />
      )}

      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full rounded-[2rem] bg-white p-8 shadow-2xl flex flex-col"
            >
              <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Resumen del Pedido</h3>

              <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-3 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.cod_prod} className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-700">{item.nom_prod}</p>
                      <p className="text-xs text-slate-400">{item.cantidad} x ${(item.precio_prod).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="font-black text-slate-800">
                      ${(item.cantidad * item.precio_prod).toLocaleString('es-CO')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-xl">
                <span className="font-bold text-slate-500">Total a pagar</span>
                <span className="text-2xl font-black text-[#ec131e]">${total.toLocaleString('es-CO')}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowSummaryModal(false)}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowSummaryModal(false);
                    setShowDiningModal(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-[#ec131e] text-white font-black hover:bg-[#d0111a] transition-all shadow-lg shadow-[#ec131e]/30 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full rounded-[2rem] bg-white p-8 shadow-2xl flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                <ShoppingBasket className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">¿Dónde vas a comer?</h3>
              <p className="text-sm text-slate-500 mb-8 text-center leading-relaxed">
                Selecciona si deseas comer aquí en el local o si quieres tu pedido para llevar.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleCheckout('Comer aquí')}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm hover:shadow-md"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">🍽️</span>
                  <span className="font-bold text-slate-700 group-hover:text-emerald-700">Comer aquí</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleCheckout('Para llevar')}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all group shadow-sm hover:shadow-md"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">🛍️</span>
                  <span className="font-bold text-slate-700 group-hover:text-amber-700">Para llevar</span>
                </button>
              </div>

              {submitting && (
                <div className="flex items-center gap-2 text-[#ec131e] font-bold mb-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowDiningModal(false);
                  setShowSummaryModal(true);
                }}
                className="w-full py-3 text-slate-400 font-bold uppercase text-xs hover:text-slate-600 transition-colors"
              >
                Volver al resumen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-sm w-full rounded-[2rem] bg-white p-8 text-center shadow-2xl flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-[#ec131e]">
                <X className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Pago Cancelado</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                El proceso de pago fue interrumpido o declinado. No se ha realizado ningún cobro a tu tarjeta.
              </p>
              <button
                type="button"
                onClick={() => setShowCancelAlert(false)}
                className="w-full py-4 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-colors"
              >
                Volver al Carrito
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
