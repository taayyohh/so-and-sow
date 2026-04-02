'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function OrdersPage() {
  const { ready, authenticated, getAccessToken, login } = usePrivy();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) { login(); return; }
    if (!ready || !authenticated) return;

    async function fetchOrders() {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: '{ userOrders { id total status createdAt receiptUrl items { id name quantity price size } } }',
        }),
      });
      const data = await res.json();
      setOrders(data.data?.userOrders || []);
      setLoading(false);
    }
    fetchOrders();
  }, [ready, authenticated, getAccessToken, router]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 text-white/50">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-center mb-12 text-white">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-white/60 text-center py-16">No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-white/10 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/50">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className={`text-xs px-2 py-1 border border-white/20 ${
                  order.status === 'CANCELED' ? 'text-red-400 border-red-400/30' :
                  order.status === 'DELIVERED' ? 'text-green-400 border-green-400/30' :
                  order.status === 'SHIPPED' ? 'text-blue-400 border-blue-400/30' :
                  'text-white/70'
                }`}>
                  {order.status === 'CANCELED' ? 'REFUNDED' : order.status}
                </span>
              </div>
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm text-white">
                  <span>{item.name} {item.size ? `(${item.size})` : ''} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-medium text-white">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {order.status === 'CANCELED' && (
                <p className="text-xs text-white/30">A refund has been issued to your original payment method.</p>
              )}
              {order.receiptUrl && (
                <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white transition-colors">
                  View Receipt &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
