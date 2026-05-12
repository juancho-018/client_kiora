import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBasket, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { OrderService } from '../services/OrderService';
import { getImageUrl } from '../utils/getImageUrl';
import { useProductContext } from '../context/ProductContext';

type PaymentChoice = 'efectivo' | 'tarjeta_presencial' | 'pendiente';

export const Cart: React.FC = () => {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const { refreshData } = useProductContext();

  const [payment, setPayment] = useState<PaymentChoice>('tarjeta_presencial');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const total = items.reduce((acc, item) => acc + item.precio_prod * item.cantidad, 0);

  const handleCheckout = async () => {
    setError(null);
    if (items.length === 0) return;

    if (!OrderService.isKioskConfigured()) {
      setError(
        'Este kiosco necesita PUBLIC_KIOSK_API_KEY en el entorno (debe coincidir con KIOSK_API_KEY del API Gateway). Consulte al administrador.'
      );
      return;
    }

    const metodoLabel = 'tarjeta_presencial'; // STRICTLY CARD ONLY

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

      // Guardar información temporal para imprimir el recibo luego del redireccionamiento
      localStorage.setItem('kiosk_last_order', JSON.stringify({
        id_vent: id,
        montofinal_vent: total,
        estado: 'pagado',
        metodopago_usu: 'Stripe (Digital)',
        items: lines,
      }));

      // Generar URL de Stripe
      const successUrl = `${window.location.origin}/?payment=success&order_id=${id}`;
      const cancelUrl = `${window.location.origin}/?payment=cancel&order_id=${id}`;
      
      const checkoutUrl = await OrderService.createCheckoutSession(id, successUrl, cancelUrl);
      
      if (!checkoutUrl) throw new Error('No se pudo generar el enlace de pago seguro');

      // Redirigir al cliente a Stripe
      window.location.href = checkoutUrl;

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo registrar el pedido';
      setError(msg);
      setSubmitting(false); // Only set to false on error, because on success we redirect
    }
  };

  const closeSuccess = () => {
    setSuccessId(null);
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
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[101] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-6">
              <div className="flex items-center gap-3">
                <ShoppingBasket className="h-6 w-6 text-strawberry-red" />
                <h2 className="text-2xl font-black italic text-neutral-900">Tu pedido</h2>
              </div>
              <button type="button" onClick={toggleCart} className="rounded-full p-2 transition-colors hover:bg-neutral-100">
                <X className="h-6 w-6 text-neutral-500" />
              </button>
            </div>

            <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-50">
                  <ShoppingBasket className="h-20 w-20" />
                  <p className="text-xl font-bold">Tu carrito está vacío</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.cod_prod} className="group flex gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                      <img
                        src={getImageUrl(item.imagen_prod) || '/placeholder.png'}
                        alt={item.nom_prod}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 font-bold text-neutral-800">{item.nom_prod}</h4>
                      <p className="text-lg font-black text-strawberry-red">
                        ${(item.precio_prod * item.cantidad).toLocaleString('es-CO')}
                      </p>

                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-3 rounded-xl bg-neutral-100 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cod_prod, -1)}
                            className="p-1 transition-colors hover:text-strawberry-red"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-bold">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cod_prod, 1)}
                            className="p-1 transition-colors hover:text-strawberry-red"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.cod_prod)}
                          className="text-neutral-400 transition-colors hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-4 border-t bg-neutral-50 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Forma de pago</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-xl px-4 py-3 text-left text-sm font-bold bg-strawberry-red text-white shadow-lg shadow-strawberry-red/20 flex items-center justify-between">
                    <span>💳 Pagar con Tarjeta (Único medio aceptado)</span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-800 ring-1 ring-red-100">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between text-xl">
                  <span className="font-bold text-neutral-500">Total</span>
                  <span className="text-3xl font-black text-neutral-900">${total.toLocaleString('es-CO')}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setError(null);
                    }}
                    className="rounded-2xl border-2 border-neutral-200 py-4 font-bold text-neutral-500 transition-all hover:bg-neutral-100"
                  >
                    Vaciar
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleCheckout()}
                    className="btn-primary flex items-center justify-center gap-2 py-4 uppercase disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Enviando…
                      </>
                    ) : (
                      'Confirmar pedido'
                    )}
                  </button>
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
    </>
  );
};
