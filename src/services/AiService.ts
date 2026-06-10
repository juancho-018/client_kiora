import { getApiBase } from '../utils/apiBase';

export interface CrossSellingRecommendation {
  product_id: number;
  name: string;
  confidence: number;
  trigger?: number;
}

export class AiService {
  static async getCrossSellingRecommendations(cartItems: number[]): Promise<CrossSellingRecommendation[]> {
    if (!cartItems.length) return [];
    
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      
      const key = import.meta.env.PUBLIC_KIOSK_API_KEY;
      if (key) headers['x-api-key'] = String(key);

      const res = await fetch(`${getApiBase()}/ai/cross-selling/recommend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cart_items: cartItems }),
      });

      if (!res.ok) return [];
      const json = await res.json();
      return json.recommendations || [];
    } catch (e) {
      console.error('Error fetching cross-selling recommendations', e);
      return [];
    }
  }
}
