'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const views = [
  {
    href: '/dashboard/operations',
    label: 'Simple',
    hint: 'Mas madaling araw-araw',
    isActive: (pathname: string) => pathname.startsWith('/dashboard/operations'),
  },
  {
    href: '/dashboard/sms-feed',
    label: 'Detalyado',
    hint: 'Mas maraming tools',
    isActive: (pathname: string) => pathname.startsWith('/dashboard/sms-feed'),
  },
] as const;

export function ViewModeSwitcher() {
  const pathname = usePathname();

  if (
    pathname.startsWith('/dashboard/developer') ||
    pathname.startsWith('/dashboard/disaster')
  ) {
    return null;
  }

  return (
    <div className="hidden items-center gap-1 rounded-full border bg-muted/60 p-1 lg:flex">
      {views.map((view) => {
        const active = view.isActive(pathname);

        return (
          <Link
            key={view.href}
            href={view.href}
            className={cn(
              'rounded-full px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-background font-semibold text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            )}
          >
            <span className="block leading-none">{view.label}</span>
            <span className="mt-1 block text-[11px] leading-none text-muted-foreground">
              {view.hint}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
