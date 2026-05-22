import React, { useState, useRef, useEffect } from 'react';
import { receiptPrinterService, type KioskReceiptData } from '../services/ReceiptPrinterService';

interface ReceiptModalProps {
  order: KioskReceiptData;
  onClose: () => void;
}

type PrintMethod = 'browser' | 'bluetooth' | 'serial';
type PrinterState = 'idle' | 'connecting' | 'connected' | 'printing' | 'success' | 'error';

interface MethodState {
  status: PrinterState;
  message: string;
}

const INITIAL_STATE: MethodState = { status: 'idle', message: '' };

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [bleState, setBleState] = useState<MethodState>(INITIAL_STATE);
  const [serialState, setSerialState] = useState<MethodState>(INITIAL_STATE);
  const [baudRate, setBaudRate] = useState<number>(9600);

  const bleSupported    = receiptPrinterService.isWebBluetoothSupported();
  const serialSupported = receiptPrinterService.isWebSerialSupported();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptPrinterService.generateReceiptHTML(order));
      doc.close();
    }
  }, [order]);

  const handleBrowserPrint = () => receiptPrinterService.printWithBrowser(order);

  const handleBleConnect = async () => {
    setBleState({ status: 'connecting', message: 'Buscando impresoras Bluetooth cercanas...' });
    const ok = await receiptPrinterService.connectBluetooth();
    if (ok) {
      const name = receiptPrinterService.getBleDeviceName() ?? 'Impresora';
      setBleState({ status: 'connected', message: `✓ Conectado a "${name}"` });
    } else {
      setBleState({ status: 'error', message: 'No se pudo conectar. Asegúrate de que la impresora está encendida y en modo de emparejamiento.' });
    }
  };

  const handleBlePrint = async () => {
    setBleState(s => ({ ...s, status: 'printing', message: 'Enviando ticket a la impresora...' }));
    try {
      await receiptPrinterService.printWithBluetooth(order);
      setBleState({ status: 'success', message: '✓ ¡Ticket impreso exitosamente!' });
    } catch (e: any) {
      setBleState({ status: 'error', message: `Error al imprimir: ${e?.message ?? 'Error desconocido'}` });
    }
  };

  const handleBleDisconnect = async () => {
    await receiptPrinterService.disconnectBluetooth();
    setBleState(INITIAL_STATE);
  };

  const handleSerialConnect = async () => {
    setSerialState({ status: 'connecting', message: 'Selecciona el puerto en el diálogo...' });
    const ok = await receiptPrinterService.connectSerial(baudRate);
    if (ok) {
      setSerialState({ status: 'connected', message: '✓ Puerto USB/Serial conectado' });
    } else {
      setSerialState({ status: 'error', message: 'No se pudo abrir el puerto. Verifica que la impresora esté conectada.' });
    }
  };

  const handleSerialPrint = async () => {
    setSerialState(s => ({ ...s, status: 'printing', message: 'Enviando ticket...' }));
    try {
      await receiptPrinterService.printWithSerial(order);
      setSerialState({ status: 'success', message: '✓ ¡Ticket impreso exitosamente!' });
    } catch (e: any) {
      setSerialState({ status: 'error', message: `Error al imprimir: ${e?.message ?? 'Error desconocido'}` });
    }
  };

  const handleSerialDisconnect = async () => {
    await receiptPrinterService.disconnectSerial();
    setSerialState(INITIAL_STATE);
  };

  const isBleConnected    = receiptPrinterService.isBleConnected();
  const isSerialConnected = receiptPrinterService.isSerialConnected();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col transform transition-all scale-100">
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">Comprobante de Compra</h2>
            <p className="text-xs text-neutral-400 font-bold mt-0.5 uppercase tracking-widest">
              Venta #{order.id_vent}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
            <div className="px-5 py-3 border-b border-neutral-100 bg-white flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-neutral-500">Vista Previa del Comprobante</span>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center">
              <iframe
                ref={iframeRef}
                title="Vista previa del comprobante"
                className="w-[310px] min-h-[520px] bg-white rounded-2xl shadow-xl border border-neutral-200"
                style={{ border: 'none' }}
                scrolling="auto"
              />
            </div>
          </div>

          <div className="w-full lg:w-80 flex flex-col gap-4 p-5 border-t lg:border-t-0 lg:border-l border-neutral-100 overflow-y-auto shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Opciones de Impresión</p>

            <PrinterCard
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>}
              iconBg="bg-blue-50 text-blue-600"
              title="Imprimir / Guardar PDF"
              description="Usa cualquier impresora del sistema o guarda como PDF desde el navegador."
              badge="Todos los navegadores"
              badgeColor="bg-blue-50 text-blue-600"
              supported={true}
            >
              <button onClick={handleBrowserPrint} className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white py-3 text-sm font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Abrir Diálogo
              </button>
            </PrinterCard>

            <PrinterCard
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41l5.59 5.59L5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg>}
              iconBg={isBleConnected ? 'bg-violet-100 text-violet-600' : 'bg-violet-50 text-violet-500'}
              title="Impresora Bluetooth"
              description="Mini impresoras inalámbricas: Peripage, Phomemo, etc."
              badge={bleSupported ? 'Chrome · Edge · Brave' : 'No soportado'}
              badgeColor={bleSupported ? 'bg-violet-50 text-violet-600' : 'bg-red-50 text-red-500'}
              supported={bleSupported}
              unsupportedMessage="Tu navegador no soporta WebBluetooth. Usa Chrome, Edge o Brave (con Shields off)."
              state={bleState}
              connected={isBleConnected}
            >
              <ConnectPrintButtons connected={isBleConnected} state={bleState} onConnect={() => void handleBleConnect()} onPrint={() => void handleBlePrint()} onDisconnect={() => void handleBleDisconnect()} connectLabel="Conectar por Bluetooth" printLabel="🖨️ Imprimir Ticket" connectColor="bg-violet-600 hover:bg-violet-700" printColor="bg-emerald-600 hover:bg-emerald-700" />
            </PrinterCard>

            <PrinterCard
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2v-2H6v2a2 2 0 002 2zM6 17V7a1 1 0 011-1h10a1 1 0 011 1v10H6z" /></svg>}
              iconBg={isSerialConnected ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-500'}
              title="Impresora USB / Serial"
              description="Impresoras ESC/POS (Epson, POS-58)."
              badge={serialSupported ? 'Chrome · Edge · Brave' : 'No soportado'}
              badgeColor={serialSupported ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-500'}
              supported={serialSupported}
              unsupportedMessage="Tu navegador no soporta WebSerial. Usa Chrome, Edge o Brave (con Shields off)."
              state={serialState}
              connected={isSerialConnected}
            >
              <div className="flex flex-col gap-2">
                {!isSerialConnected && (
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                    <span>Velocidad (Baudios):</span>
                    <select 
                      value={baudRate} 
                      onChange={(e) => setBaudRate(Number(e.target.value))}
                      className="bg-white border border-neutral-200 rounded px-2 py-1 font-bold text-neutral-700 outline-none"
                    >
                      <option value={9600}>9600 (Genéricas)</option>
                      <option value={115200}>115200 (Epson/Nuevas)</option>
                      <option value={19200}>19200</option>
                    </select>
                  </div>
                )}
                <ConnectPrintButtons connected={isSerialConnected} state={serialState} onConnect={() => void handleSerialConnect()} onPrint={() => void handleSerialPrint()} onDisconnect={() => void handleSerialDisconnect()} connectLabel="Conectar por USB" printLabel="🖨️ Imprimir Ticket" connectColor="bg-orange-500 hover:bg-orange-600" printColor="bg-emerald-600 hover:bg-emerald-700" />
              </div>
            </PrinterCard>

            <p className="text-[10px] text-neutral-400 text-center leading-relaxed px-2">
              Imprime en papel A4 o térmico 58/80 mm.<br/>
              <span className="text-amber-500 font-bold">Brave:</span> desactiva Shields (🦁) para este sitio si algo no funciona.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrinterCard({ icon, iconBg, title, description, badge, badgeColor, supported, unsupportedMessage, state, connected, children }: any) {
  const borderColor = connected ? 'border-emerald-200' : !supported ? 'border-neutral-100 opacity-60' : 'border-neutral-100';
  return (
    <div className={`rounded-2xl border ${borderColor} bg-white p-4 shadow-sm space-y-3 transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
          <div>
            <p className="text-sm font-black text-neutral-800">{title}</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          </div>
        </div>
        {connected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 animate-pulse shrink-0" />}
      </div>
      <p className="text-[11px] text-neutral-500 leading-relaxed">{description}</p>
      {!supported && unsupportedMessage ? (
        <div className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-xl leading-relaxed">⚠ {unsupportedMessage}</div>
      ) : (
        <>
          {state && state.message && (
            <div className={`text-[10px] p-3 rounded-xl border font-medium leading-relaxed ${state.status === 'error' ? 'bg-red-50 border-red-100 text-red-600' : state.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-neutral-50 border-neutral-100 text-neutral-600'}`}>{state.message}</div>
          )}
          {children}
        </>
      )}
    </div>
  );
}

function ConnectPrintButtons({ connected, state, onConnect, onPrint, onDisconnect, connectLabel, printLabel, connectColor, printColor }: any) {
  const isLoading = state.status === 'connecting' || state.status === 'printing';
  if (!connected) {
    return (
      <button onClick={onConnect} disabled={isLoading} className={`w-full flex items-center justify-center gap-2 rounded-xl text-white py-3 text-sm font-black active:scale-95 transition-all shadow-lg disabled:opacity-60 ${connectColor}`}>
        {state.status === 'connecting' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : connectLabel}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <button onClick={onPrint} disabled={isLoading} className={`w-full flex items-center justify-center gap-2 rounded-xl text-white py-3 text-sm font-black active:scale-95 transition-all shadow-lg disabled:opacity-60 ${printColor}`}>
        {state.status === 'printing' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : printLabel}
      </button>
      <button onClick={onDisconnect} className="w-full py-2 rounded-xl border border-neutral-200 text-[10px] font-black text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all">Desconectar</button>
    </div>
  );
}
