
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Image from "next/image";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { isLiveMode } from '@/lib/config/app-mode';
import { normalizeDemoProfile, readOnboardingProfile } from '@/lib/onboarding';
import { getPreferredDashboardRoute } from '@/lib/user-workspace';

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users } = useData();
  const { authLoading, currentUserProfile, startDemoSession } = useAuth();
  const { toast } = useToast();
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
    if (!authLoading && currentUserProfile) {
      router.push(getPreferredDashboardRoute(currentUserProfile));
    }
  }, [authLoading, currentUserProfile, router]);

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLiveMode) {
      router.push(currentUserProfile ? getPreferredDashboardRoute(currentUserProfile) : '/login');
      return;
    }
    
    const email = searchParams.get('email');
    const user = users.find(u => u.email === email);
    const preferredWorkspace = readOnboardingProfile()?.preferredWorkspace ?? user?.preferredWorkspace ?? 'simple';
    const demoUser = normalizeDemoProfile(user ?? null, preferredWorkspace);

    if (!user || demoUser.status === 'disabled') {
      toast({
        title: "Hindi makapag-login",
        description: "Ang account na ito ay hindi available o naka-disable.",
        variant: "destructive",
      });
      router.push('/');
      return;
    }

    toast({
      title: "Pag-verify Nagtagumpay!",
      description: "Maligayang pagbabalik sa Lingkod-Ani.",
    });

    startDemoSession(demoUser.email);
    router.push(getPreferredDashboardRoute(demoUser));
  };

  const email = searchParams.get('email');
  const user = users.find((candidate) => candidate.email === email);
  const preferredWorkspace = readOnboardingProfile()?.preferredWorkspace ?? user?.preferredWorkspace ?? 'simple';
  const demoUser = normalizeDemoProfile(user ?? null, preferredWorkspace);

  return (
    <div className="w-full h-screen relative">
       {loginBg && (
         <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            fill
            className="object-cover"
            data-ai-hint={loginBg.imageHint}
         />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-primary/40" />
      <div className="relative z-10 flex items-center justify-center h-full p-4">
        <Card className="auth-card-surface w-full max-w-md mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">Kumpirmahin ang Demo Login</h1>
            </div>
            <CardTitle className="auth-card-title text-2xl">Demo session confirmation</CardTitle>
            <CardDescription className="auth-card-description">
              Walang 6-digit code dito. Ito ay huling kumpirmasyon bago ka pumasok sa demo dashboard gamit ang sample barangay data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="rounded-[calc(var(--radius)+6px)] border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-900">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">Handa nang buksan ang demo workspace.</p>
                    <p>
                      Account: <span className="font-medium">{demoUser.email}</span>
                    </p>
                    <p>
                      Workspace: <span className="font-medium">{preferredWorkspace === 'detailed' ? 'Detalyado' : 'Simple'}</span>
                    </p>
                    <p className="text-emerald-800/90">
                      Ang susunod na hakbang ay magbubukas ng sample dashboard lamang. Wala itong ipapadalang totoong email code.
                    </p>
                  </div>
                </div>
              </div>
               <HoverTooltip text="Pumasok sa demo dashboard gamit ang sample barangay records at demo SMS data.">
                <Button type="submit" className="w-full mt-2">
                  Pumasok sa Demo Dashboard
                </Button>
              </HoverTooltip>
            </form>
             <div className="mt-4 text-center text-sm">
                <HoverTooltip text="Bumalik sa login kung gusto mong pumili ng ibang account o live mode.">
                  <button onClick={() => router.push('/login')} className="auth-card-link">
                    Bumalik sa login
                  </button>
                </HoverTooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-background" />}>
      <VerifyPageContent />
    </Suspense>
  );
}
