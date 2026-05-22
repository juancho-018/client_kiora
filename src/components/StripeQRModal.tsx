import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { OrderService } from '../services/OrderService';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

interface StripeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl: string;
  orderId: number;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

const POLL_MS = 3000;
const MAX_POLL_ERRORS = 3;

export function StripeQRModal({
  isOpen,
  onClose,
  checkoutUrl,
  orderId,
  amount,
  onSuccess,
  onCancel,
}: StripeQRModalProps) {
  const [polling, setPolling] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const pollErrors = useRef(0);

  const isPaidStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'pagado' || normalized === 'pagada' || normalized === 'completada';
  };

  const isFailedStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'cancelada' || normalized === 'reembolsada';
  };

  useEffect(() => {
    if (!isOpen || orderId <= 0) {
      setPaymentError(null);
      pollErrors.current = 0;
      return;
    }

    setPaymentError(null);
    pollErrors.current = 0;
    setPolling(true);

    const interval = setInterval(async () => {
      try {
        // verifyPayment consulta Stripe directamente y actualiza la BD si está pagado
        const result = await OrderService.verifyPayment(orderId);
        pollErrors.current = 0;

        if (result.status === 'completada') {
          clearInterval(interval);
          setPolling(false);
          onSuccess();
          return;
        }

        // Si el estado en BD es cancelada (por acción del usuario)
        if (result.status === 'cancelada' || result.status === 'reembolsada') {
          clearInterval(interval);
          setPolling(false);
          setPaymentError('El pago no se completó o la orden fue cancelada.');
        }
      } catch (error) {
        pollErrors.current += 1;
        console.error('Error polling order status:', error);
        if (pollErrors.current >= MAX_POLL_ERRORS) {
          setPaymentError('Error al consultar el estado del pago. Por favor, avise al cajero.');
        }
      }
    }, POLL_MS);

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [isOpen, orderId, checkoutUrl, onSuccess]);

  const handleCancelPayment = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar el pago?',
      text: '¿Estás seguro que deseas cancelar el pago en proceso?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ec131e',
      cancelButtonColor: '#a3a3a3',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      background: '#ffffff',
      color: '#1e293b',
      customClass: {
        container: 'z-[9999]',
        popup: '!rounded-[2.5rem] shadow-2xl border border-slate-100',
        title: 'text-2xl font-black text-slate-800',
        confirmButton: '!rounded-2xl px-8 py-3.5 font-bold shadow-lg shadow-red-500/30 transition-transform hover:scale-105 active:scale-95 uppercase tracking-wide',
        cancelButton: '!rounded-2xl px-8 py-3.5 font-bold transition-transform hover:scale-105 active:scale-95 uppercase tracking-wide text-white'
      },
      showClass: {
        popup: 'swal2-show animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'swal2-hide animate__animated animate__fadeOutUp animate__faster'
      }
    });

    if (result.isConfirmed) {
      try {
        await OrderService.updateOrderStatus(orderId, 'cancelada');
        if (onCancel) onCancel();
        else onClose();
      } catch (error) {
        setPaymentError('No se pudo cancelar la orden. Por favor avise al cajero.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        <div className="h-2 w-full bg-gradient-to-r from-[#ec131e] via-[#ff4444] to-[#ec131e]" />

        <div className="p-10">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tight text-neutral-800">Escanea y Paga</h2>
            <p className="mt-3 text-base font-medium text-neutral-500">
              Usa la cámara de tu celular para pagar de forma segura.
            </p>
          </div>

          {paymentError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              <p className="font-bold">Problema con el pago</p>
              <p className="mt-1 text-xs font-medium opacity-90">{paymentError}</p>
            </div>
          )}

          <div className="relative mb-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8">
            <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl shadow-blue-500/10">
              <QRCodeSVG value={checkoutUrl} size={280} level="H" includeMargin={false} />
            </div>

            <div className="text-center">
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-400">Total a pagar</span>
              <div className="mt-2 text-4xl font-black text-neutral-900">${amount.toLocaleString('es-CO')}</div>
            </div>

            {polling && !paymentError && (
              <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-100 bg-white px-4 py-1.5 shadow-lg">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                  Esperando pago...
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => { window.location.href = checkoutUrl; }}
              className="w-full py-4 text-sm font-black uppercase tracking-widest text-white bg-[#ec131e] rounded-2xl transition-all hover:bg-[#d0111a] shadow-lg shadow-[#ec131e]/30 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Pagar en este dispositivo
            </button>
            <button
              type="button"
              onClick={handleCancelPayment}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-600"
            >
              Cancelar pago
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
