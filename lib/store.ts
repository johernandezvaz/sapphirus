import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem } from '@/types/cart';

interface CartStore {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: { items: [], total: 0 },
      addItem: (item) => set((state) => {
        const existingItem = state.cart.items.find(
          (i) => i.productId === item.productId
        );

        if (existingItem) {
          const updatedItems = state.cart.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );

          return {
            cart: {
              items: updatedItems,
              total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
            },
          };
        }

        const newItem = {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
        };

        const updatedItems = [...state.cart.items, newItem];

        return {
          cart: {
            items: updatedItems,
            total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          },
        };
      }),
      removeItem: (productId) =>
        set((state) => ({
          cart: {
            items: state.cart.items.filter((i) => i.productId !== productId),
            total: state.cart.items
              .filter((i) => i.productId !== productId)
              .reduce((sum, i) => sum + i.price * i.quantity, 0),
          },
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart: {
            items: state.cart.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
            total: state.cart.items
              .map((i) =>
                i.productId === productId
                  ? { ...i, quantity }
                  : i
              )
              .reduce((sum, i) => sum + i.price * i.quantity, 0),
          },
        })),
      clearCart: () => set({ cart: { items: [], total: 0 } }),
    }),
    {
      name: 'cart-storage',
    }
  )
);