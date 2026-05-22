/**
 * ReceiptPrinterService (Kiosk Version)
 * ───────────────────────────────────────
 * Genera comprobantes de compra en HTML y permite imprimirlos via:
 *
 *  1. window.print() — cualquier impresora del sistema / Guardar como PDF
 *  2. WebSerial API — impresoras térmicas USB/Serial ESC/POS (Epson TM, POS-58, POS-80)
 *  3. WebBluetooth BLE — impresoras mini Bluetooth (Peripage A6/A8, Phomemo M02,
 *                         MX10, Paperang, Cat Printer, etc.)
 */

import type { CreatedOrder, OrderLineInput } from './OrderService';

export interface KioskReceiptData extends CreatedOrder {
  items?: OrderLineInput[];
  fecha_vent?: string;
}

// ─── ESC/POS constants ────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;

const CMD_INIT = [ESC, 0x40];
const CMD_BOLD_ON = [ESC, 0x45, 0x01];
const CMD_BOLD_OFF = [ESC, 0x45, 0x00];
const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00];
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
const CMD_ALIGN_RIGHT = [ESC, 0x61, 0x02];
const CMD_DOUBLE_HEIGHT_ON = [ESC, 0x21, 0x10];
const CMD_DOUBLE_HEIGHT_OFF = [ESC, 0x21, 0x00];
const CMD_CUT = [GS, 0x56, 0x42, 0x00]; // Full cut (ESC/POS printers)

// ─── BLE UUIDs for mini thermal printers ────────────/*  */─────────────────────────
const BLE_PRINT_SERVICE = '0000ff00-0000-1000-8000-00805f9b34fb';
const BLE_PRINT_CHAR_WRITE = '0000ff02-0000-1000-8000-00805f9b34fb'; // write
const BLE_PRINT_CHAR_NOTIFY = '0000ff01-0000-1000-8000-00805f9b34fb'; // notify
const BLE_ALT_SERVICE = '0000ae30-0000-1000-8000-00805f9b34fb';
const BLE_ALT_CHAR_WRITE = '0000ae01-0000-1000-8000-00805f9b34fb';

const PAPER_WIDTH_CHARS = 32;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function padEnd(str: string, len: number, fill = ' '): string {
  return str.length >= len ? str.slice(0, len) : str + fill.repeat(len - str.length);
}

function padStart(str: string, len: number, fill = ' '): string {
  return str.length >= len ? str.slice(-len) : fill.repeat(len - str.length) + str;
}

function labelValue(label: string, value: string, width = PAPER_WIDTH_CHARS): string {
  const avail = width - value.length;
  return padEnd(label, avail) + value + '\n';
}

function divider(char = '-', width = PAPER_WIDTH_CHARS): number[] {
  return Array.from(encode(char.repeat(width) + '\n'));
}

// ─── ESC/POS ticket builder ───────────────────────────────────────────────────
function buildEscPosTicket(order: KioskReceiptData, businessName = 'KIORA'): Uint8Array {
  const items = order.items ?? [];
  const total = Number(order.montofinal_vent ?? 0);
  const date = order.fecha_vent
    ? new Date(order.fecha_vent).toLocaleString('es-CO')
    : new Date().toLocaleString('es-CO');
  const method = (order.metodopago_usu ?? 'Efectivo').toUpperCase();
  const idStr = String(order.id_vent ?? '0').padStart(6, '0');
  const W = PAPER_WIDTH_CHARS;

  const buf: number[] = [
    ...CMD_INIT,
    ...CMD_ALIGN_CENTER, ...CMD_BOLD_ON, ...CMD_DOUBLE_HEIGHT_ON,
    ...Array.from(encode(businessName + '\n')),
    ...CMD_DOUBLE_HEIGHT_OFF, ...CMD_BOLD_OFF,
    ...Array.from(encode('COMPROBANTE DE COMPRA (KIOSKO)\n')),
    ...CMD_ALIGN_LEFT,
    ...divider('-', W),
    ...Array.from(encode(labelValue('Comprobante:', `#${idStr}`, W))),
    ...Array.from(encode(labelValue('Fecha:', date.slice(0, W - 7), W))),
    ...Array.from(encode(labelValue('Metodo Pago:', method, W))),
    ...divider('-', W),
    ...CMD_BOLD_ON,
    ...Array.from(encode(
      padEnd('PRODUCTO', 16) + padStart('CANT', 4) + padStart('P.U', 6) + padStart('SUB', 6) + '\n'
    )),
    ...CMD_BOLD_OFF,
    ...divider('-', W),
  ];

  for (const item of items) {
    const name = (item.nom_prod ?? `Prod #${item.cod_prod}`).slice(0, 16);
    const qty = String(item.cantidad);
    const price = `$${Number(item.precio_unit).toLocaleString('es-CO')}`;
    const subtotal = `$${(item.cantidad * Number(item.precio_unit)).toLocaleString('es-CO')}`;
    buf.push(...Array.from(encode(
      padEnd(name, 16) + padStart(qty, 4) + padStart(price, 6) + padStart(subtotal, 6) + '\n'
    )));
  }

  buf.push(
    ...divider('=', W),
    ...CMD_BOLD_ON, ...CMD_ALIGN_RIGHT, ...CMD_DOUBLE_HEIGHT_ON,
    ...Array.from(encode(`TOTAL: $${total.toLocaleString('es-CO')}\n`)),
    ...CMD_DOUBLE_HEIGHT_OFF, ...CMD_BOLD_OFF, ...CMD_ALIGN_CENTER,
    ...divider('-', W),
    ...Array.from(encode('!Gracias por su compra!\n')),
    ...Array.from(encode(`*** ${idStr} ***\n`)),
    ...Array.from(encode('\n\n\n\n\n')),
    ...[ESC, 0x64, 0x05], // Feed 5 lines (ESC d n)
    ...CMD_CUT,
  );

  return new Uint8Array(buf);
}

// ─── BLE mini printer packet builder ─────────────────────────────────────────
function buildBlePackets(order: KioskReceiptData, businessName = 'KIORA'): Uint8Array[] {
  const items = order.items ?? [];
  const total = Number(order.montofinal_vent ?? 0);
  const date = order.fecha_vent
    ? new Date(order.fecha_vent).toLocaleString('es-CO')
    : new Date().toLocaleString('es-CO');
  const method = (order.metodopago_usu ?? 'Efectivo').toUpperCase();
  const idStr = String(order.id_vent ?? '0').padStart(6, '0');
  const W = PAPER_WIDTH_CHARS;
  const SEP = '-'.repeat(W) + '\n';

  let text = '';
  text += `\n`;
  text += `    ${businessName}\n`;
  text += `  COMPROBANTE DE COMPRA\n`;
  text += SEP;
  text += labelValue('Comprobante:', `#${idStr}`, W);
  text += labelValue('Fecha:', date.slice(0, W - 7), W);
  text += labelValue('Pago:', method, W);
  text += SEP;
  text += padEnd('PRODUCTO', 16) + padStart('CANT', 4) + padStart('TOTAL', 12) + '\n';
  text += SEP;

  for (const item of items) {
    const name = (item.nom_prod ?? `Prod #${item.cod_prod}`).slice(0, 16);
    const qty = String(item.cantidad);
    const subtotal = `$${(item.cantidad * Number(item.precio_unit)).toLocaleString('es-CO')}`;
    text += padEnd(name, 16) + padStart(qty, 4) + padStart(subtotal, 12) + '\n';
  }

  text += '='.repeat(W) + '\n';
  text += labelValue('TOTAL:', `$${total.toLocaleString('es-CO')}`, W);
  text += SEP;
  text += `  !Gracias por su compra!\n`;
  text += `    *** ${idStr} ***\n`;
  text += '\n\n\n';

  const full = encode(text);
  const packets: Uint8Array[] = [];
  const CHUNK = 20;
  for (let i = 0; i < full.length; i += CHUNK) {
    packets.push(full.slice(i, i + CHUNK));
  }
  return packets;
}

// ─── Main service class ───────────────────────────────────────────────────────
export class ReceiptPrinterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serialPort: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bleDevice: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bleChar: any = null;

  isWebSerialSupported(): boolean { return 'serial' in navigator; }
  isWebBluetoothSupported(): boolean { return 'bluetooth' in navigator; }

  generateReceiptHTML(order: KioskReceiptData, businessName = 'KIORA'): string {
    const items = order.items ?? [];
    const total = Number(order.montofinal_vent ?? 0);
    const date = order.fecha_vent
      ? new Date(order.fecha_vent).toLocaleString('es-CO')
      : new Date().toLocaleString('es-CO');
    const method = (order.metodopago_usu ?? 'Efectivo').toUpperCase();

    const itemRows = items.map(item => {
      const sub = item.cantidad * Number(item.precio_unit ?? 0);
      return `<tr>
        <td class="item-name">${item.nom_prod ?? `Prod #${item.cod_prod}`}</td>
        <td class="item-qty">${item.cantidad}</td>
        <td class="item-price">$${Number(item.precio_unit).toLocaleString('es-CO')}</td>
        <td class="item-subtotal">$${sub.toLocaleString('es-CO')}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comprobante #${order.id_vent}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
    .receipt { background: #fff; width: 300px; padding: 16px 12px; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,.12); font-size: 12px; line-height: 1.55; }
    .logo { text-align: center; font-size: 22px; font-weight: 900; letter-spacing: 6px; color: #ec131e; margin-bottom: 2px; }
    .subtitle { text-align: center; font-size: 9px; color: #555; margin-bottom: 8px; }
    .divider { border: none; border-top: 1px dashed #ccc; margin: 8px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .info-row .label { color: #666; } .info-row .value { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
    thead th { text-align: left; font-size: 9px; text-transform: uppercase; color: #888; padding-bottom: 4px; }
    thead th:not(:first-child) { text-align: right; }
    td { padding: 2px 0; vertical-align: top; }
    td.item-name { width: 44%; } td.item-qty, td.item-price, td.item-subtotal { text-align: right; white-space: nowrap; }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; margin-top: 8px; }
    .total-row .value { color: #ec131e; }
    .method-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #f5f5f5; border: 1px solid #e0e0e0; text-transform: uppercase; letter-spacing: 1px; }
    .barcode { text-align: center; font-size: 9px; letter-spacing: 3px; color: #444; font-weight: 700; margin: 4px 0; }
    .footer { text-align: center; font-size: 9px; color: #999; margin-top: 8px; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { width: 100%; max-width: 72mm; box-shadow: none; border-radius: 0; padding: 6px 4px; }
      @page { size: 72mm auto; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">${businessName}</div>
    <div class="subtitle">COMPROBANTE DE COMPRA (KIOSKO)</div>
    <hr class="divider"/>
    <div class="info-row"><span class="label">N° Comprobante</span><span class="value">#${String(order.id_vent ?? '---').padStart(6, '0')}</span></div>
    <div class="info-row"><span class="label">Fecha</span><span class="value">${date}</span></div>
    <div class="info-row"><span class="label">Pago</span><span class="value"><span class="method-badge">${method}</span></span></div>
    <hr class="divider"/>
    <table>
      <thead><tr><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr class="divider"/>
    <div class="total-row"><span class="label">TOTAL</span><span class="value">$${total.toLocaleString('es-CO')}</span></div>
    <hr class="divider"/>
    <div class="barcode">*** ${String(order.id_vent ?? '0').padStart(8, '0')} ***</div>
    <div class="footer">¡Gracias por su compra!<br/>Este documento es su comprobante de pago.<br/>Conserve este recibo.</div>
  </div>
</body>
</html>`;
  }

  printWithBrowser(order: KioskReceiptData, businessName = 'KIORA'): void {
    const html = this.generateReceiptHTML(order, businessName);
    const win = window.open('', '_blank', 'width=420,height=700,toolbar=0,scrollbars=0,status=0');
    if (!win) { alert('Permite las ventanas emergentes de este sitio para imprimir.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = () => { setTimeout(() => { win.print(); win.onafterprint = () => win.close(); }, 250); };
  }

  isSerialConnected(): boolean { return this.serialPort !== null; }
  async connectSerial(baudRate = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported()) return false;
    try {
      this.serialPort = await (navigator as any).serial.requestPort();
      // Algunas impresoras USB genéricas usan 9600 o 115200. USB suele ignorarlo, pero es obligatorio mandarlo.
      await this.serialPort!.open({ baudRate, dataBits: 8, stopBits: 1, parity: "none" });
      // Activar señales DTR/RTS (muy importante para que impresoras POS USB procesen el buffer)
      if (this.serialPort!.setSignals) {
        await this.serialPort!.setSignals({ dataTerminalReady: true, requestToSend: true });
      }
      return true;
    } catch (e) {
      console.warn('[ReceiptPrinter] Serial connect failed:', e);
      this.serialPort = null;
      return false;
    }
  }

  async disconnectSerial(): Promise<void> {
    if (this.serialPort) {
      try { await this.serialPort.close(); } catch (_) { /* ignore */ }
      this.serialPort = null;
    }
  }

  async printWithSerial(order: KioskReceiptData, businessName = 'KIORA'): Promise<void> {
    if (!this.serialPort) throw new Error('Puerto serial no conectado');
    const data = buildEscPosTicket(order, businessName);
    const writer = this.serialPort.writable!.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
      try {
        await this.serialPort.close();
      } catch (e) { }
      this.serialPort = null;
    }
  }

  isBleConnected(): boolean { return this.bleChar !== null && this.bleDevice?.gatt?.connected === true; }
  async connectBluetooth(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) return false;
    try {
      this.bleDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: [BLE_PRINT_SERVICE] }, { services: [BLE_ALT_SERVICE] },
          { services: ['0000ae30-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'Peripage' }, { namePrefix: 'Phomemo' }, { namePrefix: 'MX' },
          { namePrefix: 'GB' }, { namePrefix: 'Cat' }, { namePrefix: 'Paperang' },
          { namePrefix: 'BlePrinter' }, { namePrefix: 'M02' }, { namePrefix: 'A6' },
          { namePrefix: 'Small' }, { namePrefix: 'Thermal' }, { namePrefix: 'MPT' },
        ],
        optionalServices: [
          BLE_PRINT_SERVICE,
          BLE_ALT_SERVICE,
          '0000ae30-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4158-b296-14606b9b4392',
          'e7e11001-4997-4679-bf4d-321b267dd923'
        ],
      });

      console.log('[ReceiptPrinter] Connecting to GATT server...');
      const server = await this.bleDevice!.gatt!.connect();

      // Helper para timeout
      const withTimeout = (promise: Promise<any>, ms: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      console.log('[ReceiptPrinter] Discovering services with timeout...');

      // 1. Try known print services one by one
      const knownServices = [
        '0000ae30-0000-1000-8000-00805f9b34fb', // Common iPrint/Xprinter
        '0000ff00-0000-1000-8000-00805f9b34fb', // Generic
        '000018f0-0000-1000-8000-00805f9b34fb', // Alternative
        '49535343-fe7d-4158-b296-14606b9b4392', // Microchip/Generic
        'e7e11001-4997-4679-bf4d-321b267dd923'  // Peripage/Paperang
      ];

      for (const serviceUuid of knownServices) {
        try {
          console.log(`[ReceiptPrinter] Trying service: ${serviceUuid}`);
          const service = await withTimeout(server.getPrimaryService(serviceUuid), 3000);
          console.log(`[ReceiptPrinter] Found service: ${serviceUuid}, searching characteristics...`);
          const chars = await withTimeout(service.getCharacteristics(), 3000);
          const writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (writeChar) {
            console.log('[ReceiptPrinter] SUCCESS! Found write characteristic:', writeChar.uuid);
            this.bleChar = writeChar;
            return true;
          }
        } catch (e) {
          console.warn(`[ReceiptPrinter] Service ${serviceUuid} failed or timeout`);
        }
      }

      // 2. Last resort: full discovery (only if everything else fails)
      console.log('[ReceiptPrinter] Full discovery fallback...');
      const allServices = await withTimeout(server.getPrimaryServices(), 5000);
      for (const service of allServices) {
        try {
          const chars = await service.getCharacteristics();
          const writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (writeChar) {
            this.bleChar = writeChar;
            return true;
          }
        } catch (e) { }
      }

      throw new Error('No se encontró un canal de escritura compatible.');
    } catch (e: any) {
      console.error('[ReceiptPrinter] BLE error:', e);
      this.bleDevice = null;
      this.bleChar = null;
      return false;
    }
  }

  async disconnectBluetooth(): Promise<void> {
    if (this.bleDevice?.gatt?.connected) this.bleDevice.gatt.disconnect();
    this.bleDevice = null;
    this.bleChar = null;
  }

  async printWithBluetooth(order: KioskReceiptData, businessName = 'KIORA'): Promise<void> {
    if (!this.bleChar) throw new Error('Impresora Bluetooth no conectada');
    const packets = buildBlePackets(order, businessName);
    for (const packet of packets) {
      await this.bleChar.writeValueWithoutResponse(packet);
      await new Promise(r => setTimeout(r, 30));
    }
  }

  getBleDeviceName(): string | null { return this.bleDevice?.name ?? null; }
}

export const receiptPrinterService = new ReceiptPrinterService();
