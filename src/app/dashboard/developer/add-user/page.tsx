
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { userManagementSchema, type UserManagementValues } from '@/lib/schemas';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { useData } from '@/context/data-context';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { isLiveMode } from '@/lib/config/app-mode';

export default function AddUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addUser, users } = useData();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UserManagementValues>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: {
      name: '',
      email: '',
      title: '',
      phone: '',
      role: 'barangay',
      status: 'active',
      preferredWorkspace: 'simple',
    },
  });

  const handleAddUser = async (data: UserManagementValues) => {
    if (users.some(u => u.email === data.email)) {
      form.setError('email', {
        type: 'manual',
        message: 'Ang email na ito ay ginagamit na.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLiveMode) {
        const idToken = await getClientAuth().currentUser?.getIdToken();

        if (!idToken) {
          throw new Error('Walang authenticated developer session.');
        }

        const response = await fetch('/api/developer/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(data),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error ?? 'Hindi nagawa ang live user provisioning.');
        }

        if (payload.temporaryPassword && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.temporaryPassword);
        }

        toast({
          title: 'Tagumpay!',
          description: payload.temporaryPassword
            ? `Nagawa ang live account ni ${data.name}. Nakopya na sa clipboard ang pansamantalang password.`
            : `Nagawa ang live account ni ${data.name}.`,
        });
      } else {
        addUser(data);
        toast({
          title: 'Tagumpay!',
          description: `Naidagdag na ang live user profile ni ${data.name}. Hintayin ang account setup para maging active ito.`,
        });
      }

      router.push('/dashboard/developer');
    } catch (error) {
      toast({
        title: 'Hindi maidagdag ang user',
        description: error instanceof Error ? error.message : 'Hindi nagawa ang live user provisioning.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <HoverTooltip text="Bumalik sa Developer Dashboard">
            <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/developer">
                <ArrowLeft />
            </Link>
            </Button>
        </HoverTooltip>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Magdagdag ng Bagong User</h1>
          <p className="text-muted-foreground">Punan ang mga detalye ng bagong barangay staff user.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Form ng Pagpaparehistro ng User</CardTitle>
            <CardDescription>Punan ang mga detalye sa ibaba. Ang form na ito ay para sa barangay staff accounts lamang.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddUser)} className="max-w-2xl space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buong Pangalan</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan dela Cruz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="juan@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tungkulin</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Hal. Agricultural Extension Worker" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+63917..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Barangay Staff Access</p>
                <p className="mt-1">
                  Ang accounts na ginagawa sa form na ito ay para sa barangay operations lamang. Ang developer access ay pinamamahalaan sa hiwalay na secure provisioning flow.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending_setup">Pending Setup</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredWorkspace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace sa Login</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="simple">Simple Workspace</SelectItem>
                          <SelectItem value="detailed">Detailed Workspace</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Nagse-save...' : 'I-save ang User'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
