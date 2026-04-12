'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/',            label: 'Dashboard',      icon: '🏠' },
  { href: '/medicines',   label: 'Item Master',    icon: '💊' },
  { href: '/purchases',   label: 'Purchases',      icon: '📦' },
  { href: '/suppliers',   label: 'Supplier',       icon: '🏭' },
  { href: '/returns',     label: 'Returns',        icon: '↩️' },
  { href: '/billing/new', label: 'New Bill',       icon: '🧾' },
  { href: '/bills',       label: 'Bills',          icon: '📋' },
  { href: '/reports',     label: 'Reports',        icon: '📊' },
  { href: '/settings',    label: 'Settings',       icon: '⚙️' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === '/login') return null;

  const handleLogout = () => {
    setLoggingOut(true);
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-14' : 'w-64'
      } h-full bg-blue-700 flex flex-col shrink-0 transition-all duration-200 overflow-y-auto`}
    >
      {/* Collapse toggle */}
      <div className="border-b border-blue-600 px-3 py-3">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center gap-2 text-white/70 hover:text-white transition-colors p-1 rounded w-full ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && <span className="text-sm font-medium">Menu</span>}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 shrink-0 ${collapsed ? 'rotate-180' : ''}`}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <polyline points="15 9 12 12 15 15" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-white/80 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-blue-600">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
            collapsed ? 'justify-center px-0' : 'justify-center px-3'
          }`}
        >
          <span>🚪</span>
          {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>}
        </button>
      </div>
    </aside>
  );
}
