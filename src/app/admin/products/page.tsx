'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { Plus, PencilSimple } from 'phosphor-react';
import { ipfsUrl } from '@/lib/ipfs';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  quantity: number;
  isActive: boolean;
  isArchived: boolean;
  category: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function AdminProductsPage() {
  const { getAccessToken } = usePrivy();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  async function fetchProducts() {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query($status: String) { products(status: $status) { id name slug images price quantity isActive isArchived category } }`,
          variables: { status: 'all' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data?.products || []);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = showArchived
    ? products.filter(p => p.isArchived)
    : products.filter(p => !p.isArchived);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-4 bg-white/10 w-40 mb-10" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/10 mb-4" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-white">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 py-2 px-4 bg-white text-[black] text-xs tracking-widest uppercase hover:bg-white/90 transition-colors"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowArchived(false)}
          className={`py-1.5 px-3 text-xs tracking-wide transition-colors ${
            !showArchived ? 'bg-white text-[black]' : 'border border-white/10 text-white/50 hover:bg-white/5'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`py-1.5 px-3 text-xs tracking-wide transition-colors ${
            showArchived ? 'bg-white text-[black]' : 'border border-white/10 text-white/50 hover:bg-white/5'
          }`}
        >
          Archived
        </button>
      </div>

      <div className="border-t border-white/10">
        {filtered.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="flex items-center gap-4 py-4 border-b border-white/10 hover:bg-white/5 transition-colors px-2 -mx-2"
          >
            <div className="w-14 h-14 bg-[#1b1b1b] flex-shrink-0 overflow-hidden">
              {product.images?.[0] && (
                <img
                  src={ipfsUrl(product.images[0])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{product.name}</p>
              <p className="text-xs text-white/50">
                {formatPrice(product.price)} &middot; {product.quantity} in stock
                {product.isArchived && <span className="text-white/40 ml-2">&middot; Archived</span>}
              </p>
            </div>
            <PencilSimple size={14} className="text-white/30 flex-shrink-0" />
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-white/50 py-6 text-center">
            {showArchived ? 'No archived products.' : 'No products yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
