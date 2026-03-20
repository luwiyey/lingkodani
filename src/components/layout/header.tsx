'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  BadgeCheck,
  Flame,
  LogOut,
  PanelLeft,
  User,
} from 'lucide-react';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { useAnalytics } from '@/hooks/use-analytics';
import { getPreferredDashboardRoute } from '@/lib/user-workspace';
import {
  getLatestMarketPriceTimestamp,
  isMarketPriceStale,
} from '@/lib/services/price-watch-service';
import { HoverTooltip } from '../ui/hover-tooltip';

type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  timestamp: string;
};

function buildDeepLink(path: string, key: string, value: string) {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

function createNotificationId(scope: string, entityId: string, timestamp: string) {
  const parsedTimestamp = new Date(timestamp).getTime();
  const suffix = Number.isNaN(parsedTimestamp) ? timestamp : String(parsedTimestamp);
  return `${scope}-${entityId}-${suffix}`;
}

function truncateText(value: string, maxLength = 72) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const { currentUser, currentUserProfile, signOutUser } = useAuth();
  const {
    farmers,
    smsMessages,
    resources,
    outboundMessages,
    marketPrices,
    assistanceRecords,
    fieldVisitTasks,
  } = useData();
  const { riskAlerts } = useAnalytics();

  const isDisasterModeActive = pathname.startsWith('/dashboard/disaster');
  const isDeveloperView = currentUserProfile?.role === 'developer';
  const [showDisasterDialog, setShowDisasterDialog] = useState(false);
  const [showSidebarNoticeDialog, setShowSidebarNoticeDialog] = useState(false);

  const latestOutboundByMessage = useMemo(() => {
    const map = new Map<string, (typeof outboundMessages)[number]>();

    for (const record of outboundMessages) {
      if (record.audience === 'official') {
        continue;
      }

      if (!map.has(record.smsMessageId)) {
        map.set(record.smsMessageId, record);
      }
    }

    return map;
  }, [outboundMessages]);

  const notifications = useMemo<DashboardNotification[]>(() => {
    const operatorName = currentUserProfile?.name?.trim() || '';
    const pendingFarmerNotifications = farmers
      .filter((farmer) => farmer.status === 'pending_approval')
      .map((farmer) => ({
        id: createNotificationId('farmer', farmer.id, farmer.registrationDate),
        title: `Bagong rehistro: ${farmer.name}`,
        description: `${farmer.sitio}, ${farmer.barangay} - naghihintay ng pag-apruba`,
        href: buildDeepLink('/dashboard/farmers/approvals', 'farmer', farmer.id),
        timestamp: farmer.registrationDate,
      }));

    const incomingSmsNotifications = smsMessages
      .filter((message) => (
        !message.closedAt &&
        (
          message.status === 'pending_approval' ||
          message.registrationRequired ||
          message.clarificationNeeded ||
          message.caseStatus === 'awaiting_clarification' ||
          message.caseStatus === 'awaiting_registration' ||
          message.caseStatus === 'open' ||
          message.caseStatus === 'escalated'
        ) &&
        !message.assignedTo
      ))
      .map((message) => ({
        id: createNotificationId('sms', message.id, message.timestamp),
        title: `May kailangang aksyon: ${message.farmerName}`,
        description:
          message.registrationRequired || message.caseStatus === 'awaiting_registration'
            ? `Kailangan ng rehistro - ${truncateText(message.message, 64)}`
            : message.clarificationNeeded || message.caseStatus === 'awaiting_clarification'
              ? `Kailangan ng paglilinaw - ${truncateText(message.message, 64)}`
              : `${message.urgency.toUpperCase()} urgency - ${truncateText(message.message, 64)}`,
        href: buildDeepLink('/dashboard/sms-feed', 'sms', message.id),
        timestamp: message.timestamp,
      }));

    const myQueueNotifications = smsMessages
      .filter((message) => !message.closedAt && message.assignedTo === operatorName)
      .map((message) => ({
        id: createNotificationId('assigned', message.id, message.assignedAt ?? message.timestamp),
        title: `Task mo ito: ${message.farmerName}`,
        description: `${message.caseStatus ?? 'assigned'} - ${truncateText(message.message, 64)}`,
        href: '/dashboard/operations#aking-queue',
        timestamp: message.assignedAt ?? message.timestamp,
      }));

    const criticalAlertNotifications = riskAlerts
      .filter((alert) => alert.severity === 'Kritikal' && alert.kind !== 'inventory')
      .map((alert) => {
        const matchingMessages = smsMessages.filter((message) => {
          const lowerMessage = message.message.toLowerCase();

          if (alert.kind === 'flood') {
            return message.parsedIntent === 'EMERGENCY' || lowerMessage.includes('baha');
          }

          if (alert.kind === 'pest') {
            return message.parsedIntent === 'PEST_DISEASE';
          }

          return false;
        });

        const latestTimestamp = matchingMessages
          .map((message) => message.timestamp)
          .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
          ?? smsMessages[0]?.timestamp
          ?? new Date().toISOString();

        return {
          id: createNotificationId('alert', alert.id, latestTimestamp),
          title: alert.title,
          description: `${alert.affected} magsasaka ang apektado - ${alert.description}`,
          href: buildDeepLink('/dashboard/active-issues', 'alert', alert.id),
          timestamp: latestTimestamp,
        };
      });

    const lowStockNotifications = resources
      .filter((resource) => resource.stock < 10)
      .map((resource) => ({
        id: createNotificationId('resource', resource.id, resource.lastUpdated),
        title: `Mababang stock: ${resource.name}`,
        description: `${resource.stock} ${resource.unit} na lang ang natitira`,
        href: buildDeepLink('/dashboard/inventory', 'resource', resource.id),
        timestamp: resource.lastUpdated,
      }));

    const failedSendNotifications = smsMessages
      .map((message) => {
        const latestOutbound = latestOutboundByMessage.get(message.id);

        if (!latestOutbound || latestOutbound.status !== 'failed') {
          return null;
        }

        return {
          id: createNotificationId('failed', message.id, latestOutbound.lastStatusAt ?? latestOutbound.createdAt),
          title: `Failed send kay ${message.farmerName}`,
          description: latestOutbound.errorMessage
            ? truncateText(latestOutbound.errorMessage, 64)
            : 'Hindi naipadala ang huling outbound SMS. Buksan ang live feed para mag-retry.',
          href: buildDeepLink('/dashboard/sms-feed', 'sms', message.id),
          timestamp: latestOutbound.lastStatusAt ?? latestOutbound.createdAt,
        };
      })
      .filter((notification): notification is DashboardNotification => notification !== null);

    const dueFollowUpNotifications = smsMessages
      .filter((message) => !message.closedAt && !!message.followUpDueAt && !message.followUpSentAt)
      .map((message) => ({
        id: createNotificationId('followup', message.id, message.followUpDueAt ?? message.timestamp),
        title: `May follow-up kay ${message.farmerName}`,
        description: `Balikan ang kasong ito - ${truncateText(message.message, 64)}`,
        href: buildDeepLink('/dashboard/follow-up', 'sms', message.id),
        timestamp: message.followUpDueAt ?? message.timestamp,
      }));

    const dueVisitNotifications = fieldVisitTasks
      .filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
      .map((task) => {
        const farmer = farmers.find((entry) => entry.id === task.farmerId);
        return {
          id: createNotificationId('visit', task.id, task.scheduledFor),
          title: `May visit kay ${farmer?.name ?? task.farmerId}`,
          description: `${task.priority} priority - ${truncateText(task.purpose, 64)}`,
          href: buildDeepLink('/dashboard/follow-up', 'visit', task.id),
          timestamp: task.scheduledFor,
        };
      });

    const assistanceNotifications = assistanceRecords
      .filter((record) => record.status !== 'completed')
      .map((record) => {
        const farmer = farmers.find((entry) => entry.id === record.farmerId);
        return {
          id: createNotificationId('assistance', record.id, record.updatedAt),
          title: `May tulong para kay ${farmer?.name ?? record.farmerId}`,
          description: `${record.type} - ${truncateText(record.nextAction ?? record.details, 64)}`,
          href: buildDeepLink('/dashboard/follow-up', 'assistance', record.id),
          timestamp: record.updatedAt,
        };
      });

    const latestMarketPriceTimestamp = getLatestMarketPriceTimestamp(marketPrices);
    const marketPriceReferenceDate = latestMarketPriceTimestamp
      ? new Date(latestMarketPriceTimestamp)
      : new Date();
    const stalePriceNotifications = marketPrices
      .filter((entry) => isMarketPriceStale(entry, marketPriceReferenceDate))
      .map((entry) => ({
        id: createNotificationId('price', entry.id, entry.updatedAt),
        title: `I-refresh ang presyo ng ${entry.crop}`,
        description: `${entry.source} - huling update ${formatNotificationTime(entry.updatedAt)}`,
        href: buildDeepLink('/dashboard/price-watch', 'price', entry.id),
        timestamp: entry.updatedAt,
      }));

    return [
      ...pendingFarmerNotifications,
      ...incomingSmsNotifications,
      ...myQueueNotifications,
      ...criticalAlertNotifications,
      ...lowStockNotifications,
      ...failedSendNotifications,
      ...dueFollowUpNotifications,
      ...dueVisitNotifications,
      ...assistanceNotifications,
      ...stalePriceNotifications,
    ]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .filter((notification, index, collection) => (
        collection.findIndex((candidate) => candidate.id === notification.id) === index
      ));
  }, [
    assistanceRecords,
    currentUserProfile?.name,
    farmers,
    fieldVisitTasks,
    latestOutboundByMessage,
    marketPrices,
    resources,
    riskAlerts,
    smsMessages,
  ]);
  const notificationCount = notifications.length;

  const handleSwitchChange = () => {
    setShowDisasterDialog(true);
  };

  const handleNotificationSelect = (notification: DashboardNotification) => {
    router.push(notification.href);
  };

  const handleConfirmAction = () => {
    setShowDisasterDialog(false);
    if (isDisasterModeActive) {
      router.push('/dashboard/operations');
    } else {
      router.push('/dashboard/disaster-mode');
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    router.push('/');
  };

  const accountName = currentUserProfile?.name ?? currentUser?.displayName ?? 'Aking Account';
  const accountEmail = currentUser?.email ?? currentUserProfile?.email ?? '';
  const homeHref = getPreferredDashboardRoute(currentUserProfile);
  const avatarFallback = accountName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {isDisasterModeActive ? (
            <HoverTooltip text="Hindi mabubuksan ang sidebar habang naka-Disaster Mode.">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setShowSidebarNoticeDialog(true)}
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Sidebar unavailable in disaster mode</span>
              </Button>
            </HoverTooltip>
          ) : (
            <HoverTooltip text="I-toggle ang sidebar. (Cmd/Ctrl + B)">
              <SidebarTrigger />
            </HoverTooltip>
          )}

          {(isDisasterModeActive || (state === 'collapsed' && !isMobile)) && (
            <Link href={homeHref} className="flex min-w-0 items-center gap-3">
              <Image src="/logo.png" width={36} height={36} alt="Lingkod-Ani Logo" style={{ height: 'auto' }} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight tracking-tight">Lingkod-Ani</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {isDeveloperView ? 'Developer Console' : 'Kaagapay ng Magsasaka'}
                </p>
              </div>
            </Link>
          )}
        </div>

        <div className="flex-1" />

        {isDeveloperView ? (
          <div className="hidden items-center gap-2 rounded-full border border-border/90 bg-card px-3 py-2 text-[13px] font-medium tracking-tight text-muted-foreground shadow-sm sm:flex">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <span>Developer Console</span>
          </div>
        ) : (
          <HoverTooltip text={isDisasterModeActive ? 'I-deactivate ang Disaster Mode' : 'I-activate ang Disaster Mode'}>
            <div className="flex items-center gap-2 rounded-full border border-border/90 bg-card px-3 py-2 shadow-sm">
              <Label htmlFor="disaster-mode" className="flex cursor-pointer items-center gap-2 text-[13px] font-medium tracking-tight">
                <Flame className="h-4 w-4 text-destructive" />
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
        )}

        <ThemeToggle />

        {!isDeveloperView ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 ? (
                  <span className="absolute right-0 top-0 inline-flex -translate-y-1/2 translate-x-1/2 transform items-center justify-center rounded-full bg-destructive px-2 py-1 text-[10px] font-semibold leading-none text-red-100">
                    {notificationCount}
                  </span>
                ) : null}
                <span className="sr-only">I-toggle ang mga notipikasyon</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
              <DropdownMenuLabel className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Mga Notipikasyon
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                <ScrollArea className="h-[18rem]">
                  <div className="p-1">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        onSelect={() => handleNotificationSelect(notification)}
                        className="cursor-pointer items-start rounded-xl px-3 py-3"
                      >
                        <div className="flex w-full flex-col gap-1 overflow-hidden">
                          <div className="flex items-start justify-between gap-3">
                            <span className="break-words pr-2 font-semibold leading-snug">
                              {notification.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatNotificationTime(notification.timestamp)}
                            </span>
                          </div>
                          <span className="break-words text-xs leading-relaxed text-muted-foreground">
                            {notification.description}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Wala pang kailangang tugunan sa ngayon.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUserProfile?.avatarUrl || currentUser?.photoURL || undefined} alt={accountName} />
                <AvatarFallback>{avatarFallback || <User className="h-4 w-4" />}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{accountName}</span>
                {accountEmail ? <span className="text-xs font-normal text-muted-foreground">{accountEmail}</span> : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/account">
                <User className="mr-2" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2" />
              Mag-logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={showDisasterDialog} onOpenChange={setShowDisasterDialog}>
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

      <AlertDialog open={showSidebarNoticeDialog} onOpenChange={setShowSidebarNoticeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Hindi mabubuksan ang sidebar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Naka-Disaster Mode ang system ngayon, kaya nakatago ang sidebar para manatiling simple ang emergency workflow. Maaari kang bumalik sa normal dashboard para muling gamitin ang sidebar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSidebarNoticeDialog(false)}>
              Naiintindihan ko
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
