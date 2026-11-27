'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  image?: string;
  category?: string;
  fit?: string;
  wash?: string;
  weight?: string;
  stretch?: string;
  fabric?: string;
}

interface CompareContextType {
  items: CompareProduct[];
  addToCompare: (product: CompareProduct) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompared: (productId: string) => boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('toland_compare');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse compare list from localStorage', e);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('toland_compare', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save compare list to localStorage', e);
      }
    }
  }, [items, isMounted]);

  const addToCompare = (product: CompareProduct): boolean => {
    if (items.some((i) => i.id === product.id)) {
      removeFromCompare(product.id);
      return false;
    }

    if (items.length >= 3) {
      alert('You can compare up to 3 denims side by side.');
      return false;
    }

    setItems((prev) => [...prev, product]);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  const clearCompare = () => {
    setItems([]);
  };

  const isCompared = (productId: string) => {
    return items.some((i) => i.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        items,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isCompared,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
