'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ShieldAlert,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/sms-feed', label: 'Live SMS', icon: MessageSquare },
  {
    href: '/dashboard/farmers',
    label: 'Magsasaka',
    icon: Users,
    subItems: [
      { title: 'Database', href: '/dashboard/farmers' },
      { title: 'Pag-apruba', href: '/dashboard/farmers/approvals' },
      { title: 'Pagpaparehistro', href: '/dashboard/farmers/register' },
      { title: 'Aktibong Sakahan', href: '/dashboard/active-farms' },
      { title: 'Pangkalahatang-ideya', href: '/dashboard/oversight' },
    ],
  },
  {
    href: '/dashboard/active-issues',
    label: 'Mga Alerto',
    icon: ShieldAlert,
    subItems: [
      { title: 'Mga Aktibong Isyu', href: '/dashboard/active-issues' },
      { title: 'Pamamahala ng Alerto', href: '/dashboard/alerts' },
    ],
  },
];

export function MobileFooter() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 block border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href
            ? item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href)
            : false;

          if (item.subItems) {
            return (
              <Sheet key={item.label}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      'flex h-full w-full flex-col items-center justify-center p-1 text-muted-foreground',
                      isActive && 'text-primary'
                    )}
                  >
                    <item.icon className="mb-1 h-5 w-5" />
                    <span className="flex items-center text-center text-[10px] font-medium leading-tight">
                      {item.label}
                      <ChevronUp className="ml-0.5 h-3 w-3" />
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader className="text-left">
                    <SheetTitle>{item.label}</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 py-4">
                    {item.subItems.map((subItem) => (
                      <SheetClose asChild key={subItem.href}>
                        <Link href={subItem.href}>
                          <Button
                            variant={
                              pathname.startsWith(subItem.href)
                                ? 'default'
                                : 'outline'
                            }
                            className="w-full justify-start"
                          >
                            {subItem.title}
                          </Button>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
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
