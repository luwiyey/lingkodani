"use client";

import {
  Bell,
  Flame,
  LogOut,
  Settings,
  User,
  Leaf,
} from "lucide-react";
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-6">
      <SidebarTrigger />
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="bg-primary rounded-lg p-1.5 text-primary-foreground">
            <Leaf className="w-5 h-5" />
        </div>
        <span className="text-lg font-semibold text-primary hidden md:inline-block">Lingkod-Ani</span>
      </Link>
      
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Label htmlFor="disaster-mode" className="flex items-center gap-2 text-sm font-medium">
          <Flame className="w-4 h-4 text-destructive" />
          <span className="hidden sm:inline">Modo ng Sakuna</span>
        </Label>
        <Switch id="disaster-mode" />
      </div>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-destructive rounded-full">
              3
            </span>
            <span className="sr-only">I-toggle ang mga notipikasyon</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Mga Notipikasyon</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <div className="flex flex-col">
              <span className="font-semibold">Bagong SMS mula kay Maria Clara</span>
              <span className="text-xs text-muted-foreground">Kapurpuran: Mataas. Kailangan ng pag-apruba.</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
          <div className="flex flex-col">
              <span className="font-semibold">Handa na ang Lingguhang Ulat</span>
              <span className="text-xs text-muted-foreground">Available na ang analytics para sa Okt 22-29.</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
          <div className="flex flex-col">
              <span className="font-semibold">Alerto sa Imbentaryo</span>
              <span className="text-xs text-muted-foreground">Mababa na ang stock ng Urea Fertilizer.</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aking Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/dashboard/account"><User className="mr-2" />Account</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/"><LogOut className="mr-2" />Mag-logout</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
