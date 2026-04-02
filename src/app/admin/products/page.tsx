'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

export default function AdminProductsPage() {
  const { getAccessToken } = usePrivy();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: '{ products(status: "all") { id name slug price quantity isActive images createdAt } }',
        }),
      });
      const data = await res.json();
      setProducts(data.data?.products || []);
    }
    fetchProducts();
  }, [getAccessToken]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium text-white">Products</h1>
        <Link href="/admin/products/new" className="py-2 px-4 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90">
          New Product
        </Link>
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-white/5 text-white">
                <td className="p-3">{p.name}</td>
                <td className="p-3">${p.price.toFixed(2)}</td>
                <td className="p-3">{p.quantity}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 ${p.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="text-opal-400 hover:text-opal-300 text-xs">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
