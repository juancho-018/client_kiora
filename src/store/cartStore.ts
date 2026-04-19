import { create } from 'zustand';
import type { Product } from '../services/ProductService';

interface CartItem {
  cod_prod: number;
  nom_prod: string;
  precio_prod: number;
  imagen_prod: string;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appStarted: boolean;
  searchQuery: string;
  addItem: (product: Product) => void;
  removeItem: (cod_prod: number) => void;
  updateQuantity: (cod_prod: number, delta: number) => void;
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
  addItem: (product) => set((state) => {
    const productId = product.cod_prod;
    const existing = state.items.find((item) => item.cod_prod === productId);
    if (existing) {
      return {
        items: state.items.map((item) =>
          item.cod_prod === productId
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ),
      };
    }
    return {
      items: [
        ...state.items,
        {
          cod_prod: productId,
          nom_prod: product.nom_prod,
          precio_prod: product.precio_prod,
          imagen_prod: product.imagen_prod,
          cantidad: 1,
        },
      ],
    };
  }),
  removeItem: (cod_prod) =>
    set((state) => ({
      items: state.items.filter((item) => item.cod_prod !== cod_prod),
    })),
  updateQuantity: (cod_prod, delta) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.cod_prod === cod_prod
          ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
          : item
      ),
    })),
  clearCart: () => set({ items: [] }),
}));
