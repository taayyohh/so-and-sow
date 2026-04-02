'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    quantity: '',
    isActive: true,
  });
  const [sizes, setSizes] = useState<{ size: string; quantity: string }[]>([]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: `query($id: ID!) { product(id: $id) { id name description price category quantity isActive isArchived images stock { size quantity } } }`,
            variables: { id },
          }),
        });
        const data = await res.json();
        const product = data.data?.product;
        if (product) {
          setImages(product.images || []);
          setIsArchived(product.isArchived || false);
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: String(product.price || ''),
            category: product.category || '',
            quantity: String(product.quantity || ''),
            isActive: product.isActive,
          });
          setSizes((product.stock || []).map((s: any) => ({ size: s.size, quantity: String(s.quantity) })));
        }
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, getAccessToken]);

  const addSize = () => setSizes([...sizes, { size: '', quantity: '' }]);
  const removeSize = (i: number) => setSizes(sizes.filter((_, idx) => idx !== i));

  const inputClass = 'w-full p-3 border border-white/20 bg-[#1b1b1b] text-white text-sm focus:outline-none focus:border-white transition-colors';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const validSizes = sizes.filter(s => s.size.trim());

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) { updateProduct(id: $id, input: $input) { id } }`,
          variables: {
            id,
            input: {
              name: formData.name,
              description: formData.description,
              price: parseFloat(formData.price),
              category: formData.category,
              images,
              quantity: parseInt(formData.quantity) || 0,
              isActive: formData.isActive,
              ...(validSizes.length > 0 ? {
                sizes: validSizes.map(s => ({ size: s.size, quantity: parseInt(s.quantity) || 0 })),
              } : {}),
            },
          },
        }),
      });

      const data = await res.json();
      if (data.errors) throw new Error(data.errors[0]?.message || data.errors[0] || 'Failed to update product');
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-4 bg-white/10 w-32 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-white/10" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-sm tracking-[0.3em] uppercase font-medium mb-8 text-white">Edit Product</h1>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/30 text-red-400 text-sm mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-white/70">Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/70">Description</label>
          <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={4} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1 text-white/70">Price ($)</label>
            <input type="number" step="0.01" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/70">Quantity</label>
            <input type="number" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} required className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/70">Category</label>
          <input type="text" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className={inputClass} />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
            id="isActive"
            className="w-4 h-4"
          />
          <label htmlFor="isActive" className="text-sm text-white/70">Active (visible in store)</label>
        </div>

        <ImageUpload images={images} onChange={setImages} />

        {/* Size / Stock Management */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-white/70">Sizes &amp; Stock</label>
            <button type="button" onClick={addSize} className="text-xs text-white/50 hover:text-white transition-colors">
              + Add Size
            </button>
          </div>
          {sizes.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Size (S, M, L...)"
                value={s.size}
                onChange={e => { const ns = [...sizes]; ns[i].size = e.target.value; setSizes(ns); }}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Qty"
                value={s.quantity}
                onChange={e => { const ns = [...sizes]; ns[i].quantity = e.target.value; setSizes(ns); }}
                className={`${inputClass} w-24`}
              />
              <button type="button" onClick={() => removeSize(i)} className="text-red-400 hover:text-red-300 px-2 transition-colors">
                X
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="flex-1 py-3 bg-white text-[black] text-sm tracking-widest uppercase hover:bg-white/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="py-3 px-6 border border-white text-white text-sm tracking-widest uppercase hover:bg-white hover:text-[black] transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {/* Archive toggle */}
      <div className="border-t border-white/10 mt-10 pt-6">
        <button
          type="button"
          disabled={archiving}
          onClick={async () => {
            setArchiving(true);
            try {
              const token = await getAccessToken();
              await fetch('/api/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  query: `mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) { updateProduct(id: $id, input: $input) { id } }`,
                  variables: { id, input: { isArchived: !isArchived, isActive: isArchived } },
                }),
              });
              router.push('/admin/products');
            } catch {
              setError('Failed to update product');
            } finally {
              setArchiving(false);
            }
          }}
          className="text-sm text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          {archiving ? 'Processing...' : isArchived ? 'Unarchive Product' : 'Archive Product'}
        </button>
      </div>
    </div>
  );
}
