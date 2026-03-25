'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/medicines', label: 'Medicines', icon: '💊' },
  { href: '/billing/new', label: 'New Bill', icon: '🧾' },
  { href: '/bills', label: 'Bills', icon: '📋' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-primary flex flex-col shadow-lg">
      <div className="px-4 py-5 border-b border-primary-dark">
        <h1 className="text-white font-bold text-lg tracking-wide">PharmaBill</h1>
        <p className="text-primary-light text-xs mt-0.5 opacity-75">Pharmacy Management</p>
      </div>
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(item => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
