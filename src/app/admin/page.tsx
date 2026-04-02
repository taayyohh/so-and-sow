'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function AdminDashboard() {
  const { getAccessToken } = usePrivy();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function fetchMetrics() {
      const token = await getAccessToken();
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: '{ adminMetrics { totalOrders totalRevenue pendingOrders totalProducts } }' }),
      });
      const data = await res.json();
      setMetrics(data.data?.adminMetrics);
    }
    fetchMetrics();
  }, [getAccessToken]);

  const cards = [
    { label: 'Total Orders', value: metrics?.totalOrders ?? '-' },
    { label: 'Revenue', value: metrics?.totalRevenue != null ? `$${metrics.totalRevenue.toFixed(2)}` : '-' },
    { label: 'Pending Orders', value: metrics?.pendingOrders ?? '-' },
    { label: 'Products', value: metrics?.totalProducts ?? '-' },
  ];

  return (
    <div>
      <h1 className="text-xl font-medium mb-8 text-white">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-white/10 p-6">
            <p className="text-xs tracking-widest uppercase text-white/50 mb-2">{card.label}</p>
            <p className="text-2xl font-medium text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
