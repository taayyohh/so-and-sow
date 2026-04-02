'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const { getAccessToken } = usePrivy();
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `query($status: String) { adminOrders(status: $status) { id customerName customerEmail total status date } }`,
          variables: { status: statusFilter || null },
        }),
      });
      const data = await res.json();
      setOrders(data.data?.adminOrders || []);
    }
    fetchOrders();
  }, [getAccessToken, statusFilter]);

  const statuses = ['', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];

  return (
    <div>
      <h1 className="text-xl font-medium mb-8 text-white">Orders</h1>
      <div className="flex gap-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 border transition-colors ${statusFilter === s ? 'border-white text-white' : 'border-white/20 text-white/50 hover:text-white'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-left">
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-white/5 text-white">
                <td className="p-3">
                  <div>{o.customerName}</div>
                  <div className="text-xs text-white/50">{o.customerEmail}</div>
                </td>
                <td className="p-3">${o.total.toFixed(2)}</td>
                <td className="p-3"><span className="text-xs">{o.status}</span></td>
                <td className="p-3 text-xs text-white/50">{new Date(o.date).toLocaleDateString()}</td>
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="text-opal-400 hover:text-opal-300 text-xs">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
