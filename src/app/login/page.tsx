"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { isDemoMode, isLiveMode } from "@/lib/config/app-mode";
import { readOnboardingProfile } from "@/lib/onboarding";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";

function readFriendlyLiveAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: string }).code ?? "")
    : "";
  const message = typeof error === "object" && error && "message" in error
    ? String((error as { message?: string }).message ?? "")
    : "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (
    normalized.includes("configuration_not_found") ||
    normalized.includes("operation-not-allowed")
  ) {
    return "Hindi pa naka-enable ang Email/Password sign-in sa Firebase Authentication para sa live deployment na ito.";
  }

  if (
    normalized.includes("invalid-credential") ||
    normalized.includes("wrong-password") ||
    normalized.includes("user-not-found") ||
    normalized.includes("invalid-login-credentials")
  ) {
    return "Hindi makapag-sign in sa live account. Siguraduhing tama ang email at password, at naka-provision ang iyong user profile.";
  }

  return "Hindi makapag-sign in sa live account. Siguraduhing tama ang email at password, at naka-provision ang iyong user profile.";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users } = useData();
  const { authLoading, authError, currentUserProfile, signIn } = useAuth();
  const loginBg = PlaceHolderImages.find((img) => img.id === "login-bg");
  const selectedApplication = searchParams.get("application");
  const cameFromStart = searchParams.get("fromStart") === "1";
  const [onboardingProfile, setOnboardingProfile] = useState<ReturnType<typeof readOnboardingProfile>>(null);
  const [showNotRegisteredDialog, setShowNotRegisteredDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessErrorMessage, setAccessErrorMessage] = useState(
    "Ang email address na iyong inilagay ay hindi nakarehistro sa aming sistema. Mangyaring makipag-ugnayan sa developer upang ma-access ang Lingkod-Ani."
  );

  useEffect(() => {
    if (!authLoading && currentUserProfile) {
      router.push(getPreferredDashboardRoute(currentUserProfile));
    }
  }, [authLoading, currentUserProfile, router]);

  useEffect(() => {
    if (!authError) {
      return;
    }

    setAccessErrorMessage(authError);
    setShowNotRegisteredDialog(true);
  }, [authError]);

  useEffect(() => {
    setOnboardingProfile(readOnboardingProfile());
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const form = event.target as HTMLFormElement;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const passwordInput = form.elements.namedItem("password") as HTMLInputElement;
    const email = emailInput.value;
    const password = passwordInput.value;

    if (isLiveMode) {
      try {
        await signIn(email, password);
      } catch (error) {
        setAccessErrorMessage(readFriendlyLiveAuthError(error));
        setShowNotRegisteredDialog(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    const user = users.find((candidate) => candidate.email === email);

    if (user?.status === "disabled") {
      setAccessErrorMessage("Ang account na ito ay naka-disable. Mangyaring makipag-ugnayan sa developer o barangay administrator.");
      setShowNotRegisteredDialog(true);
      setLoading(false);
      return;
    }

    if (user) {
      router.push(`/verify?email=${encodeURIComponent(email)}`);
      setLoading(false);
      return;
    }

    setAccessErrorMessage("Ang email address na iyong inilagay ay hindi nakarehistro sa aming sistema. Mangyaring makipag-ugnayan sa developer upang ma-access ang Lingkod-Ani.");
    setShowNotRegisteredDialog(true);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="fixed inset-0">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={loginBg.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(15,23,42,0.54),rgba(17,24,39,0.44))]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 items-center justify-center px-4 py-8">
        <Card className="mx-auto w-full max-w-md border-white/80 bg-white text-foreground shadow-[0_30px_80px_-36px_rgba(15,23,42,0.55)]">
          <CardHeader className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,251,248,0.98),rgba(255,255,255,0.98))] text-center">
            <div className="mb-2 flex items-center justify-center gap-3">
              <Image src="/logo.png" width={34} height={34} alt="Lingkod-Ani Logo" className="h-[34px] w-[34px]" />
              <h1 className="text-3xl font-semibold tracking-tight text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="text-2xl text-foreground">Pag-login ng Administrator</CardTitle>
            <CardDescription className="text-muted-foreground">
              Ilagay ang iyong mga kredensyal upang ma-access ang dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cameFromStart && onboardingProfile ? (
              <div className="mb-4 rounded-[calc(var(--radius)+6px)] border border-border/80 bg-[linear-gradient(180deg,#f9fbf9_0%,#f5f8f5_100%)] p-4 text-left">
                <p className="text-sm font-semibold text-primary">
                  {selectedApplication === "live" ? "Live application" : "Application"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Posisyon: <span className="font-medium text-foreground">{onboardingProfile.position}</span>
                </p>
                {onboardingProfile.age ? (
                  <p className="text-sm text-muted-foreground">
                    Edad: <span className="font-medium text-foreground">{onboardingProfile.age}</span>
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Taon sa serbisyo: <span className="font-medium text-foreground">{onboardingProfile.yearsInService}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Napiling workspace:{" "}
                  <span className="font-medium text-foreground">
                    {onboardingProfile.preferredWorkspace === "simple" ? "Simple" : "Detalyado"}
                  </span>
                </p>
              </div>
            ) : null}

            {cameFromStart && selectedApplication === "live" && !isLiveMode ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
                Ang build na ito ay demo-configured pa rin. Para sa totoong live sign-in, kailangan buksan ang live deployment.
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4">
              <HoverTooltip text="Ilagay ang email address na nakarehistro sa iyong account.">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    defaultValue={isDemoMode ? "brgy-admin@lingkodani.gov.ph" : ""}
                    required
                    disabled={loading}
                  />
                </div>
              </HoverTooltip>

              <HoverTooltip text="Ilagay ang iyong password.">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    defaultValue={isDemoMode ? "password" : ""}
                    placeholder="password"
                    required
                    disabled={loading}
                  />
                </div>
              </HoverTooltip>

              <HoverTooltip text="I-click upang mag-sign in sa iyong account.">
                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading ? "Nagsa-sign in..." : "Mag-sign In"}
                </Button>
              </HoverTooltip>
            </form>

            <div className="mt-4 space-y-2 text-center text-sm">
              <HoverTooltip text="Simulan ang proseso ng pag-reset ng iyong password.">
                <Link href="/reset-password" className="text-muted-foreground underline hover:text-foreground">
                  Nakalimutan ang iyong password?
                </Link>
              </HoverTooltip>
              <div>
                <Link href="/" className="text-muted-foreground hover:text-foreground hover:underline">
                  Bumalik sa startup page
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="relative z-10 p-4 text-center text-xs text-white/90">
        <Link href="/terms-of-service" className="hover:underline">
          Terms of Service
        </Link>{" "}
        |{" "}
        <Link href="/privacy-policy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>

      <AlertDialog open={showNotRegisteredDialog} onOpenChange={setShowNotRegisteredDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hindi Makapag-login</AlertDialogTitle>
            <AlertDialogDescription>{accessErrorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNotRegisteredDialog(false)}>Naiintindihan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoginPageFallback() {
  return <div className="min-h-screen bg-slate-900" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
