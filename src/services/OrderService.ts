/**
 * Pedidos del kiosco: el gateway exige JWT en /api/orders salvo
 * header x-api-key igual a KIOSK_API_KEY (configura PUBLIC_KIOSK_API_KEY en el cliente).
 */

import { getApiBase } from '../utils/apiBase';

function kioskHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const key = import.meta.env.PUBLIC_KIOSK_API_KEY;
  if (key) headers['x-api-key'] = String(key);
  return headers;
}

export interface OrderLineInput {
  cod_prod: number;
  cantidad: number;
  precio_unit: number;
  nom_prod?: string;
}

export interface CreatedOrder {
  id_vent: number;
  montofinal_vent?: number;
  estado?: string;
  metodopago_usu?: string;
  items?: {
    cod_prod: number;
    nom_prod?: string;
    cantidad: number;
    precio_unit: number;
  }[];
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string; message?: string };
    return j.message || j.error || `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export class OrderService {
  static isKioskConfigured(): boolean {
    return Boolean(import.meta.env.PUBLIC_KIOSK_API_KEY);
  }

  /** Crea venta en estado pendiente (misma forma que el panel admin). */
  static async createOrder(
    items: OrderLineInput[],
    metodopago_usu: string
  ): Promise<CreatedOrder> {
    const body = {
      metodopago_usu: metodopago_usu || 'kiosco',
      items: items.map((i) => ({
        cod_prod: i.cod_prod,
        cantidad: i.cantidad,
        precio_unit: i.precio_unit,
      })),
    };

    const res = await fetch(`${getApiBase()}/orders`, {
      method: 'POST',
      headers: kioskHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await parseError(res));
    return (await res.json()) as CreatedOrder;
  }

  /** Completa la venta y ejecuta la saga de inventario (descuenta stock). */
  static async completeOrder(orderId: number): Promise<CreatedOrder> {
    return this.updateOrderStatus(orderId, 'completada');
  }

  static async updateOrderStatus(orderId: number, estado: string): Promise<CreatedOrder> {
    const res = await fetch(`${getApiBase()}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: kioskHeaders(),
      body: JSON.stringify({ estado }),
    });

    if (!res.ok) throw new Error(await parseError(res));
    return (await res.json()) as CreatedOrder;
  }

  static async getOrderById(orderId: number): Promise<CreatedOrder> {
    const res = await fetch(`${getApiBase()}/orders/${orderId}`, {
      method: 'GET',
      headers: kioskHeaders(),
    });

    if (!res.ok) throw new Error(await parseError(res));
    return (await res.json()) as CreatedOrder;
  }

  /** Genera la sesión de Checkout de Stripe para pago digital. */
  static async createCheckoutSession(orderId: number, successUrl: string, cancelUrl: string): Promise<string> {
    const res = await fetch(`${getApiBase()}/orders/checkout/${orderId}`, {
      method: 'POST',
      headers: kioskHeaders(),
      body: JSON.stringify({ success_url: successUrl, cancel_url: cancelUrl }),
    });

    if (!res.ok) throw new Error(await parseError(res));
    const json = (await res.json()) as { checkoutUrl: string };
    return json.checkoutUrl;
  }

  /** Verifica con Stripe si el pago fue completado y actualiza el estado en la BD (sin webhook). */
  static async verifyPayment(orderId: number): Promise<{ status: string; already_done?: boolean }> {
    const res = await fetch(`${getApiBase()}/orders/checkout/${orderId}/verify`, {
      method: 'GET',
      headers: kioskHeaders(),
    });

    if (!res.ok) throw new Error(await parseError(res));
    return (await res.json()) as { status: string; already_done?: boolean };
  }
}
