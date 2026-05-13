import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface CartStore {
  items: CartItem[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
  totalUsd: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addProduct(product) {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { product, qty: 1 }] };
    });
  },

  removeProduct(productId) {
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) }));
  },

  setQty(productId, qty) {
    if (qty <= 0) {
      get().removeProduct(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, qty } : i,
      ),
    }));
  },

  clear() {
    set({ items: [] });
  },

  totalUsd() {
    return get().items.reduce((sum, i) => sum + i.product.price_usd * i.qty, 0);
  },
}));
