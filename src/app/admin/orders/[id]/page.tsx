'use client';

import { useState, useEffect, use } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getAccessToken } = usePrivy();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `query($orderId: String!) { adminOrder(orderId: $orderId) { id total status shippingAmount taxAmount shippingAddress trackingNumber createdAt user { email firstName lastName } items { id name quantity price size } } }`,
          variables: { orderId: id },
        }),
      });
      const data = await res.json();
      setOrder(data.data?.adminOrder);
      setLoading(false);
    }
    fetchOrder();
  }, [id, getAccessToken]);

  const updateStatus = async (status: string) => {
    const token = await getAccessToken();
    await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `mutation($orderId: ID!, $status: String!) { updateOrderStatus(orderId: $orderId, status: $status) { id status } }`,
        variables: { orderId: id, status },
      }),
    });
    setOrder((prev: any) => prev ? { ...prev, status } : null);
  };

  if (loading) return <div className="text-white/50 py-12">Loading...</div>;
  if (!order) return <div className="text-white/50 py-12">Order not found.</div>;

  const addr = order.shippingAddress as any;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium mb-8 text-white">Order Details</h1>
      <div className="space-y-6">
        <div className="border border-white/10 p-6 space-y-3">
          <p className="text-xs tracking-widest uppercase text-white/50">Order Info</p>
          <p className="text-sm text-white">Status: {order.status}</p>
          <p className="text-sm text-white">Total: ${order.total.toFixed(2)}</p>
          <p className="text-sm text-white">Shipping: ${order.shippingAmount?.toFixed(2)}</p>
          <p className="text-sm text-white">Tax: ${order.taxAmount?.toFixed(2)}</p>
          <p className="text-sm text-white">Date: {new Date(order.createdAt).toLocaleString()}</p>
          {order.user && <p className="text-sm text-white">Customer: {order.user.firstName} {order.user.lastName} ({order.user.email})</p>}
        </div>

        {addr && (
          <div className="border border-white/10 p-6 space-y-2">
            <p className="text-xs tracking-widest uppercase text-white/50">Shipping Address</p>
            <p className="text-sm text-white">{addr.street}</p>
            <p className="text-sm text-white">{addr.city}, {addr.state} {addr.zipCode}</p>
            <p className="text-sm text-white">{addr.country}</p>
          </div>
        )}

        <div className="border border-white/10 p-6">
          <p className="text-xs tracking-widest uppercase text-white/50 mb-4">Items</p>
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between py-2 border-b border-white/5 text-sm text-white">
              <div>
                <span>{item.name}</span>
                {item.size && <span className="text-white/50 ml-2">({item.size})</span>}
                <span className="text-white/50 ml-2">x{item.quantity}</span>
              </div>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border border-white/10 p-6">
          <p className="text-xs tracking-widest uppercase text-white/50 mb-4">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={order.status === s}
                className={`text-xs px-3 py-1.5 border transition-colors ${order.status === s ? 'border-white text-white bg-white/10' : 'border-white/20 text-white/50 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
