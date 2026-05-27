'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Landmark, ScrollText } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Treasury', href: '/treasury', icon: Landmark },
  { label: 'Decisions', href: '/decisions', icon: ScrollText },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 glass border-t border-[--color-border] pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 transition-colors"
            >
              <Icon
                size={22}
                className={isActive ? 'text-[--color-agent-ceo-light]' : 'text-[--color-muted-foreground]'}
              />
              <span
                className={`text-[10px] ${
                  isActive ? 'text-[--color-agent-ceo-light] font-medium' : 'text-[--color-muted-foreground]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
