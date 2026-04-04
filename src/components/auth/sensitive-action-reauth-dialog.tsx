'use client';

import React from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientAuth } from '@/lib/firebase/auth-client';

type SensitiveActionReauthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => Promise<void> | void;
  title?: string;
  description?: string;
  submitLabel?: string;
};

export function SensitiveActionReauthDialog({
  open,
  onOpenChange,
  onVerified,
  title = 'Kumpirmahin ang iyong password',
  description = 'Para sa sensitibong aksyon na ito, kailangan munang i-verify muli ang iyong kasalukuyang password.',
  submitLabel = 'I-verify at ituloy',
}: SensitiveActionReauthDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPassword('');
      setSubmitting(false);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const auth = getClientAuth();
    const liveUser = auth.currentUser;

    if (!liveUser?.email) {
      toast({
        title: 'Walang live session',
        description: 'Hindi makita ang kasalukuyang authenticated account.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const credential = EmailAuthProvider.credential(liveUser.email, password);
      await reauthenticateWithCredential(liveUser, credential);
      await onVerified();
      setPassword('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Hindi na-verify ang password',
        description: error instanceof Error
          ? error.message || 'Suriin ang kasalukuyang password at subukang muli.'
          : 'Suriin ang kasalukuyang password at subukang muli.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sensitive-action-password">Kasalukuyang password</Label>
            <Input
              id="sensitive-action-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
              Kanselahin
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Nive-verify...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
