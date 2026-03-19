'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  FileJson,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Users,
  ShieldAlert,
  ChevronUp,
  ClipboardList,
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
import { useAuth } from '@/context/auth-context';
import { getPreferredWorkspace } from '@/lib/user-workspace';

type FooterNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  subItems?: {
    title: string;
    href: string;
  }[];
};

const detailedNavItems: FooterNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/operations', label: 'Operations', icon: ClipboardList },
  { href: '/dashboard/sms-feed', label: 'SMS Feed', icon: MessageSquare },
  {
    href: '/dashboard/farmers',
    label: 'Magsasaka',
    icon: Users,
    subItems: [
      { title: 'Database', href: '/dashboard/farmers' },
      { title: 'Pag-apruba', href: '/dashboard/farmers/approvals' },
      { title: 'Pagpaparehistro', href: '/dashboard/farmers/register' },
      { title: 'Follow-up Queue', href: '/dashboard/follow-up' },
      { title: 'Aktibong Sakahan', href: '/dashboard/active-farms' },
      { title: 'Pangkalahatang-ideya', href: '/dashboard/oversight' },
      { title: 'Price Watch', href: '/dashboard/price-watch' },
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

const simpleNavItems: FooterNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/operations', label: 'Operations', icon: ClipboardList },
  {
    href: '/dashboard/farmers',
    label: 'Magsasaka',
    icon: Users,
    subItems: [
      { title: 'Follow-up Queue', href: '/dashboard/follow-up' },
      { title: 'Database', href: '/dashboard/farmers' },
      { title: 'Pag-apruba', href: '/dashboard/farmers/approvals' },
      { title: 'Price Watch', href: '/dashboard/price-watch' },
    ],
  },
  {
    href: '/dashboard/active-issues',
    label: 'Alerto',
    icon: ShieldAlert,
    subItems: [
      { title: 'Mga Aktibong Isyu', href: '/dashboard/active-issues' },
      { title: 'Pamamahala ng Alerto', href: '/dashboard/alerts' },
      { title: 'Imbentaryo', href: '/dashboard/inventory' },
    ],
  },
];

const developerNavItems: FooterNavItem[] = [
  { href: '/dashboard/developer', label: 'Developer', icon: Shield },
  { href: '/dashboard/developer/add-user', label: 'Users', icon: Users },
  { href: '/dashboard/developer/training-data', label: 'Training', icon: FileJson },
  { href: '/dashboard/data-center', label: 'Data', icon: Database },
];

export function MobileFooter() {
  const pathname = usePathname();
  const { currentUserProfile } = useAuth();
  const activeWorkspace = getPreferredWorkspace(currentUserProfile);
  const navItems = currentUserProfile?.role === 'developer'
    ? developerNavItems
    : currentUserProfile?.role === 'barangay' && activeWorkspace === 'simple'
      ? simpleNavItems
      : detailedNavItems;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border/80 bg-background/95 shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = item.href
            ? item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href) || item.subItems?.some((subItem) => pathname.startsWith(subItem.href))
            : false;

          if (item.subItems) {
            return (
              <Sheet key={item.label}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      'flex h-full w-full flex-col items-center justify-center rounded-xl p-1 text-muted-foreground transition-colors',
                      isActive && 'bg-primary/5 text-primary'
                    )}
                  >
                    <item.icon className="mb-1 h-5 w-5" />
                    <span className="flex items-center text-center text-[10px] font-medium leading-tight">
                      {item.label}
                      <ChevronUp className="ml-0.5 h-3 w-3" />
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[calc(var(--radius)+8px)]">
                  <SheetHeader className="text-left">
                    <SheetTitle>{item.label}</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 py-4">
                    {item.subItems.map((subItem) => (
                      <SheetClose asChild key={subItem.href}>
                        <Link href={subItem.href}>
                          <Button
                            variant={
                              pathname === subItem.href
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
                'flex h-full w-full flex-col items-center justify-center rounded-xl p-1 text-muted-foreground transition-colors',
                isActive && 'bg-primary/5 text-primary'
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
