import { create } from 'zustand';
import type { Product } from '../services/ProductService';

interface CartItem {
  cod_prod: number;
  nom_prod: string;
  desc_prod?: string;
  precio_prod: number;
  imagen_prod: string;
  cantidad: number;
  /** Stock del producto al incorporar al carrito (tope al editar cantidades). */
  stock_snapshot: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appStarted: boolean;
  searchQuery: string;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (cod_prod: number) => void;
  updateQuantity: (cod_prod: number, delta: number) => void;
  setQuantity: (cod_prod: number, qty: number) => void;
  toggleCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;
  setAppStarted: (started: boolean) => void;
  setSearchQuery: (query: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  appStarted: false,
  searchQuery: '',
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsCartOpen: (isOpen) => set({ isOpen }),
  setAppStarted: (started) => set({ appStarted: started }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addItem: (product, qty = 1) =>
    set((state) => {
      const maxStock = Math.max(0, Number(product.stock_actual ?? 0));
      if (maxStock <= 0 || qty <= 0) return state;

      const productId = product.cod_prod;
      const existing = state.items.find((item) => item.cod_prod === productId);
      const requested = (existing?.cantidad ?? 0) + qty;
      const nextQty = Math.min(requested, maxStock);

      const row: CartItem = {
        cod_prod: productId,
        nom_prod: product.nom_prod,
        desc_prod: product.desc_prod,
        precio_prod: product.precio_prod,
        imagen_prod: product.imagen_prod,
        cantidad: nextQty,
        stock_snapshot: maxStock,
      };

      if (existing) {
        return {
          items: state.items.map((item) => (item.cod_prod === productId ? row : item)),
        };
      }
      return { items: [...state.items, row] };
    }),

  removeItem: (cod_prod) =>
    set((state) => ({
      items: state.items.filter((item) => item.cod_prod !== cod_prod),
    })),

  updateQuantity: (cod_prod, delta) =>
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.cod_prod !== cod_prod) return item;
          const max = Math.max(item.stock_snapshot, item.cantidad);
          const next = item.cantidad + delta;
          const clamped = Math.min(Math.max(0, next), max);
          return { ...item, cantidad: clamped };
        })
        .filter((item) => item.cantidad > 0),
    })),

  setQuantity: (cod_prod, qty) =>
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.cod_prod !== cod_prod) return item;
          const max = Math.max(item.stock_snapshot, item.cantidad);
          const clamped = Math.min(Math.max(0, qty), max);
          return { ...item, cantidad: clamped };
        })
        .filter((item) => item.cantidad > 0),
    })),

  clearCart: () => set({ items: [] }),
}));
