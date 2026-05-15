/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Misma base que PROYECTO_KIORAPP: p. ej. /api (con proxy) o http://…/api */
  readonly PUBLIC_API_URL?: string;
  /** Debe coincidir con KIOSK_API_KEY del API Gateway (pedidos del kiosco). */
  readonly PUBLIC_KIOSK_API_KEY?: string;
  /** Weglot (opcional). */
  readonly PUBLIC_WEGLOT_API_KEY?: string;
  /** Sentry DSN público (opcional; alinear con el panel). */
  readonly PUBLIC_SENTRY_DSN?: string;
  /**
   * Solo entorno de build / CI para Sentry (source maps). No es PUBLIC_*;
   * no se expone al bundle del cliente.
   */
  readonly SENTRY_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ─── WebSerial ────────────────────────────────────────────────────────────────
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

interface SerialPortRequestOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
  serial: Serial;
}

// ─── WebBluetooth ─────────────────────────────────────────────────────────────
interface BluetoothRemoteGATTCharacteristic {
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  writeValue(value: BufferSource): Promise<void>;
  readValue(): Promise<DataView>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  connected: boolean;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface RequestDeviceOptions {
  filters?: { services?: string[]; namePrefix?: string; name?: string }[];
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getAvailability(): Promise<boolean>;
}

interface Navigator {
  bluetooth: Bluetooth;
}
