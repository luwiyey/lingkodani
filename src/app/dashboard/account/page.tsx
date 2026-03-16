'use client';

import React from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';

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
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { isLiveMode } from '@/lib/config/app-mode';
import { readOnboardingProfile, saveDemoPreviewUser, saveOnboardingProfile } from '@/lib/onboarding';
import type { User } from '@/lib/types';
import { getUserRecordId } from '@/lib/user-record';

function formatDateTime(value?: string | null) {
  if (!value) return 'Walang tala';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const photoUploadRef = React.useRef<HTMLInputElement>(null);
  const { currentUser, currentUserProfile } = useAuth();
  const { updateUser, users, resetDemoData } = useData();
  const [newEmailAddress, setNewEmailAddress] = React.useState('');
  const [workspacePreference, setWorkspacePreference] = React.useState<User['preferredWorkspace']>('simple');

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
      avatarUrl: 'https://picsum.photos/seed/admin/200/200',
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

  const handlePhotoUploadClick = () => {
    photoUploadRef.current?.click();
  };

  const persistProfile = (nextProfile: User, successMessage: string) => {
    if (isPreviewSession) {
      saveDemoPreviewUser(nextProfile);
    } else {
      updateUser(getUserRecordId(profile), nextProfile);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      const nextAvatarUrl = typeof reader.result === 'string' ? reader.result : profile.avatarUrl;
      const nextProfile: User = {
        ...profile,
        avatarUrl: nextAvatarUrl,
      };

      persistProfile(nextProfile, `Na-update na ang profile picture gamit ang "${file.name}".`);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
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
      preferredWorkspace: workspacePreference ?? 'simple',
      updatedAt: new Date().toISOString(),
    };

    persistProfile(nextProfile, 'Nai-save na ang iyong profile at workspace preference.');
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

          const nextProfile: User = {
            ...profile,
            email: nextEmail,
            updatedAt: new Date().toISOString(),
          };

          updateUser(getUserRecordId(profile), nextProfile);
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

  const avatarSrc = profile.avatarUrl || currentUser?.photoURL || undefined;
  const avatarFallback = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
                    <HoverTooltip text="Pumili ng bagong larawan mula sa iyong device. Ang image data ay ise-save sa live profile record.">
                        <Button type="button" variant="outline" onClick={handlePhotoUploadClick}>Mag-upload ng Bagong Larawan</Button>
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
                      <Label htmlFor="barangay">Barangay / Assignment</Label>
                      <Input id="barangay" name="barangay" defaultValue={profile.barangay ?? ''} />
                  </div>
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
                    <p>Kabilang sa mga feature na ipapatupad sa hinaharap ang pag-mask ng numero ng telepono, consent tagging, at awtomatikong data retention rules.</p>
                </HelpDialog>
            </div>
            <CardDescription>
              Mga setting na may kaugnayan sa privacy at proteksyon ng data ng magsasaka.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p>Ang live user profile at role record ay hiwalay ngunit nakakabit sa authenticated account upang suportahan ang access control at accountability sa dashboard.</p>
        </CardContent>
      </Card>

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
    </div>
  );
}
