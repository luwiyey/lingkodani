'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, MailCheck } from 'lucide-react';
import type { ActionCodeSettings } from 'firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { buildLegalPageHref } from '@/lib/legal-links';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getClientAuth } from '@/lib/firebase/auth-client';

function readFriendlyResetError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : '';
  const message = typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: string }).message ?? '')
    : '';
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes('missing') && normalized.includes('configuration')) {
    return 'Hindi pa kumpleto ang live Firebase configuration para sa password reset.';
  }

  if (normalized.includes('invalid-email')) {
    return 'Mukhang hindi tama ang format ng email address na inilagay mo.';
  }

  if (normalized.includes('too-many-requests')) {
    return 'Masyado nang maraming reset request. Maghintay muna ng ilang minuto bago subukan muli.';
  }

  return 'Hindi naipadala ang password reset email. Subukan muli pagkatapos ng ilang sandali.';
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetBg = PlaceHolderImages.find((image) => image.id === 'login-bg');

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast({
        title: 'Kulang ang detalye',
        description: 'Ilagay muna ang email address na naka-link sa iyong account.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/reset-password/verify?email=${encodeURIComponent(normalizedEmail)}`,
      };

      await sendPasswordResetEmail(getClientAuth(), normalizedEmail, actionCodeSettings);

      toast({
        title: 'Naipadala ang reset email',
        description: 'Tingnan ang iyong inbox o spam folder para sa password reset link.',
      });

      router.push(`/reset-password/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      toast({
        title: 'Hindi naipadala ang reset email',
        description: readFriendlyResetError(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="fixed inset-0">
        {resetBg ? (
          <Image
            src={resetBg.imageUrl}
            alt={resetBg.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={resetBg.imageHint}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.7),rgba(15,23,42,0.56),rgba(17,24,39,0.45))]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 items-center justify-center px-4 py-8">
        <Card className="mx-auto w-full max-w-md overflow-hidden border border-slate-200/80 bg-white text-foreground shadow-[0_24px_72px_-40px_rgba(15,23,42,0.32)]">
          <CardHeader className="pb-4 pt-8 text-center sm:pb-5 sm:pt-9">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="text-2xl text-foreground">I-reset ang Password</CardTitle>
            <CardDescription className="mx-auto mt-1 max-w-[26rem] text-[14px] leading-7 text-muted-foreground/90">
              Ilagay ang email address ng iyong account at padadalhan ka namin ng password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
            <form onSubmit={handleRequestReset} className="space-y-5">
              <HoverTooltip text="Ilagay ang email address na naka-link sa iyong Lingkod-Ani account.">
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-[15px] font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="brgy-admin@lingkodani.gov.ph"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 text-[15px] shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                  />
                </div>
              </HoverTooltip>

              <div className="rounded-[calc(var(--radius)+4px)] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Walang verification code na ipapadala rito. Isang secure na <span className="font-semibold">reset link</span> ang matatanggap mo sa email, at maaaring sa Firebase-hosted reset screen muna magbukas depende sa setup ng project.
                  </p>
                </div>
              </div>

              <HoverTooltip text="Ipadala ang password reset email sa inilagay na address.">
                <Button type="submit" className="mt-3 h-12 w-full text-base font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? 'Nagpapadala ng email...' : 'Ipadala ang Reset Link'}
                </Button>
              </HoverTooltip>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm">
              <Link href="/login" className="text-muted-foreground underline hover:text-foreground">
                Bumalik sa login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="relative z-10 p-4 text-center text-xs text-white/90">
        <Link href={buildLegalPageHref('/terms-of-service', 'login')} className="hover:underline">
          Terms of Service
        </Link>{' '}
        |{' '}
        <Link href={buildLegalPageHref('/privacy-policy', 'login')} className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
