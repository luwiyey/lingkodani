
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SensitiveActionReauthDialog } from '@/components/auth/sensitive-action-reauth-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Shield, Edit, FileJson, Database, RefreshCcw, UserRoundPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { getManagedBarangayUsers, getPlatformDeveloperUsers } from '@/lib/access-control';
import { getStaffingCoverageSummary } from '@/lib/assignment-routing';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { getInviteLifecycleSummary } from '@/lib/invite-lifecycle';
import { getUserOnboardingSteps } from '@/lib/onboarding-checklist';
import { isLiveMode } from '@/lib/config/app-mode';
import type { AccessRequest, User } from '@/lib/types';
import { getUserRecordId } from '@/lib/user-record';

function formatListInput(values?: string[]) {
    return values?.join(', ') ?? '';
}

function parseListInput(value: string) {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
}


export default function DeveloperPage() {
    const { currentUser } = useAuth();
    const { users, updateUser, deleteUser, auditLogs, systemSettings, smsMessages } = useData();
    const { capabilities } = useRuntimeCapabilities();
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [accessRequestsLoading, setAccessRequestsLoading] = useState(false);
    const [showStepUpDialog, setShowStepUpDialog] = useState(false);
    const pendingSensitiveAction = React.useRef<(() => Promise<void>) | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingForm, setEditingForm] = useState({
      name: '',
      email: '',
      title: '',
      phone: '',
      role: 'barangay' as User['role'],
      status: 'active' as NonNullable<User['status']>,
      preferredWorkspace: 'simple' as NonNullable<User['preferredWorkspace']>,
      assignmentRole: 'owner' as NonNullable<User['assignmentRole']>,
      availabilityStatus: 'available' as NonNullable<User['availabilityStatus']>,
      shiftStartTime: '',
      shiftEndTime: '',
      assignedZones: '',
      expertiseTags: '',
      availabilityNote: '',
    });
    const { toast } = useToast();

    const barangayUsers = getManagedBarangayUsers(users);
    const developerUsers = getPlatformDeveloperUsers(users);
    const activeBarangayUsers = barangayUsers.filter((user) => user.status === 'active').length;
    const pendingSetupUsers = barangayUsers.filter((user) => user.status === 'pending_setup').length;
    const simpleWorkspaceUsers = barangayUsers.filter((user) => user.preferredWorkspace === 'simple').length;
    const namedAuditActors = new Set(auditLogs.filter((log) => log.user !== 'system').map((log) => log.user)).size;
    const pendingAccessRequests = accessRequests.filter((request) => request.status === 'pending_review' || request.status === 'reviewed');
    const staffingCoverage = getStaffingCoverageSummary({
        users,
        zoneNames: systemSettings.zoneDescriptions.map((zone) => zone.zone),
        smsMessages,
    });

    const requestStepUpVerification = (operation: () => Promise<void>) => {
        pendingSensitiveAction.current = operation;
        setShowStepUpDialog(true);
    };

    const loadAccessRequests = React.useCallback(async () => {
        if (!isLiveMode) {
            setAccessRequests([]);
            return;
        }

        if (!currentUser) {
            return;
        }

        setAccessRequestsLoading(true);

        try {
            const idToken = await getClientAuth().currentUser?.getIdToken();

            if (!idToken) {
                throw new Error('Walang authenticated superadmin session.');
            }

            const response = await fetch('/api/access-request', {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.error ?? 'Hindi makuha ang access requests.');
            }

            setAccessRequests(Array.isArray(payload.requests) ? payload.requests : []);
        } catch (error) {
            toast({
                title: 'Hindi makuha ang access requests',
                description: error instanceof Error ? error.message : 'Subukan muli pagkatapos ng ilang sandali.',
                variant: 'destructive',
            });
        } finally {
            setAccessRequestsLoading(false);
        }
    }, [currentUser, toast]);

    useEffect(() => {
        void loadAccessRequests();
    }, [loadAccessRequests]);

    const getDeveloperIdToken = async () => {
        const idToken = await getClientAuth().currentUser?.getIdToken();

        if (!idToken) {
            throw new Error('Walang authenticated superadmin session.');
        }

        return idToken;
    };

    const updateAccessRequestStatus = async (requestId: string, status: AccessRequest['status'], reviewNotes?: string) => {
        try {
            const idToken = await getDeveloperIdToken();

            const response = await fetch('/api/access-request', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    requestId,
                    status,
                    reviewNotes,
                }),
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (payload.code === 'step_up_required') {
                    requestStepUpVerification(async () => {
                        await updateAccessRequestStatus(requestId, status, reviewNotes);
                    });
                    return;
                }
                throw new Error(payload.error ?? 'Hindi ma-update ang access request.');
            }

            setAccessRequests((current) =>
                current.map((request) => (request.id === requestId ? payload.request : request))
            );
            toast({
                title: 'Na-update ang request',
                description: status === 'dismissed'
                    ? 'Tinanggal sa active queue ang access request.'
                    : 'Namarkahan na ang access request para sa susunod na provisioning step.',
            });
        } catch (error) {
            toast({
                title: 'Hindi ma-update ang request',
                description: error instanceof Error ? error.message : 'Subukan muli pagkatapos ng ilang sandali.',
                variant: 'destructive',
            });
        }
    };

    const runInviteAction = async (
      user: User,
      action: 'resend_invite' | 'revoke_invite',
      inviteRevocationReason?: string
    ) => {
      try {
        const idToken = await getDeveloperIdToken();
        const response = await fetch('/api/developer/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: getUserRecordId(user),
            action,
            inviteRevocationReason,
          }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (payload.code === 'step_up_required') {
            requestStepUpVerification(async () => {
              await runInviteAction(user, action, inviteRevocationReason);
            });
            return;
          }

          throw new Error(payload.error ?? 'Hindi na-update ang invite lifecycle.');
        }

        if (payload.profile) {
          updateUser(getUserRecordId(user), payload.profile);
        }

        toast({
          title: action === 'resend_invite' ? 'Naipadala muli ang invite' : 'Na-revoke ang invite',
          description:
            action === 'resend_invite'
              ? payload.setupLink
                ? 'Na-refresh na ang setup link at nakopya ito bilang manual fallback.'
                : 'Na-refresh na ang secure setup invite para sa user na ito.'
              : 'Naka-hold muna ang onboarding ng user na ito hanggang magpadala muli ng bagong invite.',
        });

        if (payload.setupLink && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.setupLink);
        }
      } catch (error) {
        toast({
          title: 'Hindi ma-update ang invite',
          description: error instanceof Error ? error.message : 'Subukan muli pagkatapos ng ilang sandali.',
          variant: 'destructive',
        });
      }
    };

    const submitUserEdit = async (targetUser: User, updatedUser: User) => {
        try {
            if (isLiveMode) {
                const idToken = await getDeveloperIdToken();

                const response = await fetch('/api/developer/users', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                      userId: getUserRecordId(targetUser),
                      ...updatedUser,
                    }),
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    if (payload.code === 'step_up_required') {
                        requestStepUpVerification(async () => {
                            await submitUserEdit(targetUser, updatedUser);
                        });
                        return;
                    }
                    throw new Error(payload.error ?? 'Hindi na-update ang live user.');
                }
                if (payload.profile) {
                    updateUser(getUserRecordId(targetUser), payload.profile);
                }
            } else {
                updateUser(getUserRecordId(targetUser), {
                    ...updatedUser,
                    id: targetUser.id ?? targetUser.uid ?? getUserRecordId(targetUser),
                    uid: targetUser.uid ?? targetUser.id ?? getUserRecordId(targetUser),
                });
            }

            setEditingUser(null);
            setEditingForm({
              name: '',
              email: '',
              title: '',
              phone: '',
              role: 'barangay',
              status: 'active',
              preferredWorkspace: 'simple',
              assignmentRole: 'owner',
              availabilityStatus: 'available',
              shiftStartTime: '',
              shiftEndTime: '',
              assignedZones: '',
              expertiseTags: '',
              availabilityNote: '',
            });
            toast({ title: "Tagumpay!", description: `Nai-update na ang mga detalye ni ${updatedUser.name}.` });
        } catch (error) {
            toast({
                title: "Hindi na-update ang user",
                description: error instanceof Error ? error.message : 'Hindi na-update ang live user.',
                variant: "destructive",
            });
        }
    };

    const handleEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingUser) return;

        const targetUser = editingUser;
        const updatedEmail = editingForm.email.trim().toLowerCase();

        if (users.some(u => u.email === updatedEmail && u.email !== targetUser.email)) {
            toast({ title: "Error", description: "Ang email na iyan ay ginagamit na ng ibang user.", variant: "destructive" });
            return;
        }

        const updatedUser: User = {
            ...targetUser,
            name: editingForm.name.trim(),
            email: updatedEmail,
            title: editingForm.title.trim(),
            phone: editingForm.phone.trim(),
            role: editingForm.role,
            status: editingForm.status,
            preferredWorkspace: editingForm.preferredWorkspace,
            assignmentRole: editingForm.assignmentRole,
            availabilityStatus: editingForm.availabilityStatus,
            shiftStartTime: editingForm.shiftStartTime || undefined,
            shiftEndTime: editingForm.shiftEndTime || undefined,
            assignedZones: parseListInput(editingForm.assignedZones),
            expertiseTags: parseListInput(editingForm.expertiseTags),
            availabilityNote: editingForm.availabilityNote.trim() || undefined,
        };

        await submitUserEdit(targetUser, updatedUser);
    };

    const handleDeleteUser = async (userToDelete: User) => {
        if (!userToDelete) return;

        try {
            if (isLiveMode) {
                const idToken = await getDeveloperIdToken();

                const response = await fetch('/api/developer/users', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                      userId: getUserRecordId(userToDelete),
                      email: userToDelete.email,
                    }),
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    if (payload.code === 'step_up_required') {
                        requestStepUpVerification(async () => {
                            await handleDeleteUser(userToDelete);
                        });
                        return;
                    }
                    throw new Error(payload.error ?? 'Hindi natanggal ang live user.');
                }
            } else {
                deleteUser(getUserRecordId(userToDelete));
            }

            toast({ title: "Tagumpay!", description: `Ang user na si ${userToDelete.name} ay natanggal na.`, variant: "destructive" });
        } catch (error) {
            toast({
                title: "Hindi natanggal ang user",
                description: error instanceof Error ? error.message : 'Hindi natanggal ang live user.',
                variant: "destructive",
            });
        }
    };


  return (
    <>
    <div className="flex flex-col gap-6">
      <div id="user-management" className="space-y-1">
        <div className="flex items-center">
            <Shield className="mr-2 h-6 w-6"/>
            <h1 className="text-2xl font-bold tracking-tight">Superadmin User Management</h1>
            <HelpDialog title="Pamamahala ng User" tooltipText="Pamahalaan kung sino ang maaaring maka-access sa system.">
                <p>Ang pahinang ito ay para sa superadmin o platform overseer upang pamahalaan kung sino ang maaaring maka-access sa Lingkod-Ani system para sa isang partikular na barangay.</p>
                <p><strong>Magdagdag ng User:</strong> Gamitin ang button na ito upang mag-rehistro ng isang bagong barangay user (hal., ang Barangay Captain, Secretary, o AEW). Sila ay magkakaroon ng access sa system pagkatapos maidagdag dito.</p>
                <p><strong>Workspace:</strong> Puwedeng itakda kung ang user ay magsisimula sa mas simpleng workspace o sa detailed tools sa pag-login.</p>
                <p><strong>Named audit trail:</strong> Ang paglikha, pag-edit, at pagtanggal ng user access ay naitatala rin sa audit log gamit ang pangalan ng aktwal na superadmin o staff account.</p>
                <p><strong>I-edit:</strong> I-update ang pangalan, tungkulin, status, at workspace ng isang kasalukuyang barangay user.</p>
                <p><strong>Alisin:</strong> Ang pag-alis sa isang user ay magbabawi ng kanilang access sa system.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Magdagdag, mag-edit, o mag-alis ng mga user na may access sa dashboard ng barangay, kasama ang kanilang status, recovery flow, at default workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Barangay Staff</CardTitle>
            <CardDescription>Kabuuang staff na may access profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{barangayUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active</CardTitle>
            <CardDescription>Mga aprubadong staff na puwedeng gumamit agad.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeBarangayUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Setup</CardTitle>
            <CardDescription>Mga bagong account na kailangan pang i-setup o i-approve.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingSetupUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Simple Workspace</CardTitle>
            <CardDescription>Good for older AEWs na gusto ng mas kaunting choices.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{simpleWorkspaceUsers}</p>
            <p className="mt-2 text-xs text-muted-foreground">{namedAuditActors} named actors na ang lumalabas sa audit trail.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="text-base">Staffing Coverage Watch</CardTitle>
          <CardDescription>
            Tinutukoy nito kung may zone na kulang ang may hawak, may off-shift gaps, o may staff na overloaded bago pa maapektuhan ang case response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={staffingCoverage.uncoveredZones.length > 0 ? 'destructive' : 'outline'}>
              Walang direct coverage: {staffingCoverage.uncoveredZones.length}
            </Badge>
            <Badge variant={staffingCoverage.shiftLimitedZones.length > 0 ? 'secondary' : 'outline'}>
              Shift-limited zones: {staffingCoverage.shiftLimitedZones.length}
            </Badge>
            <Badge variant={staffingCoverage.overloadedUsers.length > 0 ? 'secondary' : 'outline'}>
              Overloaded staff: {staffingCoverage.overloadedUsers.length}
            </Badge>
            <Badge variant="outline">Available responders: {staffingCoverage.availableResponders}</Badge>
          </div>
          {staffingCoverage.uncoveredZones.length > 0 ? (
            <p className="text-muted-foreground">
              Walang naka-assign na direct handler sa: <span className="font-medium text-foreground">{staffingCoverage.uncoveredZones.join(', ')}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">Lahat ng declared zones ay may kahit isang naka-assign na recipient/owner/resolver.</p>
          )}
          {staffingCoverage.shiftLimitedZones.length > 0 ? (
            <p className="text-muted-foreground">
              May zone na may naka-assign pero walang available na responder sa kasalukuyang shift:
              <span className="font-medium text-foreground"> {staffingCoverage.shiftLimitedZones.join(', ')}</span>
            </p>
          ) : null}
          {staffingCoverage.overloadedUsers.length > 0 ? (
            <p className="text-muted-foreground">
              Mataas ang open load nina:
              <span className="font-medium text-foreground">
                {' '}
                {staffingCoverage.overloadedUsers.map((user) => `${user.name} (${user.openAssignments})`).join(', ')}
              </span>
            </p>
          ) : null}
          {staffingCoverage.offShiftUsers.length > 0 ? (
            <p className="text-muted-foreground">
              Off-shift o labas sa shift ngayon:
              <span className="font-medium text-foreground"> {staffingCoverage.offShiftUsers.join(', ')}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card id="access-requests" className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRoundPlus className="h-5 w-5" />
              Mga Humihiling ng Access
            </CardTitle>
            <CardDescription>
              Public requests mula sa login/reset-password flow para sa users na wala pang live account.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadAccessRequests()} disabled={accessRequestsLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {accessRequestsLoading ? 'Nagre-refresh...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Pending: {pendingAccessRequests.length}</Badge>
            <Badge variant="outline">Provisioned: {accessRequests.filter((request) => request.status === 'provisioned').length}</Badge>
            <Badge variant="outline">Dismissed: {accessRequests.filter((request) => request.status === 'dismissed').length}</Badge>
          </div>
          {pendingAccessRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingAccessRequests.slice(0, 8).map((request) => (
                <div key={request.id} className="rounded-xl border bg-background/90 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.title ?? 'Walang inilagay na tungkulin'} {request.barangay ? `- ${request.barangay}` : ''}
                      </p>
                      {request.phone ? <p className="text-sm text-muted-foreground">Phone: {request.phone}</p> : null}
                      {request.message ? <p className="text-sm text-muted-foreground">{request.message}</p> : null}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline">Submissions: {request.submissionCount ?? 1}</Badge>
                        <Badge variant="outline">Source: {request.source ?? 'public_page'}</Badge>
                        {request.lastSubmittedAt ? (
                          <Badge variant="outline">Latest: {new Date(request.lastSubmittedAt).toLocaleString()}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href="/dashboard/developer/add-user">Mag-provision ng account</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void updateAccessRequestStatus(request.id, 'reviewed', 'Na-review na at handa nang i-provision kapag available ang staff account slot.')}
                      >
                        Mark reviewed
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void updateAccessRequestStatus(request.id, 'dismissed', 'Tinanggal mula sa active queue ng superadmin.')}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Wala pang active access requests sa ngayon.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Platform Superadmin Access</CardTitle>
          <CardDescription>
            Hiwalay na pinamamahalaan ang privileged superadmin accounts mula sa barangay staff provisioning flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            {developerUsers.map((user) => (
              <Badge key={getUserRecordId(user)} variant="outline">
                {user.name}
              </Badge>
            ))}
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Provisioning status</p>
            <p className="mt-1">
              {capabilities.reasons.superadminProvisioning ??
                'Puwedeng gumawa ng live superadmin accounts mula sa secure provisioning flow ng dashboard.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={capabilities.superadminProvisioningEnabled ? 'default' : 'secondary'}>
                {capabilities.superadminProvisioningEnabled ? 'Live provisioning enabled' : 'Live provisioning locked'}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/developer/add-superadmin">Secure Superadmin Provisioning</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <CardTitle>Listahan ng Barangay Staff</CardTitle>
                <CardDescription>Ito ang mga barangay users na pinamamahalaan sa dashboard na ito.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <HoverTooltip text="Buksan ang import/export at backup center ng buong app.">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/data-center">
                    <Database /> Data Center
                  </Link>
                </Button>
              </HoverTooltip>
              <HoverTooltip text="Tingnan at i-export ang SMS training examples na nabuo mula sa human review.">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/developer/training-data">
                    <FileJson /> Training Data
                  </Link>
                </Button>
              </HoverTooltip>
              <HoverTooltip text="Magbukas ng pahina para magdagdag ng bagong user sa system.">
                  <Button asChild>
                      <Link href="/dashboard/developer/add-user">
                          <PlusCircle /> Magdagdag ng User
                      </Link>
                  </Button>
                </HoverTooltip>
              <HoverTooltip text="Buksan ang secure provisioning page para sa privileged superadmin accounts.">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/developer/add-superadmin">
                    <UserRoundPlus /> Mag-provision ng Superadmin
                  </Link>
                </Button>
              </HoverTooltip>
            </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="px-2 md:px-4">Pangalan</TableHead>
                    <TableHead className="px-2 md:px-4">Email</TableHead>
                    <TableHead className="px-2 md:px-4">Tungkulin</TableHead>
                    <TableHead className="px-2 md:px-4">Role</TableHead>
                    <TableHead className="px-2 md:px-4">Workspace</TableHead>
                    <TableHead className="px-2 md:px-4">Status</TableHead>
                    <TableHead className="px-2 md:px-4">Routing</TableHead>
                    <TableHead className="text-right px-2 md:px-4">Mga Aksyon</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {barangayUsers.map((user) => {
                    const inviteLifecycle = getInviteLifecycleSummary(user);
                    const onboardingSteps = getUserOnboardingSteps(user);
                    const completedSteps = onboardingSteps.filter((step) => step.completed).length;

                    return (
                    <TableRow key={getUserRecordId(user)}>
                    <TableCell className="font-medium px-2 py-4 md:px-4">{user.name}</TableCell>
                    <TableCell className="px-2 py-4 md:px-4">{user.email}</TableCell>
                    <TableCell className="px-2 py-4 md:px-4">{user.title ?? '-'}</TableCell>
                    <TableCell className="px-2 py-4 md:px-4"><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell className="px-2 py-4 md:px-4"><Badge variant="outline">{user.preferredWorkspace ?? 'simple'}</Badge></TableCell>
                    <TableCell className="px-2 py-4 md:px-4">
                      <div className="flex flex-col items-start gap-2">
                        <Badge variant={user.status === 'disabled' ? 'destructive' : user.status === 'active' ? 'default' : 'outline'}>{user.status ?? 'active'}</Badge>
                        {user.inviteDeliveryStatus ? (
                          <Badge variant="outline">
                            invite: {user.inviteDeliveryStatus}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">{inviteLifecycle.label}</Badge>
                        <Badge variant="outline">onboarding: {completedSteps}/{onboardingSteps.length}</Badge>
                        {inviteLifecycle.expiresAt ? (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(inviteLifecycle.expiresAt).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-4 md:px-4">
                      <div className="flex flex-col items-start gap-2">
                        <Badge variant="outline">{user.assignmentRole ?? 'owner'}</Badge>
                        <Badge
                          variant={
                            user.availabilityStatus === 'busy'
                              ? 'secondary'
                              : user.availabilityStatus === 'off_shift'
                                ? 'destructive'
                                : 'default'
                          }
                        >
                          {user.availabilityStatus ?? 'available'}
                        </Badge>
                        {user.shiftStartTime || user.shiftEndTime ? (
                          <p className="text-xs text-muted-foreground">
                            shift: {user.shiftStartTime || '--:--'} to {user.shiftEndTime || '--:--'}
                          </p>
                        ) : null}
                        {user.assignedZones?.length ? (
                          <p className="text-xs text-muted-foreground">
                            zones: {user.assignedZones.join(', ')}
                          </p>
                        ) : null}
                        {user.expertiseTags?.length ? (
                          <p className="text-xs text-muted-foreground">
                            expertise: {user.expertiseTags.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-2 py-4 md:px-4">
                       <div className="flex flex-wrap gap-2 justify-end">
                          <HoverTooltip text="I-edit ang mga detalye ng user na ito.">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setEditingUser(user);
                                 setEditingForm({
                                   name: user.name,
                                   email: user.email,
                                   title: user.title ?? '',
                                   phone: user.phone ?? '',
                                   role: user.role,
                                   status: user.status ?? 'active',
                                   preferredWorkspace: user.preferredWorkspace ?? (user.role === 'developer' ? 'detailed' : 'simple'),
                                   assignmentRole: user.assignmentRole ?? 'owner',
                                   availabilityStatus: user.availabilityStatus ?? (user.status === 'disabled' ? 'off_shift' : 'available'),
                                   shiftStartTime: user.shiftStartTime ?? '',
                                   shiftEndTime: user.shiftEndTime ?? '',
                                   assignedZones: formatListInput(user.assignedZones),
                                   expertiseTags: formatListInput(user.expertiseTags),
                                   availabilityNote: user.availabilityNote ?? '',
                                 });
                               }}
                             ><Edit /> I-edit</Button>
                          </HoverTooltip>
                          {user.status === 'pending_setup' ? (
                            <HoverTooltip text="Magpadala muli ng secure setup invite o manual fallback link.">
                              <Button variant="outline" size="sm" onClick={() => void runInviteAction(user, 'resend_invite')}>
                                <RefreshCcw /> Resend Invite
                              </Button>
                            </HoverTooltip>
                          ) : null}
                          {user.status === 'pending_setup' && inviteLifecycle.status !== 'revoked' && inviteLifecycle.status !== 'accepted' ? (
                            <HoverTooltip text="I-hold muna ang onboarding hanggang manual na i-resend muli ang invite.">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void runInviteAction(user, 'revoke_invite', 'Pansamantalang naka-hold habang nire-review muli ang access at onboarding details.')}
                              >
                                Revoke Invite
                              </Button>
                            </HoverTooltip>
                          ) : null}
                          <AlertDialog>
                              <HoverTooltip text="Permanenteng alisin ang user na ito sa system.">
                                <span className="inline-flex">
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm"><Trash2 /> Alisin</Button>
                                  </AlertDialogTrigger>
                                </span>
                              </HoverTooltip>
                              <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Sigurado ka ba?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  Ang aksyon na ito ay mag-aalis ng access ni {user.name} sa system.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user)}>Ituloy</AlertDialogAction>
                              </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                       </div>
                    </TableCell>
                    </TableRow>
                )})}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

    {editingUser && (
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                  <DialogTitle>I-edit ang User</DialogTitle>
                  <DialogDescription>I-update ang mga detalye para kay {editingUser.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditUser}>
                  <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                          <Label htmlFor="edit-name">Buong Pangalan</Label>
                          <Input id="edit-name" value={editingForm.name} onChange={(event) => setEditingForm(current => ({ ...current, name: event.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="edit-email">Email Address</Label>
                          <Input id="edit-email" type="email" value={editingForm.email} onChange={(event) => setEditingForm(current => ({ ...current, email: event.target.value }))} required readOnly={isLiveMode} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="edit-title">Tungkulin</Label>
                          <Input id="edit-title" value={editingForm.title} onChange={(event) => setEditingForm(current => ({ ...current, title: event.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="edit-phone">Mobile Number</Label>
                          <Input id="edit-phone" value={editingForm.phone} onChange={(event) => setEditingForm(current => ({ ...current, phone: event.target.value }))} required />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                          <Label>Role</Label>
                          <Input value="Barangay Staff" readOnly />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="edit-status">Status</Label>
                          <Select value={editingForm.status} onValueChange={(value) => setEditingForm(current => ({ ...current, status: value as NonNullable<User['status']> }))} required>
                              <SelectTrigger id="edit-status">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="pending_setup">Pending Setup</SelectItem>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="edit-workspace">Workspace</Label>
                          <Select value={editingForm.preferredWorkspace} onValueChange={(value) => setEditingForm(current => ({ ...current, preferredWorkspace: value as NonNullable<User['preferredWorkspace']> }))} required>
                              <SelectTrigger id="edit-workspace">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="simple">Simple Workspace</SelectItem>
                                  <SelectItem value="detailed">Detailed Workspace</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">Routing at field coverage</p>
                              <p className="text-sm text-muted-foreground">
                                  Ito ang batayan ng system kapag pumipili ng tatanggap, may hawak, o resolver ng incoming cases.
                              </p>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                  <Label htmlFor="edit-assignment-role">Assignment Role</Label>
                                  <Select value={editingForm.assignmentRole} onValueChange={(value) => setEditingForm(current => ({ ...current, assignmentRole: value as NonNullable<User['assignmentRole']> }))}>
                                      <SelectTrigger id="edit-assignment-role">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="recipient">Recipient / First Touch</SelectItem>
                                          <SelectItem value="owner">Case Owner</SelectItem>
                                          <SelectItem value="resolver">Resolving Officer</SelectItem>
                                          <SelectItem value="supervisor">Supervisor / Escalation</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-availability-status">Availability</Label>
                                  <Select value={editingForm.availabilityStatus} onValueChange={(value) => setEditingForm(current => ({ ...current, availabilityStatus: value as NonNullable<User['availabilityStatus']> }))}>
                                      <SelectTrigger id="edit-availability-status">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="available">Available</SelectItem>
                                          <SelectItem value="busy">Busy / Limited</SelectItem>
                                          <SelectItem value="off_shift">Off Shift</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-shift-start">Shift Start</Label>
                                  <Input id="edit-shift-start" type="time" value={editingForm.shiftStartTime} onChange={(event) => setEditingForm(current => ({ ...current, shiftStartTime: event.target.value }))} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-shift-end">Shift End</Label>
                                  <Input id="edit-shift-end" type="time" value={editingForm.shiftEndTime} onChange={(event) => setEditingForm(current => ({ ...current, shiftEndTime: event.target.value }))} />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="edit-assigned-zones">Assigned Zones</Label>
                                  <Input id="edit-assigned-zones" value={editingForm.assignedZones} onChange={(event) => setEditingForm(current => ({ ...current, assignedZones: event.target.value }))} placeholder="Zone 1, Zone 2" />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="edit-expertise-tags">Expertise Tags</Label>
                                  <Input id="edit-expertise-tags" value={editingForm.expertiseTags} onChange={(event) => setEditingForm(current => ({ ...current, expertiseTags: event.target.value }))} placeholder="pest, weather, field, coordination" />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="edit-availability-note">Availability Note</Label>
                                  <Textarea id="edit-availability-note" value={editingForm.availabilityNote} onChange={(event) => setEditingForm(current => ({ ...current, availabilityNote: event.target.value }))} placeholder="Hal. Nasa field tuwing umaga; tawagan muna bago i-assign sa gabi." />
                              </div>
                          </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                      <Button type="submit">I-save ang mga Pagbabago</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    )}

    <SensitiveActionReauthDialog
      open={showStepUpDialog}
      onOpenChange={setShowStepUpDialog}
      title="Kumpirmahin ang password para sa developer actions"
      description="Bago mag-edit, mag-provision, mag-dismiss ng access request, o magpadala ng invite, kailangan muna ng fresh password verification."
      submitLabel="I-verify at ituloy"
      onVerified={async () => {
        const action = pendingSensitiveAction.current;
        pendingSensitiveAction.current = null;

        if (action) {
          await action();
        }
      }}
    />
    </>
  );
}
