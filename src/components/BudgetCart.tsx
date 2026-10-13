import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { findSelection } from '../catalog';
export type CartItem = { productId: string; variantId: string; quantity: number };
const storageKey = 'garage-one-budget-v1';
function restore(): CartItem[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(raw)) return [];
    const result: CartItem[] = [];
    for (const value of raw.slice(0, 500)) {
      if (!value || typeof value !== 'object' || typeof value.productId !== 'string' || typeof value.variantId !== 'string' || !Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 999) continue;
      const selection = findSelection(value.productId, value.variantId);
      if (!selection || selection.variant.status === 'restock') continue;
      const duplicate = result.find(item => item.productId === value.productId && item.variantId === value.variantId);
      if (duplicate) duplicate.quantity = Math.min(999, duplicate.quantity + value.quantity);
      else result.push({ productId: value.productId, variantId: value.variantId, quantity: value.quantity });
    }
    return result;
  } catch { return []; }
}
type CartContextValue = { items: CartItem[]; count: number; storageAvailable: boolean; add: (productId: string, variantId: string) => void; update: (productId: string, variantId: string, quantity: number) => void; remove: (productId: string, variantId: string) => void };
const CartContext = createContext<CartContextValue | null>(null);
export function BudgetCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(restore);
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }, [items]);
  useEffect(() => {
    const changed = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) setItems(restore()); };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  const add = (productId: string, variantId: string) => {
    const selection = findSelection(productId, variantId);
    if (!selection || selection.variant.status === 'restock') return;
    setItems(previous => {
      const duplicate = previous.some(item => item.productId === productId && item.variantId === variantId);
      return duplicate ? previous.map(item => item.productId === productId && item.variantId === variantId ? { ...item, quantity: Math.min(999, item.quantity + 1) } : item) : [...previous, { productId, variantId, quantity: 1 }];
    });
  };
  const update = (productId: string, variantId: string, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    setItems(previous => previous.map(item => item.productId === productId && item.variantId === variantId ? { ...item, quantity: Math.min(999, Math.max(1, Math.trunc(quantity))) } : item));
  };
  const remove = (productId: string, variantId: string) => setItems(previous => previous.filter(item => item.productId !== productId || item.variantId !== variantId));
  return <CartContext.Provider value={{ items, count: items.reduce((total, item) => total + item.quantity, 0), storageAvailable, add, update, remove }}>{children}</CartContext.Provider>;
}
export function useBudgetCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('BudgetCartProvider is required');
  return context;
}
