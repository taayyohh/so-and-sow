'use client';

import { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { usePrivy } from '@privy-io/react-auth';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string;
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    quantity: number;
  };
}

export interface Cart {
  id?: string;
  items: CartItem[];
  total: number;
}

interface LocalCartItem {
  productId: string;
  quantity: number;
  price: number;
  size?: string;
  productName?: string;
  productImage?: string;
}

const CART_STORAGE_KEY = 'so_and_sow_cart';

export function useCart() {
  const { authenticated, ready } = usePrivy();
  const [localCart, setLocalCart] = useLocalStorage<LocalCartItem[]>(CART_STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = useCallback((productId: string, quantity: number, price: number, product: any, size?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setLocalCart(prev => {
        const key = size ? `${productId}-${size}` : productId;
        const existing = prev.find(item => size ? (item.productId === productId && item.size === size) : item.productId === productId);
        if (existing) {
          return prev.map(item =>
            (size ? (item.productId === productId && item.size === size) : item.productId === productId)
              ? { ...item, quantity: item.quantity + quantity, productName: product?.name || item.productName, productImage: product?.images?.[0] || item.productImage }
              : item
          );
        }
        return [...prev, {
          productId,
          quantity,
          price,
          size,
          productName: product?.name || 'Product',
          productImage: product?.images?.[0] || '',
        }];
      });
    } catch {
      setError('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  }, [setLocalCart]);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setLocalCart(prev => prev.filter(item => size ? !(item.productId === productId && item.size === size) : item.productId !== productId));
  }, [setLocalCart]);

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setLocalCart(prev =>
      prev.map(item =>
        (size ? (item.productId === productId && item.size === size) : item.productId === productId)
          ? { ...item, quantity }
          : item
      )
    );
  }, [setLocalCart, removeFromCart]);

  const clearCart = useCallback(() => {
    setLocalCart([]);
  }, [setLocalCart]);

  const cart = useMemo((): Cart => {
    const total = localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      items: localCart.map(item => ({
        id: item.size ? `${item.productId}-${item.size}` : item.productId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        product: {
          id: item.productId,
          name: item.productName || 'Product',
          images: item.productImage ? [item.productImage] : [],
          price: item.price,
          quantity: 999
        }
      })),
      total
    };
  }, [localCart]);

  const itemCount = useMemo(() => {
    return localCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [localCart]);

  return {
    cart,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isLoading,
    error,
    isAuthenticated: authenticated && ready
  };
}
