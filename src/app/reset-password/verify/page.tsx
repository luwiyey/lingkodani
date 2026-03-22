'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';

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

function readFriendlyVerificationError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : '';
  const message = typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: string }).message ?? '')
    : '';
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes('expired') || normalized.includes('invalid-action-code')) {
    return 'Expired o invalid na ang password reset link. Humingi muli ng panibagong reset email.';
  }

  if (normalized.includes('weak-password')) {
    return 'Masyadong mahina ang bagong password. Gumamit ng mas mahaba at mas malakas na password.';
  }

  if (normalized.includes('missing') && normalized.includes('configuration')) {
    return 'Hindi pa kumpleto ang live Firebase configuration para sa password reset.';
  }

  return 'Hindi natuloy ang password reset. Subukan muli o humingi ng panibagong reset email.';
}

function ResetPasswordVerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const resetBg = PlaceHolderImages.find((image) => image.id === 'login-bg');

  const emailFromQuery = searchParams.get('email');
  const actionCode = searchParams.get('oobCode');
  const isResetLinkMode = Boolean(actionCode);

  useEffect(() => {
    if (!isResetLinkMode || !actionCode) {
      return;
    }

    let isMounted = true;
    setIsCheckingCode(true);
    setCodeError(null);

    verifyPasswordResetCode(getClientAuth(), actionCode)
      .then((email) => {
        if (!isMounted) {
          return;
        }

        setResolvedEmail(email);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setCodeError(readFriendlyVerificationError(error));
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingCode(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [actionCode, isResetLinkMode]);

  const helperDescription = useMemo(() => {
    if (isResetLinkMode) {
      if (isCheckingCode) {
        return 'Sinusuri namin ang password reset link na binuksan mo.';
      }

      if (codeError) {
        return codeError;
      }

      return 'Ilagay ang iyong bagong password para makumpleto ang pag-reset ng account.';
    }

    if (emailFromQuery) {
      return `Nagpadala kami ng password reset link sa ${emailFromQuery}. Tingnan ang inbox o spam folder, pagkatapos ay buksan ang link para maitakda ang bagong password. Kung walang dumating na email, maaaring hindi pa naka-provision ang account na ito sa live system.`;
    }

    return 'Tingnan ang iyong inbox para sa password reset link. Depende sa Firebase setup ng project, maaaring sa hosted reset screen muna magbukas bago ka makabalik sa app. Kung walang dumating na email, maaaring hindi pa naka-provision ang account mo.';
  }, [codeError, emailFromQuery, isCheckingCode, isResetLinkMode]);

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actionCode) {
      toast({
        title: 'Walang reset link',
        description: 'Buksan ang password reset link mula sa iyong email bago magtakda ng bagong password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Hindi tugma ang passwords',
        description: 'Parehong password dapat ang nasa dalawang field.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset(getClientAuth(), actionCode, newPassword);

      toast({
        title: 'Na-reset na ang password',
        description: 'Maaari ka nang mag-login gamit ang iyong bagong password.',
      });

      router.push('/login');
    } catch (error) {
      toast({
        title: 'Hindi natuloy ang reset',
        description: readFriendlyVerificationError(error),
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,247,0.76),rgba(239,246,240,0.62),rgba(224,236,226,0.48))]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 items-center justify-center px-4 py-8">
        <Card className="auth-card-surface mx-auto w-full max-w-md overflow-hidden">
          <CardHeader className="pb-4 pt-8 text-center sm:pb-5 sm:pt-9">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                {isResetLinkMode ? <KeyRound className="h-5 w-5" /> : <MailCheck className="h-5 w-5" />}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="auth-card-title text-2xl">
              {isResetLinkMode ? 'Ilagay ang Bagong Password' : 'Tingnan ang Iyong Email'}
            </CardTitle>
            <CardDescription className="auth-card-description mx-auto mt-1 max-w-[26rem] text-[14px] leading-7">
              {helperDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
            {isResetLinkMode ? (
              codeError ? (
                <div className="space-y-4">
                  <div className="rounded-[calc(var(--radius)+4px)] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {codeError}
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/reset-password">Humingi ng panibagong reset email</Link>
                  </Button>
                </div>
              ) : isCheckingCode ? (
                <div className="rounded-[calc(var(--radius)+4px)] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  Sinusuri namin ang validity ng iyong reset link...
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {resolvedEmail ? (
                    <div className="rounded-[calc(var(--radius)+4px)] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      Ang password na ire-reset ay para sa <span className="font-semibold">{resolvedEmail}</span>.
                    </div>
                  ) : null}

                  <HoverTooltip text="Ilagay ang bago mong password.">
                    <div className="space-y-2.5">
                      <Label htmlFor="new-password" className="auth-card-label">
                        Bagong Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          autoComplete="new-password"
                          required
                          disabled={isSubmitting}
                          className="auth-card-input h-12 rounded-xl px-4 pr-12 text-[15px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          disabled={isSubmitting}
                          className="auth-card-icon-button absolute inset-y-0 right-0 flex w-12 items-center justify-center disabled:cursor-not-allowed"
                          aria-label={showPassword ? 'Itago ang password' : 'Ipakita ang password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </HoverTooltip>

                  <HoverTooltip text="Ulitin ang bagong password para matiyak na tama ito.">
                    <div className="space-y-2.5">
                      <Label htmlFor="confirm-password" className="auth-card-label">
                        Kumpirmahin ang Bagong Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          autoComplete="new-password"
                          required
                          disabled={isSubmitting}
                          className="auth-card-input h-12 rounded-xl px-4 pr-12 text-[15px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          disabled={isSubmitting}
                          className="auth-card-icon-button absolute inset-y-0 right-0 flex w-12 items-center justify-center disabled:cursor-not-allowed"
                          aria-label={showConfirmPassword ? 'Itago ang kumpirmasyon ng password' : 'Ipakita ang kumpirmasyon ng password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </HoverTooltip>

                  <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? 'Nina-reset ang password...' : 'I-save ang Bagong Password'}
                  </Button>
                </form>
              )
            ) : (
              <div className="space-y-5">
                <div className="rounded-[calc(var(--radius)+6px)] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">Naipadala na ang password reset email.</p>
                      <p>
                        Buksan ang link sa iyong inbox o spam folder. Depende sa setup ng project, maaaring sa Firebase reset screen muna ito magbukas bago ka makabalik sa app o login page.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[calc(var(--radius)+4px)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Kung wala kang natanggap na reset email sa loob ng ilang minuto, posibleng hindi pa naka-set up ng developer o barangay admin ang live account na ito.
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/request-access?source=reset_password&email=${encodeURIComponent(emailFromQuery ?? '')}`}>Humiling ng access setup</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/login">Bumalik sa login</Link>
                </Button>
              </div>
            )}
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

export default function ResetPasswordVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ResetPasswordVerifyPageContent />
    </Suspense>
  );
}
