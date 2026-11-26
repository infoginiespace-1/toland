'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  sku: string;
  size: string;
  fit: string;
  wash: string;
  price: number;
  mrp: number;
  image: string;
  qty: number;
  stockQty: number;
}

export interface CouponDiscount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  coupon: CouponDiscount | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'toland_cart_items_v1';
const COUPON_STORAGE_KEY = 'toland_coupon_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponDiscount | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(CART_STORAGE_KEY);
      if (savedItems) setItems(JSON.parse(savedItems));

      const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
    } catch (e) {
      console.error('Error loading cart from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to storage', e);
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error saving coupon to storage', e);
    }
  }, [coupon, isLoaded]);

  const addToCart = (item: Omit<CartItem, 'qty'>, qty: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === item.variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].qty + qty, item.stockQty || 99);
        updated[existingIndex] = { ...updated[existingIndex], qty: newQty };
        return updated;
      }
      return [...prev, { ...item, qty: Math.min(qty, item.stockQty || 99) }];
    });
  };

  const updateQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, qty: Math.min(qty, i.stockQty || 99) }
          : i
      )
    );
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

  // Free shipping threshold ₹999; ₹99 otherwise
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 99;

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else {
      discount = Math.min(coupon.value, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discount + shipping);
  const itemCount = items.reduce((acc, i) => acc + i.qty, 0);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a coupon code' };

    if (cleanCode === 'TOLAND10') {
      if (subtotal < 999) {
        return { success: false, message: 'Minimum order amount for TOLAND10 is ₹999' };
      }
      setCoupon({
        code: 'TOLAND10',
        type: 'percentage',
        value: 10,
        discountAmount: Math.round((subtotal * 10) / 100),
      });
      return { success: true, message: 'Coupon TOLAND10 applied: 10% Discount!' };
    }

    if (cleanCode === 'FLAT200') {
      if (subtotal < 1499) {
        return { success: false, message: 'Minimum order amount for FLAT200 is ₹1,499' };
      }
      setCoupon({
        code: 'FLAT200',
        type: 'fixed',
        value: 200,
        discountAmount: 200,
      });
      return { success: true, message: 'Coupon FLAT200 applied: ₹200 OFF!' };
    }

    return { success: false, message: 'Invalid or expired coupon code' };
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        coupon,
        applyCoupon,
        removeCoupon,
        itemCount,
        subtotal,
        discount,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
