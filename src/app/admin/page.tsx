'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { Package, Bag, TrendUp, Cube } from 'phosphor-react';

interface AdminMetrics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  date: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function AdminDashboardPage() {
  const { getAccessToken } = usePrivy();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getAccessToken();

        // Fetch metrics
        const metricsRes = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            query: `{ adminMetrics { totalOrders totalRevenue pendingOrders totalProducts } }`,
          }),
        });
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data?.adminMetrics || null);

        // Fetch recent orders
        const ordersRes = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            query: `{ adminOrders(limit: 5) { id customerName customerEmail total status date } }`,
          }),
        });
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.data?.adminOrders || []);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-4 bg-white/10 w-40 mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/10" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-sm tracking-[0.3em] uppercase font-medium mb-8 text-white">Admin Dashboard</h1>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="border border-white/10 p-4">
            <Bag size={18} className="text-white/40 mb-2" />
            <p className="text-2xl font-medium text-white">{metrics.totalOrders}</p>
            <p className="text-xs text-white/50">Total Orders</p>
          </div>
          <div className="border border-white/10 p-4">
            <TrendUp size={18} className="text-white/40 mb-2" />
            <p className="text-2xl font-medium text-white">{formatPrice(metrics.totalRevenue)}</p>
            <p className="text-xs text-white/50">Revenue</p>
          </div>
          <div className="border border-white/10 p-4">
            <Package size={18} className="text-white/40 mb-2" />
            <p className="text-2xl font-medium text-white">{metrics.pendingOrders}</p>
            <p className="text-xs text-white/50">Pending Orders</p>
          </div>
          <div className="border border-white/10 p-4">
            <Cube size={18} className="text-white/40 mb-2" />
            <p className="text-2xl font-medium text-white">{metrics.totalProducts}</p>
            <p className="text-xs text-white/50">Products</p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3 mb-10">
        <Link
          href="/admin/products"
          className="py-2 px-4 border border-white/10 text-sm text-white/80 hover:bg-white/5 transition-colors"
        >
          Manage Products
        </Link>
        <Link
          href="/admin/orders"
          className="py-2 px-4 border border-white/10 text-sm text-white/80 hover:bg-white/5 transition-colors"
        >
          Manage Orders
        </Link>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-xs tracking-widest uppercase text-white/50 mb-4">Recent Orders</h2>
        <div className="border-t border-white/10">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between py-3 border-b border-white/10 text-sm hover:bg-white/5 transition-colors px-2 -mx-2"
            >
              <div>
                <p className="font-medium text-white">{order.customerName}</p>
                <p className="text-xs text-white/50">{order.customerEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-white">{formatPrice(order.total)}</p>
                <p className="text-xs text-white/50">{order.status}</p>
              </div>
            </Link>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-sm text-white/50 py-4">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
