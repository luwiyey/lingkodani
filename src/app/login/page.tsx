"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

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
import { buildLegalPageHref } from "@/lib/legal-links";
import { readOnboardingProfile } from "@/lib/onboarding";
import {
  PUBLIC_ENTRY_BACKGROUND_ALT,
  PUBLIC_ENTRY_BACKGROUND_HINT,
  PUBLIC_ENTRY_BACKGROUND_IMAGE,
  PUBLIC_ENTRY_BACKGROUND_IMAGE_CLASS,
  PUBLIC_ENTRY_IMAGE_OVERLAY,
} from "@/lib/public-entry-theme";
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
  const { authLoading, authError, currentUser, currentUserProfile, signIn } = useAuth();
  const selectedApplication = searchParams.get("application");
  const cameFromStart = searchParams.get("fromStart") === "1";
  const requestedAccess = searchParams.get("requestedAccess") === "1";
  const [onboardingProfile, setOnboardingProfile] = useState<ReturnType<typeof readOnboardingProfile>>(null);
  const [showNotRegisteredDialog, setShowNotRegisteredDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState("");
  const [accessErrorMessage, setAccessErrorMessage] = useState(
    "Ang email address na iyong inilagay ay hindi nakarehistro sa aming sistema. Mangyaring makipag-ugnayan sa developer upang ma-access ang Lingkod-Ani."
  );

  useEffect(() => {
    const shouldRedirectToDashboard =
      !authLoading &&
      currentUserProfile &&
      (!isLiveMode || Boolean(currentUser));

    if (shouldRedirectToDashboard) {
      router.replace(getPreferredDashboardRoute(currentUserProfile));
    }
  }, [authLoading, currentUser, currentUserProfile, router]);

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
    setLastAttemptedEmail(email.trim().toLowerCase());

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
        <Card className="auth-card-surface mx-auto w-full max-w-md overflow-hidden">
          <CardHeader className="pb-4 pt-8 text-center sm:pb-5 sm:pt-9">
            <div className="mb-3 flex items-center justify-center gap-3">
              <Image src="/logo.png" width={34} height={34} alt="Lingkod-Ani Logo" className="h-[34px] w-[34px]" />
              <h1 className="text-3xl font-semibold tracking-tight text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="auth-card-title text-2xl">Pag-login ng Administrator</CardTitle>
            <CardDescription className="auth-card-description mx-auto mt-1 max-w-[26rem] text-[14px] leading-7">
              Ilagay ang iyong mga kredensyal upang ma-access ang dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
            {cameFromStart && onboardingProfile ? (
              <div className="mb-4 rounded-[calc(var(--radius)+6px)] border border-border/80 bg-[linear-gradient(180deg,#f9fbf9_0%,#f5f8f5_100%)] p-4 text-left">
                <p className="text-sm font-semibold text-primary">
                  {selectedApplication === "live" ? "Live application" : "Application"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pangalan: <span className="font-medium text-foreground">{onboardingProfile.name || "Hindi naglagay"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Numero: <span className="font-medium text-foreground">{onboardingProfile.phone || "Hindi naglagay"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
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

            {requestedAccess ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-900">
                Naisumite na ang access request mo. Hintayin ang developer o barangay admin na ma-provision ang account bago subukang mag-login muli.
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="mt-2 space-y-5">
              <HoverTooltip text="Ilagay ang email address na nakarehistro sa iyong account.">
                <div className="space-y-2.5">
                    <Label htmlFor="email" className="auth-card-label">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    defaultValue={isDemoMode ? "brgy-admin@lingkodani.gov.ph" : ""}
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="auth-card-input h-12 rounded-xl px-4 text-[15px] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white]"
                  />
                </div>
              </HoverTooltip>

              <HoverTooltip text="Ilagay ang iyong password.">
                <div className="space-y-2.5">
                    <Label htmlFor="password" className="auth-card-label">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      defaultValue={isDemoMode ? "password" : ""}
                      placeholder="password"
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      className="auth-card-input h-12 rounded-xl px-4 pr-12 text-[15px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      className="auth-card-icon-button absolute inset-y-0 right-0 flex w-12 items-center justify-center disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Itago ang password" : "Ipakita ang password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </HoverTooltip>

              <HoverTooltip text="I-click upang mag-sign in sa iyong account.">
                <Button type="submit" className="mt-3 h-12 w-full text-base font-semibold" disabled={loading}>
                  {loading ? "Nagsa-sign in..." : "Mag-sign In"}
                </Button>
              </HoverTooltip>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm">
              <HoverTooltip text="Simulan ang proseso ng pag-reset ng iyong password.">
                <Link href="/reset-password" className="auth-card-link">
                  Nakalimutan ang iyong password?
                </Link>
              </HoverTooltip>
              <div>
                <Link href="/" className="auth-card-link-secondary">
                  Bumalik sa startup page
                </Link>
              </div>
              <div>
                <Link href="/request-access?source=login" className="auth-card-link-secondary">
                  Wala ka pang account? Humiling ng access
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="relative z-10 p-4 text-center text-xs text-white/90">
        <Link href={buildLegalPageHref("/terms-of-service", "login")} className="hover:underline">
          Terms of Service
        </Link>{" "}
        |{" "}
        <Link href={buildLegalPageHref("/privacy-policy", "login")} className="hover:underline">
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
            <Button variant="outline" asChild>
              <Link href={`/request-access?source=login&email=${encodeURIComponent(lastAttemptedEmail)}`}>
                Humiling ng Access
              </Link>
            </Button>
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
