'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailPlus, Send } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { buildLegalPageHref } from '@/lib/legal-links';
import {
  PUBLIC_ENTRY_BACKGROUND_ALT,
  PUBLIC_ENTRY_BACKGROUND_HINT,
  PUBLIC_ENTRY_BACKGROUND_IMAGE,
  PUBLIC_ENTRY_BACKGROUND_IMAGE_CLASS,
  PUBLIC_ENTRY_IMAGE_OVERLAY,
} from '@/lib/public-entry-theme';

function RequestAccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [name, setName] = useState(searchParams.get('name') ?? '');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [phone, setPhone] = useState('');
  const [barangay, setBarangay] = useState('Batakil');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const source =
    searchParams.get('source') === 'login' || searchParams.get('source') === 'reset_password'
      ? searchParams.get('source')
      : 'public_page';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      toast({
        title: 'Kulang ang detalye',
        description: 'Kailangan ang pangalan at email para sa access request.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          phone: phone.trim(),
          barangay: barangay.trim(),
          title: title.trim(),
          message: message.trim(),
          source,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : 'Hindi naisumite ang access request.'
        );
      }

      toast({
        title: payload.duplicatePending ? 'Na-update ang pending request' : 'Naisumite ang access request',
        description: payload.duplicatePending
          ? 'Na-merge ang bagong detalye mo sa kasalukuyang pending request para hindi dumami ang duplicate entries sa review queue.'
          : 'Naipasa na ang iyong detalye para ma-review at ma-set up ang account.',
      });
      router.push(`/login?requestedAccess=1&email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      toast({
        title: 'Hindi naisumite ang request',
        description: error instanceof Error ? error.message : 'Subukan muli pagkatapos ng ilang sandali.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="fixed inset-0">
        <Image
          src={PUBLIC_ENTRY_BACKGROUND_IMAGE}
          alt={PUBLIC_ENTRY_BACKGROUND_ALT}
          fill
          className={PUBLIC_ENTRY_BACKGROUND_IMAGE_CLASS}
          priority
          data-ai-hint={PUBLIC_ENTRY_BACKGROUND_HINT}
        />
        <div className={PUBLIC_ENTRY_IMAGE_OVERLAY} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 items-center justify-center px-4 py-8">
        <Card className="auth-card-surface mx-auto w-full max-w-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 text-center sm:pb-5 sm:pt-9">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailPlus className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="auth-card-title text-2xl">Humiling ng Access</CardTitle>
            <CardDescription className="auth-card-description mx-auto mt-1 max-w-[36rem] text-[14px] leading-7">
              Kung wala ka pang live account, ilagay ang iyong detalye rito para ma-review ng superadmin o barangay administrator at ma-set up ang access mo.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <HoverTooltip text="Buong pangalan ng humihiling ng access.">
                  <div className="space-y-2.5">
                    <Label htmlFor="request-name" className="auth-card-label">Buong Pangalan</Label>
                    <Input id="request-name" value={name} onChange={(event) => setName(event.target.value)} required disabled={isSubmitting} className="auth-card-input" />
                  </div>
                </HoverTooltip>

                <HoverTooltip text="Email address na gagamitin sa Lingkod-Ani.">
                  <div className="space-y-2.5">
                    <Label htmlFor="request-email" className="auth-card-label">Email Address</Label>
                    <Input id="request-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isSubmitting} className="auth-card-input" />
                  </div>
                </HoverTooltip>

                <HoverTooltip text="Mobile number na puwedeng gamitin para sa official reminders o account contact.">
                  <div className="space-y-2.5">
                    <Label htmlFor="request-phone" className="auth-card-label">Mobile Number</Label>
                    <Input id="request-phone" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={isSubmitting} placeholder="09XXXXXXXXX" className="auth-card-input" />
                  </div>
                </HoverTooltip>

                <HoverTooltip text="Tungkulin mo sa barangay agriculture workflow.">
                  <div className="space-y-2.5">
                    <Label htmlFor="request-title" className="auth-card-label">Tungkulin</Label>
                    <Input id="request-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={isSubmitting} placeholder="AEW, Secretary, Captain, Admin" className="auth-card-input" />
                  </div>
                </HoverTooltip>

                <HoverTooltip text="Barangay na gagamit ng account na ito.">
                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="request-barangay" className="auth-card-label">Barangay</Label>
                    <Input id="request-barangay" value={barangay} onChange={(event) => setBarangay(event.target.value)} disabled={isSubmitting} className="auth-card-input" />
                  </div>
                </HoverTooltip>
              </div>

              <HoverTooltip text="Opsyonal na note tungkol sa dahilan ng access request o uri ng tulong na kailangan mo sa setup.">
                <div className="space-y-2.5">
                  <Label htmlFor="request-message" className="auth-card-label">Dagdag na Tala</Label>
                  <Textarea
                    id="request-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="Halimbawa: Ako ang bagong AEW at kailangan ko ng live account para sa farmer follow-up at reports."
                    className="auth-card-input min-h-[112px]"
                  />
                </div>
              </HoverTooltip>

              <div className="rounded-[calc(var(--radius)+4px)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Hindi agad ito automatic approval. Makakatanggap ka lang ng working login kapag na-provision na ng superadmin o barangay admin ang account mo.
              </div>

              <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Isinusumite ang request...' : 'Isumite ang Access Request'}
              </Button>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm">
              <Link href="/login" className="auth-card-link">
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

export default function RequestAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <RequestAccessPageContent />
    </Suspense>
  );
}
