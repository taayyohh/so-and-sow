'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function NewProductPage() {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', quantity: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [sizes, setSizes] = useState<{ size: string; quantity: string }[]>([]);

  const addSize = () => setSizes([...sizes, { size: '', quantity: '' }]);
  const removeSize = (i: number) => setSizes(sizes.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `mutation CreateProduct($input: CreateProductInput!) { createProduct(input: $input) { id slug } }`,
          variables: {
            input: {
              name: form.name,
              description: form.description,
              price: parseFloat(form.price),
              category: form.category,
              images,
              quantity: parseInt(form.quantity) || 0,
              ...(sizes.length > 0 ? {
                sizes: sizes.filter(s => s.size).map(s => ({ size: s.size, quantity: parseInt(s.quantity) || 0 })),
              } : {}),
            },
          },
        }),
      });
      const data = await res.json();
      if (data.data?.createProduct) {
        router.push('/admin/products');
      } else {
        setError(data.errors?.[0] || 'Failed to create product');
      }
    } catch {
      setError('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full p-3 border border-white/20 bg-[#1b1b1b] text-white text-sm focus:outline-none focus:border-white transition-colors';

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium mb-8 text-white">New Product</h1>
      {error && <div className="p-4 bg-red-900/30 border border-red-500/30 mb-6"><p className="text-sm text-red-400">{error}</p></div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-1 text-white/70">Name</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/70">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-white/70">Price ($)</label>
            <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/70">Category</label>
            <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/70">Quantity (total)</label>
          <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className={inputClass} />
        </div>
        <ImageUpload images={images} onChange={setImages} />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-white/70">Sizes</label>
            <button type="button" onClick={addSize} className="text-xs text-opal-400 hover:text-opal-300">+ Add Size</button>
          </div>
          {sizes.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input placeholder="Size (S, M, L...)" value={s.size} onChange={e => { const ns = [...sizes]; ns[i].size = e.target.value; setSizes(ns); }} className={inputClass} />
              <input type="number" placeholder="Qty" value={s.quantity} onChange={e => { const ns = [...sizes]; ns[i].quantity = e.target.value; setSizes(ns); }} className={`${inputClass} w-24`} />
              <button type="button" onClick={() => removeSize(i)} className="text-red-400 px-2">X</button>
            </div>
          ))}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-white text-[#131313] text-sm tracking-widest uppercase hover:bg-white/90 disabled:opacity-50">
          {isSubmitting ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
