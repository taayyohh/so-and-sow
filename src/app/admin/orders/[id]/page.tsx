'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ipfsUrl } from '@/lib/ipfs';

interface OrderDetail {
  id: string;
  total: number;
  status: string;
  shippingAmount: number;
  taxAmount: number;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  stripeSessionId: string | null;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    size: string | null;
    product: {
      id: string;
      name: string;
      images: string[];
      price: number;
    } | null;
  }[];
}

const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function statusColor(status: string) {
  switch (status) {
    case 'DELIVERED': return 'text-green-400';
    case 'SHIPPED': return 'text-blue-400';
    case 'PROCESSING': return 'text-blue-400';
    case 'PENDING': return 'text-yellow-400';
    case 'CANCELED': return 'text-red-400';
    default: return 'text-white/60';
  }
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function fetchOrder() {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query AdminOrder($orderId: String!) {
            adminOrder(orderId: $orderId) {
              id
              total
              status
              shippingAmount
              taxAmount
              trackingNumber
              createdAt
              updatedAt
              stripeSessionId
              shippingAddress
              user { id email firstName lastName }
              items {
                id
                name
                quantity
                price
                size
                product { id name images price }
              }
            }
          }`,
          variables: { orderId: id },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.data?.adminOrder || null);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
  }, [id, getAccessToken]);

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdating(true);
    setMessage(null);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
            updateOrderStatus(orderId: $orderId, status: $status) { id status }
          }`,
          variables: { orderId: order.id, status: newStatus },
        }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Order updated to ${newStatus}.` });
        await fetchOrder();
      } else {
        setMessage({ type: 'error', text: 'Failed to update order status.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-4 bg-white/10 w-48 mb-8" />
        <div className="space-y-4">
          <div className="h-32 bg-white/10" />
          <div className="h-48 bg-white/10" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-sm text-white/60 mb-4">Order not found.</p>
        <button onClick={() => router.back()} className="text-sm text-white/50 underline hover:no-underline">Go back</button>
      </div>
    );
  }

  const customerName = order.user
    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email
    : 'Unknown';

  const addr = order.shippingAddress as any;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <button
        onClick={() => router.push('/admin/orders')}
        className="text-sm text-white/60 hover:text-white transition-colors mb-8"
      >
        &larr; Back to Orders
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-white">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-xs text-white/50 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-medium ${statusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {message && (
        <div className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-400' : 'bg-red-900/30 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Status Update */}
      <div className="border border-white/10 p-4 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50 mb-3">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating || order.status === s}
              className={`py-1.5 px-4 text-xs tracking-wide transition-colors disabled:opacity-40 ${
                order.status === s
                  ? 'bg-white text-[black]'
                  : 'border border-white/10 text-white/50 hover:bg-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Info */}
      <div className="border border-white/10 p-6 space-y-3 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50">Customer</p>
        <div className="text-sm space-y-1">
          <p className="font-medium text-white">{customerName}</p>
          {order.user && <p className="text-white/60">{order.user.email}</p>}
          {order.user && <p className="text-white/40 text-xs">ID: {order.user.id}</p>}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border border-white/10 p-6 space-y-3 mb-6">
        <p className="text-xs tracking-widest uppercase text-white/50">Order Details</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-white/60">Order ID</span>
          <span className="text-xs font-mono text-white/80">{order.id}</span>
          <span className="text-white/60">Created</span>
          <span className="text-white">{formatDate(order.createdAt)}</span>
          <span className="text-white/60">Updated</span>
          <span className="text-white">{formatDate(order.updatedAt)}</span>
          {order.stripeSessionId && (
            <>
              <span className="text-white/60">Stripe Session</span>
              <span className="text-xs font-mono text-white/80 truncate">{order.stripeSessionId}</span>
            </>
          )}
          {order.trackingNumber && (
            <>
              <span className="text-white/60">Tracking</span>
              <span className="text-xs font-mono text-white/80">{order.trackingNumber}</span>
            </>
          )}
          <span className="text-white/60">Subtotal</span>
          <span className="text-white">{formatPrice(order.total - (order.shippingAmount || 0) - (order.taxAmount || 0))}</span>
          <span className="text-white/60">Shipping</span>
          <span className="text-white">{formatPrice(order.shippingAmount || 0)}</span>
          <span className="text-white/60">Tax</span>
          <span className="text-white">{formatPrice(order.taxAmount || 0)}</span>
          <span className="text-white/60">Total</span>
          <span className="font-medium text-white">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Shipping */}
      {addr && (
        <div className="border border-white/10 p-6 space-y-3 mb-6">
          <p className="text-xs tracking-widest uppercase text-white/50">Shipping Address</p>
          <div className="text-sm text-white/70 space-y-1">
            <p>{addr.street}</p>
            <p>{addr.city}, {addr.state} {addr.zipCode}</p>
            <p>{addr.country}</p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="border border-white/10 p-6">
        <p className="text-xs tracking-widest uppercase text-white/50 mb-4">
          Items ({order.items.length})
        </p>
        <div className="border-t border-white/10">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 border-b border-white/10 last:border-b-0">
              <div className="w-16 h-16 bg-[#1b1b1b] flex-shrink-0 overflow-hidden">
                {item.product?.images?.[0] && (
                  <img
                    src={ipfsUrl(item.product.images[0])}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-white/50 mt-1">
                  {formatPrice(item.price)} x {item.quantity}
                  {item.size && <span className="ml-2">({item.size})</span>}
                </p>
              </div>
              <p className="text-sm font-medium text-white">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4 text-sm font-medium text-white">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
