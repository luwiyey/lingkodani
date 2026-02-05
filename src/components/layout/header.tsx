"use client";

import {
  Bell,
  Flame,
  LogOut,
  PanelLeft,
  Settings,
  User,
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Label htmlFor="disaster-mode" className="flex items-center gap-2 text-sm font-medium">
          <Flame className="w-4 h-4 text-destructive" />
          <span className="hidden sm:inline">Disaster Mode</span>
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
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <div className="flex flex-col">
              <span className="font-semibold">New SMS from Maria Clara</span>
              <span className="text-xs text-muted-foreground">Urgency: High. Needs approval.</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
          <div className="flex flex-col">
              <span className="font-semibold">Weekly Report Ready</span>
              <span className="text-xs text-muted-foreground">Analytics for Oct 22-29 is available.</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
          <div className="flex flex-col">
              <span className="font-semibold">Inventory Alert</span>
              <span className="text-xs text-muted-foreground">Urea Fertilizer stock is low.</span>
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
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2" />Settings</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/"><LogOut className="mr-2" />Logout</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
