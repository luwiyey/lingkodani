"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, LaptopMinimal, ServerCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/auth-context";
import { isDemoMode, isLiveMode } from "@/lib/config/app-mode";
import {
  clearDemoPreviewUser,
  createDemoPreviewUser,
  pickDemoProfile,
  saveDemoPreviewUser,
  saveOnboardingProfile,
  type ApplicationChoice,
} from "@/lib/onboarding";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";
import { cn } from "@/lib/utils";

const applicationOptions: Array<{
  id: ApplicationChoice;
  title: string;
  description: string;
  icon: typeof LaptopMinimal;
}> = [
  {
    id: "demo",
    title: "Demo Application",
    description: "Subukan muna ang flow, reports, at dashboard views gamit ang sample barangay data.",
    icon: LaptopMinimal,
  },
  {
    id: "live",
    title: "Live Application",
    description: "Gamitin ang totoong account at live Firebase setup para sa barangay operations.",
    icon: ServerCog,
  },
];

const workspaceOptions = [
  {
    id: "simple",
    title: "Simple",
    description: "Mas mabilis maintindihan, mas malalaking actions, at mas kaunting choices sa screen.",
  },
  {
    id: "detailed",
    title: "Detalyado",
    description: "Mas maraming controls, analysis tools, at mas kumpletong view para sa Gen Z AEW at officials.",
  },
] as const;

export default function StartPage() {
  const router = useRouter();
  const { startDemoSession } = useAuth();
  const backgroundImage = PlaceHolderImages.find((image) => image.id === "login-bg");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationChoice | null>(null);
  const [position, setPosition] = useState("");
  const [age, setAge] = useState("");
  const [yearsInService, setYearsInService] = useState("");
  const [preferredWorkspace, setPreferredWorkspace] = useState<"simple" | "detailed">("simple");
  const [submitting, setSubmitting] = useState(false);
  const applicationNotice = selectedApplication === "demo" && isLiveMode
    ? {
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        text: "Bubukas ito ng demo preview sa browser na ito gamit ang sample barangay data.",
      }
    : selectedApplication === "live" && isDemoMode
      ? {
          className: "border-amber-200 bg-amber-50 text-amber-800",
          text: "Nasa demo build ka ngayon. Kapag pinili mo ang live application, dadalhin ka pa rin sa sign-in flow, pero kailangan ng live deployment para sa totoong account access.",
        }
      : null;

  const handleSurveySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedApplication) {
      return;
    }

    setSubmitting(true);

    const profile = {
      application: selectedApplication,
      position: position.trim(),
      age: age.trim(),
      yearsInService: yearsInService.trim(),
      preferredWorkspace,
      completedAt: new Date().toISOString(),
    } as const;

    saveOnboardingProfile(profile);

    if (selectedApplication === "demo") {
      if (isDemoMode) {
        clearDemoPreviewUser();
        const demoProfile = pickDemoProfile(profile.position, profile.preferredWorkspace);
        startDemoSession(demoProfile.email);
        router.push(
          getPreferredDashboardRoute({
            role: demoProfile.role,
            preferredWorkspace: profile.preferredWorkspace,
          })
        );
        return;
      }

      const previewUser = createDemoPreviewUser(profile);
      saveDemoPreviewUser(previewUser);
      router.push(getPreferredDashboardRoute(previewUser));
      return;
    }

    clearDemoPreviewUser();
    router.push("/login?application=live&fromStart=1");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-10">
      <div className="fixed inset-0">
        {backgroundImage && (
          <Image
            src={backgroundImage.imageUrl}
            alt={backgroundImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={backgroundImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(15,23,42,0.52),rgba(17,24,39,0.42))]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center">
      <Card className="relative z-10 w-full max-w-3xl border-white/80 bg-white text-foreground shadow-[0_30px_80px_-36px_rgba(15,23,42,0.55)]">
        <CardHeader className="space-y-4 border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,251,248,0.98),rgba(255,255,255,0.98))]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" width={40} height={40} alt="Lingkod-Ani Logo" className="h-10 w-10" />
              <div>
                <CardTitle className="text-3xl text-primary">Magsimula Na</CardTitle>
                <CardDescription className="max-w-2xl">
                  Piliin muna ang application mode at ang pinakaangkop na workspace para sa iyong barangay team.
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" asChild className="hidden border border-transparent text-muted-foreground hover:border-border hover:bg-muted sm:inline-flex">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Bumalik
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-3">
            <Label className="text-base font-semibold">1. Piliin ang application</Label>
            <div className="grid gap-4 md:grid-cols-2">
              {applicationOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedApplication === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedApplication(option.id)}
                    className={cn(
                      "rounded-[calc(var(--radius)+8px)] border p-5 text-left transition-all duration-150 ease-out",
                      isSelected
                        ? "border-primary/25 bg-[linear-gradient(180deg,#f7fbf8_0%,#eef7f1_100%)] shadow-sm"
                        : "border-border/90 bg-white hover:-translate-y-px hover:border-primary/20 hover:bg-[#fbfcfb]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+6px)] bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-semibold">{option.title}</h2>
                        <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
                      </div>
                      <ChevronRight className={cn("h-5 w-5 transition-transform", isSelected ? "translate-x-0 text-primary" : "text-muted-foreground")} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="min-h-[64px]">
              {applicationNotice ? (
                <p className={cn("rounded-2xl border px-4 py-3 text-sm", applicationNotice.className)}>
                  {applicationNotice.text}
                </p>
              ) : null}
            </div>
          </div>

          {selectedApplication ? (
            <form onSubmit={handleSurveySubmit} className="space-y-6 rounded-[calc(var(--radius)+10px)] border border-border/80 bg-[linear-gradient(180deg,#f9fbf9_0%,#f5f8f5_100%)] p-6">
              <div className="space-y-2">
                <Label htmlFor="position" className="text-base font-semibold">
                  2. Ano ang posisyon mo sa barangay?
                </Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="Halimbawa: Barangay Secretary o AEW"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-base font-semibold">
                  3. Ilang taon ka na?
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="Halimbawa: 32"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsInService" className="text-base font-semibold">
                  4. Ilang taon ka na sa serbisyo?
                </Label>
                <Input
                  id="yearsInService"
                  type="number"
                  min="0"
                  value={yearsInService}
                  onChange={(event) => setYearsInService(event.target.value)}
                  placeholder="Halimbawa: 3"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  5. Ano ang mas gusto mong workspace?
                </Label>
                <RadioGroup value={preferredWorkspace} onValueChange={(value) => setPreferredWorkspace(value as "simple" | "detailed")}>
                  {workspaceOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-[calc(var(--radius)+6px)] border bg-white p-4 transition-colors duration-150 ease-out",
                        preferredWorkspace === option.id ? "border-primary/25 bg-[linear-gradient(180deg,#f7fbf8_0%,#eef7f1_100%)]" : "border-border/90 hover:border-primary/15 hover:bg-[#fbfcfb]"
                      )}
                    >
                      <RadioGroupItem value={option.id} id={`workspace-${option.id}`} className="mt-1" />
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{option.title}</p>
                        <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="ghost" asChild className="sm:hidden">
                  <Link href="/">Bumalik sa startup page</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Kapag pinili mo ang <strong>{preferredWorkspace === "simple" ? "Simple" : "Detalyado"}</strong>, iyon ang unang dashboard na bubukas para sa iyo.
                </p>
                <Button type="submit" disabled={submitting}>
                  {selectedApplication === "live" ? "Magpatuloy sa Live App" : "Buksan ang Demo"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-[calc(var(--radius)+8px)] border border-dashed border-primary/20 bg-[#f7fbf8] px-5 py-6 text-sm text-muted-foreground">
              Pumili muna ng Demo Application o Live Application para lumabas ang maikling survey.
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
