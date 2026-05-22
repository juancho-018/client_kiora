import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OrderService, type CreatedOrder } from '../services/OrderService';
import Swal from 'sweetalert2';

export const PaymentSuccess: React.FC = () => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<CreatedOrder | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    if (id) {
      setOrderId(id);
      OrderService.getOrderById(Number(id))
        .then(data => {
          setOrderData(data);
          setLoading(false);

          // 🎉 SweetAlert de éxito al cargar la orden
          void Swal.fire({
            title: '¡Pago Confirmado!',
            html: `
              <p style="font-size:0.95rem;color:#64748b;margin-bottom:0.5rem;">
                Tu compra fue procesada exitosamente.
              </p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:1rem;padding:1rem;margin-top:0.75rem;display:inline-block;">
                <span style="font-size:0.65rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Orden</span>
                <div style="font-size:2rem;font-weight:900;color:#ec131e;">#${id}</div>
              </div>
            `,
            icon: 'success',
            iconColor: '#10b981',
            confirmButtonText: 'Ver Resumen',
            confirmButtonColor: '#ec131e',
            background: '#ffffff',
            customClass: {
              popup: 'swal-kiora-popup',
              confirmButton: 'swal-kiora-btn',
            },
          });
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
          void Swal.fire({
            title: 'Pago procesado',
            text: `Tu orden #${id} fue registrada correctamente.`,
            icon: 'success',
            iconColor: '#10b981',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#ec131e',
            background: '#ffffff',
          });
        });
    } else {
      setLoading(false);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full blur-[100px] opacity-40"></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] text-center relative z-10 border border-white"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 shadow-inner">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">¡Pago Completado!</h1>
        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed px-4">
          Tu pago se procesó exitosamente. Revisa el resumen de tu compra.
        </p>

        {loading ? (
          <div className="bg-slate-50/50 p-6 rounded-[2rem] mb-8 border border-slate-100 shadow-sm flex flex-col gap-3 animate-pulse">
            <div className="h-4 bg-slate-200/60 rounded-full w-1/3 mb-2"></div>
            <div className="h-10 bg-slate-200/60 rounded-xl w-full"></div>
            <div className="h-4 bg-slate-200/60 rounded-full w-1/2"></div>
          </div>
        ) : orderData ? (
          <div className="bg-white p-6 rounded-[2rem] mb-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden #{orderId}</span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                {orderData.metodopago_usu || 'Tarjeta'}
              </span>
            </div>

            <div className="max-h-[160px] overflow-y-auto mb-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
              {(orderData.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex items-start gap-2 overflow-hidden pr-2">
                    <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{item.cantidad}x</span>
                    <span className="leading-tight text-xs font-bold text-slate-600 mt-0.5">{item.nom_prod}</span>
                  </div>
                  <span className="font-black text-slate-800 shrink-0 text-sm">
                    ${((item.cantidad || 1) * (item.precio_unit || 0)).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-end">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Pagado</span>
              <span className="text-2xl font-black text-[#ec131e]">
                ${Number(orderData.montofinal_vent || 0).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        ) : (
          orderId && (
            <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Número de Orden</p>
              <p className="text-4xl font-black text-[#ec131e]">#{orderId}</p>
            </div>
          )
        )}

        <button
          onClick={() => { window.location.href = '/'; }}
          className="w-full py-4 rounded-2xl bg-[#ec131e] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#ec131e]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Volver a Kiora
          <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs">{timeLeft}s</span>
        </button>
      </motion.div>
    </div>
  );
};
