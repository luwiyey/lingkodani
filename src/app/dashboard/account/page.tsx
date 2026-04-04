'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

import { SensitiveActionReauthDialog } from '@/components/auth/sensitive-action-reauth-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpDialog } from "@/components/ui/help-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { isLiveMode } from '@/lib/config/app-mode';
import { getUserOnboardingSteps, isUserOnboardingComplete } from '@/lib/onboarding-checklist';
import { readOnboardingProfile, saveDemoPreviewUser, saveOnboardingProfile } from '@/lib/onboarding';
import { createInitialsAvatarDataUrl } from '@/lib/avatar-placeholder';
import { uploadUserAvatarFile } from '@/lib/services/profile-avatar-file-service';
import type { User } from '@/lib/types';
import { getUserRecordId } from '@/lib/user-record';

type AccountProfilePatch = Omit<
  Partial<User>,
  'phoneVerifiedAt' | 'privacyAcknowledgedAt' | 'securityReviewVerifiedAt'
> & {
  phoneVerifiedAt?: boolean;
  privacyAcknowledgedAt?: boolean;
  securityReviewVerifiedAt?: boolean;
  completeOnboarding?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Walang tala';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AccountSettingsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const photoUploadRef = React.useRef<HTMLInputElement>(null);
  const { currentUser, currentUserProfile } = useAuth();
  const { updateUser, users, farmers, resetDemoData } = useData();
  const [newEmailAddress, setNewEmailAddress] = React.useState('');
  const [workspacePreference, setWorkspacePreference] = React.useState<User['preferredWorkspace']>('simple');
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [savingOnboardingAction, setSavingOnboardingAction] = React.useState<string | null>(null);
  const [showSecurityVerificationDialog, setShowSecurityVerificationDialog] = React.useState(false);

  const liveProfile = React.useMemo(() => {
    if (currentUserProfile) return currentUserProfile;
    if (!currentUser?.email) return null;

    return users.find((user) => user.email === currentUser.email) ?? null;
  }, [currentUser, currentUserProfile, users]);

  const profile: User = React.useMemo(() => {
    if (liveProfile) return liveProfile;

    return {
      id: 'brgy-admin@lingkodani.gov.ph',
      email: 'brgy-admin@lingkodani.gov.ph',
      name: 'Brgy. Admin',
      role: 'barangay',
      title: 'Barangay Administrator',
      barangay: 'Batakil',
      phone: '+639171111111',
      avatarUrl: createInitialsAvatarDataUrl('Brgy. Admin'),
      status: 'active',
    };
  }, [liveProfile]);

  const isPreviewSession = React.useMemo(
    () => !currentUser && Boolean(profile.id?.startsWith('preview-')),
    [currentUser, profile.id]
  );

  React.useEffect(() => {
    setWorkspacePreference(profile.preferredWorkspace ?? 'simple');
  }, [profile.preferredWorkspace]);

  const onboardingSteps = React.useMemo(() => getUserOnboardingSteps(profile), [profile]);
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.completed).length;
  const onboardingProgress = onboardingSteps.length > 0
    ? Math.round((completedOnboardingSteps / onboardingSteps.length) * 100)
    : 0;
  const onboardingComplete = isUserOnboardingComplete(profile);
  const needsOnboardingAttention =
    searchParams.get('onboarding') === '1' || profile.status === 'pending_setup';

  const saveLiveProfile = React.useCallback(async (changes: AccountProfilePatch) => {
    const liveUser = getClientAuth().currentUser;
    const idToken = await liveUser?.getIdToken(true);

    if (!idToken) {
      throw new Error('Walang authenticated live session para sa account na ito.');
    }

    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(changes),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? 'Hindi na-save ang live account profile.');
    }

    return payload.profile as User;
  }, []);

  const handlePhotoUploadClick = () => {
    photoUploadRef.current?.click();
  };

  const persistProfile = async (
    nextProfile: User,
    successMessage: string,
    extraChanges?: {
      phoneVerifiedAt?: boolean;
      privacyAcknowledgedAt?: boolean;
      securityReviewVerifiedAt?: boolean;
      completeOnboarding?: boolean;
    }
  ) => {
    if (isPreviewSession) {
      saveDemoPreviewUser(nextProfile);
    } else if (!isLiveMode) {
      updateUser(getUserRecordId(profile), nextProfile);
    } else {
      const liveUser = getClientAuth().currentUser;

      if (liveUser) {
        await updateProfile(liveUser, {
          displayName: nextProfile.name,
          photoURL: nextProfile.avatarUrl ?? null,
        }).catch(() => {
          // Keep the Firestore profile as the source of truth even if Auth profile sync lags.
        });
      }

      await saveLiveProfile({
        name: nextProfile.name,
        title: nextProfile.title,
        barangay: nextProfile.barangay,
        phone: nextProfile.phone,
        avatarUrl: nextProfile.avatarUrl,
        preferredWorkspace: nextProfile.preferredWorkspace,
        phoneVerifiedAt: extraChanges?.phoneVerifiedAt,
        privacyAcknowledgedAt: extraChanges?.privacyAcknowledgedAt,
        securityReviewVerifiedAt: extraChanges?.securityReviewVerifiedAt,
        completeOnboarding: extraChanges?.completeOnboarding,
      });
    }

    const currentOnboarding = readOnboardingProfile();
    if (currentOnboarding) {
      saveOnboardingProfile({
        ...currentOnboarding,
        preferredWorkspace: nextProfile.preferredWorkspace ?? currentOnboarding.preferredWorkspace,
      });
    }

    toast({
      title: 'Tagumpay!',
      description: successMessage,
    });
  };

  const handleOnboardingProfileUpdate = async (
    nextProfile: User,
    successMessage: string,
    extraChanges?: {
      phoneVerifiedAt?: boolean;
      privacyAcknowledgedAt?: boolean;
      securityReviewVerifiedAt?: boolean;
      completeOnboarding?: boolean;
    }
  ) => {
    setSavingOnboardingAction(successMessage);

    try {
      await persistProfile(nextProfile, successMessage, extraChanges);
    } catch (error) {
      toast({
        title: 'Hindi na-update ang onboarding',
        description: error instanceof Error ? error.message : 'Subukan muli pagkatapos ng ilang sandali.',
        variant: 'destructive',
      });
    } finally {
      setSavingOnboardingAction(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    e.target.value = '';
    setIsUploadingAvatar(true);

    try {
      const uploadResult = await uploadUserAvatarFile(file, profile.uid ?? profile.email);
      const nextProfile: User = {
        ...profile,
        avatarUrl: uploadResult.url,
      };

      await persistProfile(nextProfile, `Na-update na ang profile picture gamit ang "${file.name}".`);
    } catch (error) {
      toast({
        title: 'Hindi na-save ang larawan',
        description: error instanceof Error ? error.message : 'Hindi na-save ang live profile photo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const nextProfile: User = {
      ...profile,
      name: String(formData.get('displayName') ?? profile.name),
      title: String(formData.get('title') ?? profile.title ?? ''),
      barangay: String(formData.get('barangay') ?? profile.barangay ?? ''),
      phone: String(formData.get('phone') ?? profile.phone ?? ''),
      phoneVerifiedAt:
        String(formData.get('phone') ?? profile.phone ?? '') !== (profile.phone ?? '')
          ? ''
          : profile.phoneVerifiedAt,
      preferredWorkspace: workspacePreference ?? 'simple',
      updatedAt: new Date().toISOString(),
    };

    void persistProfile(nextProfile, 'Nai-save na ang iyong profile at workspace preference.').catch((error) => {
      toast({
        title: 'Hindi na-save ang profile',
        description: error instanceof Error ? error.message : 'Hindi na-save ang live account profile.',
        variant: 'destructive',
      });
    });
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const nextPassword = String(formData.get('newPassword') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (nextPassword !== confirmPassword) {
      toast({
        title: 'Hindi tugma ang password',
        description: 'Siguraduhing magkapareho ang bagong password at kumpirmasyon.',
        variant: 'destructive',
      });
      return;
    }

    if (isLiveMode) {
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

      try {
        const credential = EmailAuthProvider.credential(liveUser.email, currentPassword);
        await reauthenticateWithCredential(liveUser, credential);
        await updatePassword(liveUser, nextPassword);
        toast({
          title: 'Tagumpay!',
          description: 'Nai-update na ang live account password.',
        });
        e.currentTarget.reset();
      } catch {
        toast({
          title: 'Hindi na-update ang password',
          description: 'Suriin ang kasalukuyang password at subukang muli.',
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: 'Tagumpay!',
      description: 'Nai-save na ang iyong bagong password.',
    });
  };
  
  const handleChangeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const currentPassword = String(formData.get('currentEmailPassword') ?? '');
      const nextEmail = newEmailAddress.trim().toLowerCase();

      if (!nextEmail) {
        toast({
          title: "Kulang ang impormasyon",
          description: "Maglagay ng bagong email address.",
          variant: 'destructive',
        });
        return;
      }

      if (isLiveMode) {
        const auth = getClientAuth();
        const liveUser = auth.currentUser;

        if (!liveUser?.email) {
          toast({
            title: "Walang live session",
            description: "Hindi makita ang kasalukuyang authenticated account.",
            variant: 'destructive',
          });
          return;
        }

        try {
          const credential = EmailAuthProvider.credential(liveUser.email, currentPassword);
          await reauthenticateWithCredential(liveUser, credential);
          await updateEmail(liveUser, nextEmail);

          await saveLiveProfile({
            email: nextEmail,
          });
          toast({
            title: "Tagumpay!",
            description: "Nai-update na ang live email address at user profile record.",
          });
          setNewEmailAddress('');
        } catch {
          toast({
            title: "Hindi nabago ang email",
            description: "Suriin ang kasalukuyang password at tiyaking valid ang bagong email address.",
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
          title: "Kahilingan Ipinadala",
          description: "Isang verification link ang ipinadala sa iyong bagong email address.",
      });
  };

  const handleResetDemo = () => {
    resetDemoData();
    toast({
      title: 'Na-reset ang Demo Data',
      description: 'Naibalik sa initial mock dataset ang lahat ng central data.',
    });
  };

  const handleConfirmPhone = () => {
    const timestamp = new Date().toISOString();
    void handleOnboardingProfileUpdate(
      {
        ...profile,
        phoneVerifiedAt: timestamp,
      },
      'Nakumpirma na ang mobile number para sa onboarding.',
      { phoneVerifiedAt: true }
    );
  };

  const handleAcknowledgePrivacy = () => {
    const timestamp = new Date().toISOString();
    void handleOnboardingProfileUpdate(
      {
        ...profile,
        privacyAcknowledgedAt: timestamp,
      },
      'Namarkahan na ang privacy at data-handling review.',
      { privacyAcknowledgedAt: true }
    );
  };

  const handleFinalizeOnboarding = () => {
    const timestamp = new Date().toISOString();
    void handleOnboardingProfileUpdate(
      {
        ...profile,
        status: 'active',
        updatedAt: timestamp,
      },
      'Kumpleto na ang onboarding at active na ang account mo.',
      { completeOnboarding: true }
    );
  };

  const avatarSrc = profile.avatarUrl || currentUser?.photoURL || undefined;
  const avatarFallback = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const assignmentLabel = profile.role === 'developer' ? 'Area / Assignment' : 'Barangay / Assignment';
  const archivedFarmerCount = React.useMemo(
    () => farmers.filter((farmer) => farmer.status === 'archived').length,
    [farmers]
  );

  return (
    <div className="flex flex-col gap-8">
      <Input type="file" ref={photoUploadRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
      <div className="space-y-1">
        <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Mga Setting ng Account</h1>
            <HelpDialog title="Mga Setting ng Account" tooltipText="Pamahalaan ang iyong profile at seguridad.">
                <p>Dito mo pinapamahalaan ang live user profile na nakakabit sa iyong authenticated account.</p>
                <p><strong>Profile:</strong> Naka-store ang pangalan, tungkulin, contact details, at larawan sa user record.</p>
                <p><strong>Pag-login at Seguridad:</strong> Nakakonekta ang page na ito sa kasalukuyang authenticated session.</p>
                <p><strong>Mga Pananggalang sa Privacy ng Data:</strong> Ipinapakita rito ang mga patakaran at susunod na hakbang para sa proteksyon ng data.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Pamahalaan ang iyong profile, seguridad, at mga setting ng privacy.</p>
      </div>

      {needsOnboardingAttention ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Checklist ng Unang Setup</CardTitle>
                <CardDescription>
                  {profile.status === 'pending_setup'
                    ? 'Tapusin ang mga hakbang na ito para maging ganap na active ang account mo.'
                    : 'Narito ang kasalukuyang onboarding at security readiness ng account mo.'}
                </CardDescription>
              </div>
              <Badge variant={onboardingComplete ? 'default' : 'outline'}>
                {completedOnboardingSteps}/{onboardingSteps.length} kumpleto
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Progress</span>
                <span className="text-muted-foreground">{onboardingProgress}%</span>
              </div>
              <Progress value={onboardingProgress} />
            </div>

            <div className="space-y-3">
              {onboardingSteps.map((step) => (
                <div key={step.id} className="flex flex-col gap-3 rounded-xl border bg-background/90 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{step.label}</p>
                      <Badge variant={step.completed ? 'default' : 'outline'}>
                        {step.completed ? 'Kumpleto' : 'Kailangan pa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.completedAt ? (
                      <p className="text-xs text-muted-foreground">Huling kumpirmado: {formatDateTime(step.completedAt)}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!step.completed && step.id === 'contact_number' ? (
                      profile.phone?.trim() ? (
                        <Button
                          variant="outline"
                          onClick={handleConfirmPhone}
                          disabled={savingOnboardingAction !== null}
                        >
                          Kumpirmahin ang mobile number
                        </Button>
                      ) : (
                        <Badge variant="outline">Maglagay muna ng mobile number sa profile</Badge>
                      )
                    ) : null}
                    {!step.completed && step.id === 'privacy' ? (
                      <Button
                        variant="outline"
                        onClick={handleAcknowledgePrivacy}
                        disabled={savingOnboardingAction !== null}
                      >
                        Nabasa ko na ang privacy notes
                      </Button>
                    ) : null}
                    {!step.completed && step.id === 'security' ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowSecurityVerificationDialog(true)}
                        disabled={savingOnboardingAction !== null}
                      >
                        I-verify ang password
                      </Button>
                    ) : null}
                    {!step.completed && (step.id === 'profile_details' || step.id === 'workspace') ? (
                      <Badge variant="outline">I-update at i-save sa profile form sa ibaba</Badge>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>
                {onboardingComplete
                  ? 'Kumpleto na ang onboarding checklist. Maaari nang i-finalize ang activation kung pending setup pa ang account.'
                  : "Hindi pa active ang buong onboarding flow hangga't may kulang sa checklist na ito."}
              </p>
              <Button
                onClick={handleFinalizeOnboarding}
                disabled={!onboardingComplete || profile.status === 'active' || savingOnboardingAction !== null}
              >
                {profile.status === 'active' ? 'Active na ang account' : 'Tapusin ang onboarding'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

       <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
                <CardTitle>Live Profile Record</CardTitle>
                <HelpDialog title="Live Profile Record" tooltipText="Tingnan at i-update ang live user profile.">
                    <p>Ang impormasyon dito ay binabasa mula sa aktwal na authenticated user at sa live-backed user profile record.</p>
                    <p><strong>Role:</strong> Ipinapakita ang access level na ginagamit para sa app at Firestore rules.</p>
                </HelpDialog>
            </div>
            <CardDescription>
              Aktuwal na detalye ng kasalukuyang account sa kasalukuyang session.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={profile.role === 'developer' ? 'destructive' : 'secondary'}>
              {profile.role}
            </Badge>
            <Badge variant="outline">{profile.status ?? 'active'}</Badge>
          </div>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-6">
              <div className="flex items-center gap-6 flex-wrap">
                  <HoverTooltip text="Ito ang iyong kasalukuyang larawan sa profile.">
                      <Avatar className="h-24 w-24">
                          <AvatarImage src={avatarSrc} alt={profile.name} />
                          <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </Avatar>
                  </HoverTooltip>
                  <div className="space-y-2">
                    <HoverTooltip text="Pumili ng bagong larawan mula sa iyong device. Ang avatar ay ise-save bilang live uploaded file, hindi bilang raw image data sa profile record.">
                        <Button type="button" variant="outline" onClick={handlePhotoUploadClick} disabled={isUploadingAvatar}>
                          {isUploadingAvatar ? 'Ina-upload ang larawan...' : 'Mag-upload ng Bagong Larawan'}
                        </Button>
                    </HoverTooltip>
                    <p className="text-xs text-muted-foreground">
                      Auth email: {currentUser?.email ?? profile.email}
                    </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="displayName">Pangalan</Label>
                      <Input id="displayName" name="displayName" defaultValue={profile.name} required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="title">Tungkulin</Label>
                      <Input id="title" name="title" defaultValue={profile.title ?? ''} placeholder="Hal. Barangay Administrator" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={currentUser?.email ?? profile.email} readOnly />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <Input id="phone" name="phone" defaultValue={profile.phone ?? ''} placeholder="+63917..." />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="barangay">{assignmentLabel}</Label>
                      <Input id="barangay" name="barangay" defaultValue={profile.barangay ?? ''} />
                  </div>
                  {profile.role === 'developer' ? (
                    <div className="space-y-3 md:col-span-2">
                      <Label>Workspace sa Dashboard</Label>
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Developer Console</p>
                        <p className="mt-1">
                          Ang developer accounts ay laging binubuksan sa developer console para sa user management,
                          data oversight, at platform administration.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 md:col-span-2">
                        <Label>Workspace sa Dashboard</Label>
                        <RadioGroup value={workspacePreference ?? 'simple'} onValueChange={(value) => setWorkspacePreference(value as User['preferredWorkspace'])} className="grid gap-3 md:grid-cols-2">
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                            <RadioGroupItem value="simple" id="workspace-simple" className="mt-1" />
                            <div>
                              <p className="font-medium">Simple</p>
                              <p className="text-sm text-muted-foreground">Mas mabilis maintindihan at mas kaunting choices sa screen.</p>
                            </div>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                            <RadioGroupItem value="detailed" id="workspace-detailed" className="mt-1" />
                            <div>
                              <p className="font-medium">Detalyado</p>
                              <p className="text-sm text-muted-foreground">Mas maraming controls at mas kumpletong analysis tools.</p>
                            </div>
                          </label>
                        </RadioGroup>
                    </div>
                  )}
                  <div className="space-y-2">
                      <Label>Huling Login</Label>
                      <Input value={formatDateTime(profile.lastLoginAt ?? currentUser?.metadata.lastSignInTime ?? null)} readOnly />
                  </div>
              </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit">I-save ang Profile</Button>
          </CardFooter>
        </form>
      </Card>
      
       <Card>
        <CardHeader>
          <div className="flex items-center">
            <CardTitle>Pag-login at Seguridad</CardTitle>
             <HelpDialog title="Pag-login at Seguridad" tooltipText="Baguhin ang iyong password o email.">
                <p>Panatilihing secure ang iyong account.</p>
                <p><strong>Live session:</strong> Kapag nasa live mode, ang email at authentication state ay nanggagaling sa Firebase Authentication.</p>
             </HelpDialog>
          </div>
          <CardDescription>I-update ang iyong password at tingnan ang status ng iyong login account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <h3 className="font-semibold text-lg">Baguhin ang Password</h3>
              <HoverTooltip text="Ilagay ang iyong kasalukuyang password.">
                  <div className="space-y-2">
                      <Label htmlFor="current-password">Kasalukuyang Password</Label>
                      <Input id="current-password" name="currentPassword" type="password" required />
                  </div>
              </HoverTooltip>
              <HoverTooltip text="Ilagay ang iyong nais na bagong password.">
                  <div className="space-y-2">
                      <Label htmlFor="new-password">Bagong Password</Label>
                      <Input id="new-password" name="newPassword" type="password" required />
                  </div>
              </HoverTooltip>
               <HoverTooltip text="Kumpirmahin ang iyong bagong password.">
                   <div className="space-y-2">
                      <Label htmlFor="confirm-password">Kumpirmahin ang Bagong Password</Label>
                      <Input id="confirm-password" name="confirmPassword" type="password" required />
                  </div>
              </HoverTooltip>
              <HoverTooltip text="I-save ang mga pagbabago sa iyong password.">
                  <Button type="submit">I-save ang Bagong Password</Button>
              </HoverTooltip>
            </form>

            <Separator />

            <form onSubmit={handleChangeEmail} className="space-y-4 max-w-sm">
              <h3 className="font-semibold text-lg">Baguhin ang Email Address</h3>
              <div className="space-y-2">
                <Label>Kasalukuyang Email</Label>
                 <Input id="current-email" type="email" value={currentUser?.email ?? profile.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Bagong Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="ilagay ang iyong bagong email address"
                  value={newEmailAddress}
                  onChange={(e) => setNewEmailAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-email-password">Kasalukuyang Password</Label>
                <Input
                  id="current-email-password"
                  name="currentEmailPassword"
                  type="password"
                  placeholder="Ilagay ang kasalukuyang password"
                  required={isLiveMode}
                />
              </div>
              <HoverTooltip text="Simulan ang proseso ng pagbabago ng iyong email address.">
                  <Button type="submit">Baguhin ang Email</Button>
              </HoverTooltip>
              <p className="text-xs text-muted-foreground pt-2">
                {isLiveMode
                  ? 'Sa live mode, rere-authenticate muna ang user bago baguhin ang Firebase email at profile record.'
                  : 'Ang pag-click sa "Baguhin ang Email" ay magpapadala ng link sa pag-verify sa iyong bagong email address.'}
              </p>
            </form>
        </CardContent>
       </Card>
      
       <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
                <CardTitle>Mga Pananggalang sa Privacy ng Data</CardTitle>
                <HelpDialog title="Privacy ng Data" tooltipText="Alamin ang tungkol sa proteksyon ng data.">
                    <p>Ang sistemang ito ay idinisenyo upang sumunod sa Data Privacy Act of 2012 ng Pilipinas.</p>
                    <p>Available na ngayon ang non-destructive farmer archiving para mapanatili ang audit trail nang hindi nananatili sa active roster ang lumang record.</p>
                    <p>Susunod pang hardening step ang awtomatikong redaction, consent tagging, at retention timers.</p>
                </HelpDialog>
            </div>
            <CardDescription>
              Mga setting na may kaugnayan sa privacy at proteksyon ng data ng magsasaka.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Ang live user profile at role record ay hiwalay ngunit nakakabit sa authenticated account upang suportahan ang access control at accountability sa dashboard.</p>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-medium text-foreground">Archive-Based Retention</p>
            <p className="mt-1 text-muted-foreground">
              Ang farmer records na moved away, duplicate, o hindi na aktibo ay maaari nang i-archive sa halip na permanenteng burahin.
              Kasalukuyang archived records: <strong>{archivedFarmerCount}</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Planned pa rin ang automatic redaction after retention windows, pero hindi na kailangan mag-delete agad ng old farmer records para lang luminis ang roster.
          </div>
        </CardContent>
      </Card>

      {!isLiveMode ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Demo Data Control</CardTitle>
            <CardDescription>I-reset ang buong demo state para sa panibagong walkthrough run.</CardDescription>
          </CardHeader>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Reset Demo Data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sigurado ka bang ire-reset ang demo data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ibabalik nito ang farmers, SMS, inventory, vouchers, logs, at knowledge base sa initial mock state.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetDemo}>Oo, I-reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ) : null}

      <SensitiveActionReauthDialog
        open={showSecurityVerificationDialog}
        onOpenChange={setShowSecurityVerificationDialog}
        title="Kumpirmahin ang password para sa onboarding"
        description="Ito ang huling security step bago ma-finalize ang onboarding ng account."
        submitLabel="I-verify ang password"
        onVerified={async () => {
          const timestamp = new Date().toISOString();
          setSavingOnboardingAction('security');
          try {
            await persistProfile(
              {
                ...profile,
                securityReviewVerifiedAt: timestamp,
              },
              'Nakumpirma na ang seguridad ng account para sa onboarding.',
              { securityReviewVerifiedAt: true }
            );
          } finally {
            setSavingOnboardingAction(null);
          }
        }}
      />
    </div>
  );
}
