'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Package, Bag } from 'phosphor-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: House },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: Bag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen bg-[#131313]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/10 p-6 hidden md:block">
        <Link href="/admin" className="block mb-8">
          <h2 className="text-xs tracking-[0.3em] uppercase text-white/50 font-medium">Admin</h2>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-2.5 px-3 text-sm transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} weight={active ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131313] border-t border-white/10 flex z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-[10px] transition-colors ${
                active ? 'text-white' : 'text-white/40'
              }`}
            >
              <Icon size={18} weight={active ? 'fill' : 'regular'} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0">{children}</main>
    </div>
  );
}
