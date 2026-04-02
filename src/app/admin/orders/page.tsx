'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  date: string;
  items: { id: string; productName: string; quantity: number; price: number; size: string | null }[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statuses = ['all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];

export default function AdminOrdersPage() {
  const { getAccessToken } = usePrivy();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  async function fetchOrders() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query($status: String, $limit: Int) { adminOrders(status: $status, limit: $limit) { id customerName customerEmail total status date items { id productName quantity price size } } }`,
          variables: {
            status: statusFilter === 'all' ? null : statusFilter,
            limit: 50,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data?.adminOrders || []);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-sm tracking-[0.3em] uppercase font-medium mb-8 text-white">Manage Orders</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`py-1.5 px-3 text-xs tracking-wide transition-colors ${
              statusFilter === s
                ? 'bg-white text-[#131313]'
                : 'border border-white/10 text-white/50 hover:bg-white/5'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-white/10" />)}
        </div>
      ) : (
        <div className="border-t border-white/10">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="block py-4 border-b border-white/10 hover:bg-white/5 transition-colors px-2 -mx-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{formatDate(order.date)}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {order.items?.map(item => `${item.productName}${item.size ? ` (${item.size})` : ''} x${item.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatPrice(order.total)}</p>
                  <p className="text-xs text-white/50 mt-1">{order.status}</p>
                </div>
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-white/50 py-6 text-center">No orders found.</p>
          )}
        </div>
      )}
    </div>
  );
}
