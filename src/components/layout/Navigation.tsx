'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import { useCart } from '@/hooks/useCart';
import { useState, useEffect } from 'react';
import { Bag, List, X } from 'phosphor-react';

export function Navigation() {
  const { authenticated, login, logout, user, getAccessToken } = usePrivy();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) { setUserRole(null); return; }
    async function fetchRole() {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: '{ currentUser { role } }' }),
        });
        const data = await res.json();
        setUserRole(data.data?.currentUser?.role || null);
      } catch { }
    }
    fetchRole();
  }, [authenticated, getAccessToken]);

  return (
    <nav className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo-white.png" alt="Lucid Haus" width={60} height={30} priority className="invert-0" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/shop" className="text-sm text-white/70 hover:text-white transition-colors">Shop</Link>
          {userRole === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-opal-400 hover:text-opal-300 transition-colors">Admin</Link>
          )}
          <Link href="/cart" className="relative text-white/70 hover:text-white transition-colors">
            <Bag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white">
                {itemCount}
              </span>
            )}
          </Link>
          {authenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/orders" className="text-xs text-white/50 hover:text-white">Orders</Link>
              <button onClick={logout} className="text-xs text-white/50 hover:text-white transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={login} className="text-sm text-white/70 hover:text-white transition-colors">
              Sign In
            </button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-4 sm:hidden">
          <Link href="/cart" className="relative text-white/70">
            <Bag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
            {isMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden border-t border-white/10 px-4 py-4 space-y-3">
          <Link href="/shop" className="block text-sm text-white/70" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          {userRole === 'ADMIN' && (
            <Link href="/admin" className="block text-sm text-opal-400" onClick={() => setIsMenuOpen(false)}>Admin</Link>
          )}
          {authenticated ? (
            <>
              <Link href="/orders" className="block text-sm text-white/70" onClick={() => setIsMenuOpen(false)}>Orders</Link>
              <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block text-sm text-white/50">Sign Out</button>
            </>
          ) : (
            <button onClick={() => { login(); setIsMenuOpen(false); }} className="block text-sm text-white/70">Sign In</button>
          )}
        </div>
      )}
    </nav>
  );
}
