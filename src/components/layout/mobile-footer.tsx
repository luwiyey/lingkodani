'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Users, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/sms-feed', label: 'Live SMS', icon: MessageSquare },
  { href: '/dashboard/farmers', label: 'Magsasaka', icon: Users },
  { href: '/dashboard/active-issues', label: 'Mga Alerto', icon: ShieldAlert },
];

export function MobileFooter() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 block border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center p-1 text-muted-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="mb-1 h-5 w-5" />
              <span className="text-center text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
