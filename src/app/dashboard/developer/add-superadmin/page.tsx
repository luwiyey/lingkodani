'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

import { SensitiveActionReauthDialog } from '@/components/auth/sensitive-action-reauth-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { userManagementSchema, type UserManagementValues } from '@/lib/schemas';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { isLiveMode } from '@/lib/config/app-mode';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';

export default function AddSuperadminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addUser, users } = useData();
  const { capabilities } = useRuntimeCapabilities();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showStepUpDialog, setShowStepUpDialog] = React.useState(false);
  const [pendingSubmission, setPendingSubmission] = React.useState<UserManagementValues | null>(null);

  const liveProvisioningLocked = isLiveMode && !capabilities.superadminProvisioningEnabled;

  const form = useForm<UserManagementValues>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: {
      name: '',
      email: '',
      title: 'Municipal System Overseer',
      phone: '',
      role: 'developer',
      status: 'pending_setup',
      preferredWorkspace: 'detailed',
      assignmentRole: 'supervisor',
      availabilityStatus: 'available',
      shiftStartTime: '',
      shiftEndTime: '',
      assignedZones: [],
      expertiseTags: [],
      availabilityNote: 'Privileged superadmin account for oversight, recovery support, and export governance.',
    },
  });

  const submitProvisioning = async (data: UserManagementValues) => {
    if (users.some((user) => user.email === data.email)) {
      form.setError('email', {
        type: 'manual',
        message: 'Ang email na ito ay ginagamit na.',
      });
      return;
    }

    if (liveProvisioningLocked) {
      toast({
        title: 'Naka-lock ang live superadmin provisioning',
        description:
          capabilities.reasons.superadminProvisioning ??
          'Ang privileged superadmin accounts ay kailangang i-set up muna sa secure Firebase/Auth at user-profile admin flow.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLiveMode) {
        const idToken = await getClientAuth().currentUser?.getIdToken();

        if (!idToken) {
          throw new Error('Walang authenticated superadmin session.');
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
          if (payload.code === 'step_up_required') {
            setPendingSubmission(data);
            setShowStepUpDialog(true);
            return;
          }

          throw new Error(payload.error ?? 'Hindi nagawa ang live superadmin provisioning.');
        }

        if (payload.setupLink && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.setupLink);
        }

        toast({
          title: 'Tagumpay!',
          description:
            payload.inviteDeliveryStatus === 'emailed'
              ? `Nagawa ang live superadmin account ni ${data.name}, at naipadala na ang secure setup email.`
              : payload.setupLink
                ? `Nagawa ang live superadmin account ni ${data.name}. Nakopya na sa clipboard ang secure setup link bilang manual fallback.`
                : `Nagawa ang live superadmin account ni ${data.name}.`,
        });
      } else {
        addUser(data);
        toast({
          title: 'Tagumpay!',
          description: `Naidagdag ang preview superadmin account ni ${data.name} para sa demo/testing workspace.`,
        });
      }

      router.push('/dashboard/developer');
    } catch (error) {
      toast({
        title: 'Hindi maidagdag ang superadmin',
        description: error instanceof Error ? error.message : 'Hindi nagawa ang secure superadmin provisioning.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <HoverTooltip text="Bumalik sa Superadmin Dashboard">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/developer">
              <ArrowLeft />
            </Link>
          </Button>
        </HoverTooltip>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Mag-provision ng Superadmin</h1>
          <p className="text-muted-foreground">Secure provisioning para sa municipal/system-level oversight account.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Superadmin Provisioning Status
          </CardTitle>
          <CardDescription>
            Ang superadmin account ay para sa user recovery, audit oversight, export control, at cross-workspace monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {capabilities.reasons.superadminProvisioning ??
              'Puwedeng gumawa ng privileged superadmin account mula sa secure provisioning flow na ito.'}
          </p>
          <p>
            Ang role na ito ay hindi para sa araw-araw na barangay encoding. Ito ay para sa municipal/platform oversight, user recovery support,
            audit review, at high-level analytics/export governance.
          </p>
          {liveProvisioningLocked ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              Naka-lock ang live superadmin provisioning sa build na ito. Maaari pa ring gamitin ang page na ito bilang documentation at preview ng intended secure flow.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secure Superadmin Details</CardTitle>
          <CardDescription>
            Ang bagong account na gagawin dito ay may privileged superadmin access at default detailed workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitProvisioning)} className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Provisioning notes</p>
                <p className="mt-1">
                  Ang account na ito ay auto-tagged bilang privileged superadmin. Hindi ito kasama sa ordinaryong barangay staff provisioning flow at
                  dapat lamang gamitin para sa system oversight at recovery support.
                </p>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buong Pangalan</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Maria Santos" />
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
                      <Input type="email" {...field} placeholder="superadmin@lingkodani.gov.ph" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tungkulin</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Municipal Agriculture Office" />
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
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy / Limited</SelectItem>
                          <SelectItem value="off_shift">Off Shift</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <p className="font-medium">Auto-applied privileged defaults</p>
                <p className="mt-1">Role: Superadmin / Preferred workspace: Detailed / Assignment role: Supervisor</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting || liveProvisioningLocked}>
                  {isSubmitting ? 'Nagpo-provision...' : 'I-provision ang Superadmin'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/developer">Bumalik sa dashboard</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <SensitiveActionReauthDialog
        open={showStepUpDialog}
        onOpenChange={setShowStepUpDialog}
        title="Kumpirmahin ang password para sa superadmin provisioning"
        description="Kailangan ng panibagong pagpapatunay bago gumawa ng privileged superadmin account."
        onVerified={async () => {
          if (!pendingSubmission) {
            return;
          }

          setShowStepUpDialog(false);
          const queued = pendingSubmission;
          setPendingSubmission(null);
          await submitProvisioning(queued);
        }}
      />
    </div>
  );
}
