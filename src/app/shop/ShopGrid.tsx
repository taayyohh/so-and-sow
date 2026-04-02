'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ipfsUrl } from '@/lib/ipfs';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  quantity: number;
}

export function ShopGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
      {products.map((product) => (
        <ShopProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ShopProductCard({ product }: { product: Product }) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  const imgSrc = product.images[0] ? ipfsUrl(product.images[0]) : '';

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-[#1b1b1b] mb-4">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#1b1b1b]" />
        )}
        {product.quantity <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium tracking-wide text-white">{product.name}</h3>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-white/80">{formattedPrice}</span>
          <span className="text-xs tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">
            shop
          </span>
        </div>
      </div>
    </Link>
  );
}
