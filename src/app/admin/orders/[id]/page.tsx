'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ipfsUrl } from '@/lib/ipfs';

const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];
function formatPrice(p: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function statusColor(s: string) { return s === 'DELIVERED' ? 'text-green-400' : s === 'SHIPPED' ? 'text-blue-400' : s === 'PROCESSING' ? 'text-blue-400' : s === 'PENDING' ? 'text-yellow-400' : s === 'CANCELED' ? 'text-red-400' : 'text-white/60'; }

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  async function fetchOrder() {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `query($orderId: String!) { adminOrder(orderId: $orderId) { id total status shippingAmount taxAmount trackingNumber notes createdAt updatedAt stripeSessionId shippingAddress user { id email firstName lastName } items { id name quantity price size shipmentStatus trackingNumber product { id name images price } } } }`,
          variables: { orderId: id },
        }),
      });
      if (res.ok) { const data = await res.json(); const o = data.data?.adminOrder; setOrder(o || null); if (o) { setTrackingInput(o.trackingNumber || ''); setNotesInput(o.notes || ''); } }
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { fetchOrder(); }, [id, getAccessToken]);

  async function gql(query: string, variables: any) {
    setUpdating(true); setMessage(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ query, variables }) });
      if (res.ok) { setMessage({ type: 'success', text: 'Saved.' }); await fetchOrder(); }
      else setMessage({ type: 'error', text: 'Failed.' });
    } catch { setMessage({ type: 'error', text: 'Error.' }); } finally { setUpdating(false); }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse"><div className="h-4 bg-white/10 w-48 mb-8" /><div className="space-y-4"><div className="h-32 bg-white/10" /><div className="h-48 bg-white/10" /></div></div>;
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><p className="text-sm text-white/60 mb-4">Order not found.</p></div>;

  const addr = order.shippingAddress as any;
  const customerName = addr?.firstName && addr?.lastName ? `${addr.firstName} ${addr.lastName}` : order.user?.firstName && order.user?.lastName ? `${order.user.firstName} ${order.user.lastName}` : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <button onClick={() => router.push('/admin/orders')} className="text-sm text-white/60 hover:text-white mb-8">&larr; Back to Orders</button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-white">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-xs text-white/50 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-medium ${statusColor(order.status)}`}>{order.status}</span>
      </div>

      {message && <div className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-400' : 'bg-red-900/30 border border-red-500/30 text-red-400'}`}>{message.text}</div>}

      {/* Status */}
      <div className="border border-white/10 p-4 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50 mb-3">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => <button key={s} onClick={() => gql(`mutation($orderId: ID!, $status: String!) { updateOrderStatus(orderId: $orderId, status: $status) { id } }`, { orderId: order.id, status: s })} disabled={updating || order.status === s} className={`py-1.5 px-4 text-xs tracking-wide transition-colors disabled:opacity-40 ${order.status === s ? 'bg-white text-black' : 'border border-white/10 text-white/50 hover:bg-white/5'}`}>{s}</button>)}
        </div>
      </div>

      {/* Tracking */}
      <div className="border border-white/10 p-4 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50 mb-3">Tracking Number</p>
        <div className="flex gap-2">
          <input type="text" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="Enter tracking number..." className="flex-1 p-2 bg-[#1b1b1b] border border-white/20 text-white text-sm focus:outline-none focus:border-white" />
          <button onClick={() => gql(`mutation($orderId: String!, $trackingNumber: String!) { updateOrderTracking(orderId: $orderId, trackingNumber: $trackingNumber) { id } }`, { orderId: order.id, trackingNumber: trackingInput })} disabled={updating} className="px-4 py-2 bg-white text-black text-xs uppercase hover:bg-white/90 disabled:opacity-50">Save</button>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-white/10 p-4 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50 mb-2">Notes</p>
        <p className="text-xs text-white/30 mb-2">e.g. &quot;Hat shipped 5/20, vinyl ships when available&quot;</p>
        <div className="flex gap-2">
          <textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder="Internal notes..." rows={2} className="flex-1 p-2 bg-[#1b1b1b] border border-white/20 text-white text-sm focus:outline-none focus:border-white" />
          <button onClick={() => gql(`mutation($orderId: String!, $notes: String!) { updateOrderNotes(orderId: $orderId, notes: $notes) { id } }`, { orderId: order.id, notes: notesInput })} disabled={updating} className="px-4 py-2 bg-white text-black text-xs uppercase hover:bg-white/90 disabled:opacity-50 self-end">Save</button>
        </div>
      </div>

      {/* Customer */}
      <div className="border border-white/10 p-6 space-y-2 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50">Customer</p>
        {customerName && <p className="text-sm font-medium text-white">{customerName}</p>}
        {order.user && <p className="text-sm text-white/60">{order.user.email}</p>}
      </div>

      {/* Shipping */}
      {addr && (
        <div className="border border-white/10 p-6 space-y-2 mb-6">
          <p className="text-xs tracking-widest uppercase text-white/50">Ship To</p>
          {customerName && <p className="text-sm text-white font-medium">{customerName}</p>}
          <p className="text-sm text-white/70">{addr.street}</p>
          <p className="text-sm text-white/70">{addr.city}, {addr.state} {addr.zipCode}</p>
          <p className="text-sm text-white/70">{addr.country}</p>
        </div>
      )}

      {/* Items */}
      <div className="border border-white/10 p-6">
        <p className="text-xs tracking-widest uppercase text-white/50 mb-4">Items ({order.items.length})</p>
        <div className="border-t border-white/10">
          {order.items.map((item: any) => (
            <div key={item.id} className="py-4 border-b border-white/10 last:border-b-0">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-[#1b1b1b] flex-shrink-0 overflow-hidden">
                  {item.product?.images?.[0] && <img src={ipfsUrl(item.product.images[0])} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-white/50 mt-1">{formatPrice(item.price)} x {item.quantity}{item.size && <span className="ml-2">({item.size})</span>}</p>
                </div>
                <p className="text-sm font-medium text-white">{formatPrice(item.price * item.quantity)}</p>
              </div>
              {/* Per-item status + tracking */}
              <div className="mt-3 ml-20 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'].map((s: string) => (
                    <button key={s} onClick={() => gql(`mutation($itemId: String!, $shipmentStatus: String!) { updateItemShipment(itemId: $itemId, shipmentStatus: $shipmentStatus) { id shipmentStatus } }`, { itemId: item.id, shipmentStatus: s })} disabled={updating || (item.shipmentStatus || 'PENDING') === s} className={`py-1 px-3 text-xs tracking-wide transition-colors disabled:opacity-40 ${(item.shipmentStatus || 'PENDING') === s ? 'bg-white text-black' : 'border border-white/10 text-white/50 hover:bg-white/5'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={item.trackingNumber || ''}
                    placeholder="Enter tracking number..."
                    id={`tracking-${item.id}`}
                    className="flex-1 p-2 bg-[#1b1b1b] border border-white/20 text-white text-xs focus:outline-none focus:border-white"
                  />
                  <button
                    onClick={() => {
                      const val = (document.getElementById(`tracking-${item.id}`) as HTMLInputElement)?.value || '';
                      gql(`mutation($itemId: String!, $shipmentStatus: String!, $trackingNumber: String) { updateItemShipment(itemId: $itemId, shipmentStatus: $shipmentStatus, trackingNumber: $trackingNumber) { id } }`, { itemId: item.id, shipmentStatus: item.shipmentStatus || 'PENDING', trackingNumber: val });
                    }}
                    disabled={updating}
                    className="px-4 py-2 bg-white text-black text-xs uppercase hover:bg-white/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-y-1 pt-4 text-sm">
          <span className="text-white/60">Subtotal</span><span className="text-right text-white">{formatPrice(order.total - (order.shippingAmount || 0))}</span>
          <span className="text-white/60">Shipping</span><span className="text-right text-white">{formatPrice(order.shippingAmount || 0)}</span>
          <span className="text-white/60 font-medium pt-2">Total</span><span className="text-right text-white font-medium pt-2">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
