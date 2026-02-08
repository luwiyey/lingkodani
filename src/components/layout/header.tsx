'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Flame,
  LogOut,
  User,
  Leaf,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { HoverTooltip } from '../ui/hover-tooltip';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  const isDisasterModeActive = pathname.startsWith('/dashboard/disaster');
  const [showDialog, setShowDialog] = useState(false);

  const handleSwitchChange = () => {
    setShowDialog(true);
  };

  const handleConfirmAction = () => {
    setShowDialog(false);
    if (isDisasterModeActive) {
      router.push('/dashboard');
    } else {
      router.push('/dashboard/disaster-mode');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-6">
        <HoverTooltip text="I-toggle ang sidebar. (Cmd/Ctrl + B)">
            <SidebarTrigger />
        </HoverTooltip>
        
        {state === 'collapsed' && !isMobile && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2 text-primary-foreground">
                <Leaf className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg truncate">
              Lingkod-Ani
            </span>
          </Link>
        )}
        
        <div className="flex-1" />

        <HoverTooltip text={isDisasterModeActive ? "I-deactivate ang Disaster Mode" : "I-activate ang Disaster Mode"}>
            <div className="flex items-center gap-2">
            <Label
                htmlFor="disaster-mode"
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
                <Flame className="w-4 h-4 text-destructive" />
                <span className="hidden sm:inline">Disaster Mode</span>
            </Label>
            <Switch
                id="disaster-mode"
                checked={isDisasterModeActive}
                onCheckedChange={handleSwitchChange}
                className="data-[state=checked]:bg-destructive"
            />
            </div>
        </HoverTooltip>

        <HoverTooltip text="Baguhin ang tema (Light/Dark).">
            <ThemeToggle />
        </HoverTooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HoverTooltip text="Tingnan ang mga notipikasyon.">
                <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-destructive rounded-full">
                    3
                </span>
                <span className="sr-only">I-toggle ang mga notipikasyon</span>
                </Button>
            </HoverTooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Mga Notipikasyon</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/sms-feed')} className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold">
                  Bagong SMS mula kay Maria Clara
                </span>
                <span className="text-xs text-muted-foreground">
                  Kapurpuran: Mataas. Kailangan ng pag-apruba.
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/reports')} className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold">Handa na ang Lingguhang Ulat</span>
                <span className="text-xs text-muted-foreground">
                  Available na ang analytics para sa Okt 22-29.
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/inventory')} className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold">Alerto sa Imbentaryo</span>
                <span className="text-xs text-muted-foreground">
                  Mababa na ang stock ng Urea Fertilizer.
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HoverTooltip text="Pamahalaan ang iyong account o mag-logout.">
                <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
                >
                <User className="h-5 w-5" />
                </Button>
            </HoverTooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aking Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/account">
                <User className="mr-2" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/">
                <LogOut className="mr-2" />
                Mag-logout
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              {isDisasterModeActive
                ? 'I-deactivate ang Disaster Mode?'
                : 'I-activate ang Disaster Mode?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDisasterModeActive
                ? 'Ang pagkilos na ito ay magbabalik sa system sa normal na operasyon. Ang disaster dashboard ay isasara.'
                : 'Ang pagkilos na ito ay maglalagay sa system sa emergency response mode at dadalhin ka sa disaster dashboard. Sigurado ka ba?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kanselahin</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                !isDisasterModeActive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isDisasterModeActive ? 'Oo, I-deactivate' : 'Oo, I-activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
