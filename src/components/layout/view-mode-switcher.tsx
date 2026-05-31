'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { isLiveMode } from '@/lib/config/app-mode';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { readOnboardingProfile, saveOnboardingProfile } from '@/lib/onboarding';
import type { PreferredWorkspace } from '@/lib/types';
import { cn } from '@/lib/utils';

const views = [
  {
    href: '/dashboard/operations',
    label: 'Simple',
    hint: 'Mas madaling araw-araw',
    workspace: 'simple' as PreferredWorkspace,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/operations'),
  },
  {
    href: '/dashboard/sms-feed',
    label: 'Detalyado',
    hint: 'Mas maraming tools',
    workspace: 'detailed' as PreferredWorkspace,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/sms-feed'),
  },
] as const;

export function ViewModeSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, currentUserProfile, applyProfilePatch } = useAuth();
  const [pendingWorkspace, setPendingWorkspace] = React.useState<PreferredWorkspace | null>(null);

  if (
    pathname.startsWith('/dashboard/developer') ||
    pathname.startsWith('/dashboard/disaster')
  ) {
    return null;
  }

  const persistWorkspacePreference = async (workspace: PreferredWorkspace) => {
    const currentOnboarding = readOnboardingProfile();
    if (currentOnboarding) {
      saveOnboardingProfile({
        ...currentOnboarding,
        preferredWorkspace: workspace,
      });
    }

    if (!isLiveMode || !currentUser) {
      applyProfilePatch({ preferredWorkspace: workspace });
      return;
    }

    const liveUser = getClientAuth().currentUser;
    const idToken = await liveUser?.getIdToken(true);

    if (!idToken) {
      throw new Error('Walang authenticated live session para sa workspace update na ito.');
    }

    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        preferredWorkspace: workspace,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? 'Hindi na-save ang napiling workspace.');
    }

    applyProfilePatch({
      preferredWorkspace: workspace,
      updatedAt: payload.profile?.updatedAt,
    });
  };

  const handleSelectView = async (href: string, workspace: PreferredWorkspace) => {
    if (pendingWorkspace || currentUserProfile?.role === 'developer') {
      router.push(href);
      return;
    }

    setPendingWorkspace(workspace);

    try {
      await persistWorkspacePreference(workspace);
      router.push(href);
    } catch (error) {
      toast({
        title: 'Hindi napalitan ang workspace',
        description: error instanceof Error ? error.message : 'Subukan muli pagkatapos ng ilang sandali.',
        variant: 'destructive',
      });
    } finally {
      setPendingWorkspace(null);
    }
  };

  return (
    <div className="hidden items-center gap-1 rounded-full border bg-muted/60 p-1 lg:flex">
      {views.map((view) => {
        const active = view.isActive(pathname);
        const isSaving = pendingWorkspace === view.workspace;

        return (
          <Button
            key={view.href}
            type="button"
            variant="ghost"
            disabled={Boolean(pendingWorkspace)}
            onClick={() => void handleSelectView(view.href, view.workspace)}
            className={cn(
              'h-auto rounded-full px-3 py-2 text-left text-sm transition-colors',
              active
                ? 'bg-background font-semibold text-foreground shadow-sm hover:bg-background'
                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            )}
          >
            <span className="block leading-none">{view.label}</span>
            <span className="mt-1 block text-[11px] leading-none text-muted-foreground">
              {isSaving ? 'Sine-save...' : view.hint}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
