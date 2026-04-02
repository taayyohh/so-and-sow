'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { ipfsUrl } from '@/lib/ipfs';
import { Minus, Plus, Bag } from 'phosphor-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  quantity: number;
  stock: { size: string; quantity: number }[];
}

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.stock.length > 0 ? product.stock[0].size : undefined
  );
  const [activeImage, setActiveImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  const totalStock = product.stock.length > 0
    ? product.stock.reduce((sum, s) => sum + s.quantity, 0)
    : product.quantity;

  const selectedStock = selectedSize
    ? product.stock.find(s => s.size === selectedSize)?.quantity ?? 0
    : product.quantity;

  const isSoldOut = totalStock <= 0;

  const handleAddToCart = () => {
    if (isAdding || isSoldOut) return;
    if (product.stock.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    setIsAdding(true);
    try {
      addToCart(product.id, quantity, product.price, {
        name: product.name,
        images: product.images,
      }, selectedSize);
      toast.success('Added to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        onClick={() => router.back()}
        className="text-sm text-white/60 hover:text-white transition-colors mb-8"
      >
        &larr; Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-[#1b1b1b] overflow-hidden">
            {product.images[activeImage] && (
              <Image
                src={ipfsUrl(product.images[activeImage])}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square bg-[#1b1b1b] overflow-hidden ring-offset-2 ring-offset-[#131313] ${activeImage === i ? 'ring-1 ring-white' : 'opacity-70 hover:opacity-100'} transition-opacity`}
                >
                  <Image
                    src={ipfsUrl(img)}
                    alt={`${product.name} - ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 25vw, 12vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-wide mb-2 text-white">{product.name}</h1>
          </div>

          <p className="text-lg text-white">{formattedPrice}</p>

          {product.description && (
            <div className="text-sm leading-relaxed text-white/80 space-y-4">
              {product.description.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {/* Size Selector */}
          {product.stock.length > 0 && (
            <div>
              <p className="text-xs tracking-widest uppercase text-white/50 mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.stock.map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setSelectedSize(s.size)}
                    disabled={s.quantity <= 0}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      selectedSize === s.size
                        ? 'border-white bg-white text-[#131313]'
                        : s.quantity <= 0
                        ? 'border-white/10 text-white/30 cursor-not-allowed'
                        : 'border-white/20 text-white hover:border-white/50'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-white/20">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-white/10 transition-colors text-white"
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 text-sm min-w-[40px] text-center text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-white/10 transition-colors text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdding || isSoldOut}
              className="w-full py-3 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Bag size={16} />
              {isSoldOut ? 'Sold Out' : isAdding ? 'Adding...' : 'Add to Cart'}
            </button>

            {selectedStock <= 10 && selectedStock > 0 && (
              <p className="text-xs text-red-400">Only {selectedStock} left in stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
