'use client';

import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { ipfsUrl } from '@/lib/ipfs';
import Link from 'next/link';
import { Minus, Plus, X } from 'phosphor-react';

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function CartPage() {
  const router = useRouter();
  const { authenticated, login } = usePrivy();
  const { cart, removeFromCart, updateQuantity, clearCart, isLoading } = useCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h1 className="text-sm tracking-[0.3em] uppercase font-medium mb-6 text-white">Your Cart</h1>
        <p className="text-sm text-white/60 mb-8">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-block py-3 px-8 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors"
        >
          Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-white">Your Cart</h1>
        <button onClick={clearCart} className="text-xs text-white/50 hover:text-white transition-colors">
          Clear Cart
        </button>
      </div>

      <div className="space-y-0 border-t border-white/10">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 py-6 border-b border-white/10">
            <div className="relative w-20 h-20 bg-[#1b1b1b] flex-shrink-0 overflow-hidden">
              {item.product.images[0] && (
                <Image
                  src={ipfsUrl(item.product.images[0])}
                  alt={item.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium truncate pr-4 text-white">{item.product.name}</h3>
                  {item.size && <p className="text-xs text-white/50 mt-0.5">Size: {item.size}</p>}
                </div>
                <button
                  onClick={() => removeFromCart(item.productId, item.size)}
                  className="text-white/40 hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-white/60 mt-1">{formatPrice(item.price)}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-white/20">
                  <button
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.size)}
                    className="p-2 hover:bg-white/10 transition-colors text-white"
                    disabled={isLoading}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs min-w-[32px] text-center text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                    className="p-2 hover:bg-white/10 transition-colors text-white"
                    disabled={isLoading}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-sm ml-auto text-white">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center py-6 border-b border-white/10">
        <span className="text-sm font-medium text-white">Total</span>
        <span className="text-sm font-medium text-white">{formatPrice(cart.total)}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/shop"
          className="flex-1 py-3 text-center text-sm tracking-widest uppercase border border-white text-white hover:bg-white hover:text-[#131313] transition-colors"
        >
          Continue Shopping
        </Link>
        <button
          onClick={() => authenticated ? router.push('/checkout') : login()}
          disabled={isLoading}
          className="flex-1 py-3 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
