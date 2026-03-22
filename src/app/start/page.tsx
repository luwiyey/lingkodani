"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, CircleHelp, LaptopMinimal, ServerCog } from "lucide-react";

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
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { useAuth } from "@/context/auth-context";
import { isDemoMode, isLiveMode } from "@/lib/config/app-mode";
import {
  clearStartFlowDraft,
  clearDemoPreviewUser,
  createDemoPreviewUser,
  pickDemoProfile,
  readStartFlowDraft,
  saveDemoPreviewUser,
  saveOnboardingProfile,
  saveStartFlowDraft,
  type ApplicationChoice,
} from "@/lib/onboarding";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";
import { cn } from "@/lib/utils";

const applicationOptions: Array<{
  id: ApplicationChoice;
  title: string;
  shortLabel: string;
  description: string;
  icon: typeof LaptopMinimal;
}> = [
  {
    id: "demo",
    title: "Demo Application",
    shortLabel: "Practice Mode",
    description: "Subukan muna ang flow, reports, at dashboard views gamit ang sample barangay data.",
    icon: LaptopMinimal,
  },
  {
    id: "live",
    title: "Live Application",
    shortLabel: "Actual Operations",
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

type PreferredWorkspaceOption = (typeof workspaceOptions)[number]["id"];
type ApplicationNotice = {
  title: string;
  text: string;
  className: string;
};

function parseSurveyNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getWorkspaceRecommendation(age: string, yearsInService: string): {
  preferredWorkspace: PreferredWorkspaceOption;
  title: string;
  description: string;
} | null {
  const ageValue = parseSurveyNumber(age);
  const yearsValue = parseSurveyNumber(yearsInService);

  if (ageValue === null || yearsValue === null) {
    return null;
  }

  if (ageValue >= 36) {
    return {
      preferredWorkspace: "simple",
      title: "Simple ang inirerekomenda para sa iyo.",
      description:
        "Kung 36 pataas ang edad, mas malinaw munang gamitin ang workspace na mas diretso ang actions at mas kaunti ang sabay-sabay na controls sa screen.",
    };
  }

  if (yearsValue <= 1) {
    return {
      preferredWorkspace: "simple",
      title: "Simple ang inirerekomenda para sa iyo.",
      description:
        "Kung 1 taon o mas mababa ka pa sa serbisyo, mas madali munang magsimula sa guided workspace bago lumipat sa mas maraming controls.",
    };
  }

  if (ageValue >= 18 && ageValue <= 35 && yearsValue >= 2) {
    return {
      preferredWorkspace: "detailed",
      title: "Detalyado ang inirerekomenda para sa iyo.",
      description:
        "Kung nasa 18-35 age range ka at may 2 o higit pang taon na sa serbisyo, mas bagay sa iyo ang mas kumpletong dashboard, analysis, at case-handling tools.",
    };
  }

  return null;
}

function getApplicationNotice(selectedApplication: ApplicationChoice | null): ApplicationNotice | null {
  if (selectedApplication === "demo") {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-900",
      title: "Demo preview ang bubuksan mo.",
      text: isLiveMode
        ? "Makikita mo rito ang sample farmer records, simulated SMS conversations, alerts, reports, at inventory flows. Maaari kang mag-explore at magbago ng demo data sa browser na ito nang hindi naaapektuhan ang totoong live records."
        : "Makikita mo rito ang sample farmer records, simulated SMS conversations, alerts, reports, at inventory flows. Ligtas itong galawin para maipakita ang buong Lingkod-Ani experience gamit ang demo data.",
    };
  }

  if (selectedApplication === "live" && isDemoMode) {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-800",
      title: "Live sign-in flow lang ang mabubuksan dito.",
      text: "Nasa demo build ka ngayon. Kapag pinili mo ang live application, dadalhin ka pa rin sa sign-in flow, pero kailangan ng live deployment para sa totoong account access.",
    };
  }

  return null;
}

export default function StartPage() {
  const router = useRouter();
  const { startDemoSession } = useAuth();
  const backgroundImage = PlaceHolderImages.find((image) => image.id === "login-bg");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationChoice | null>(null);
  const [position, setPosition] = useState("");
  const [age, setAge] = useState("");
  const [yearsInService, setYearsInService] = useState("");
  const [preferredWorkspace, setPreferredWorkspace] = useState<"simple" | "detailed">("simple");
  const [workspaceTouched, setWorkspaceTouched] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const workspaceRecommendation = getWorkspaceRecommendation(age, yearsInService);
  const recommendedWorkspace = workspaceRecommendation?.preferredWorkspace ?? null;
  const recommendedWorkspaceLabel =
    recommendedWorkspace === "detailed" ? "Detalyado" : recommendedWorkspace === "simple" ? "Simple" : null;
  const hasProfileInputs =
    position.trim().length > 0 &&
    age.trim().length > 0 &&
    yearsInService.trim().length > 0;
  const isSurveyComplete =
    Boolean(selectedApplication) &&
    hasProfileInputs;

  useEffect(() => {
    const draft = readStartFlowDraft();

    if (draft) {
      setSelectedApplication(draft.selectedApplication);
      setPosition(draft.position);
      setAge(draft.age);
      setYearsInService(draft.yearsInService);
      setPreferredWorkspace(draft.preferredWorkspace);
      setWorkspaceTouched(draft.workspaceTouched);
    }

    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) {
      return;
    }

    saveStartFlowDraft({
      selectedApplication,
      position,
      age,
      yearsInService,
      preferredWorkspace,
      workspaceTouched,
    });
  }, [age, draftReady, position, preferredWorkspace, selectedApplication, workspaceTouched, yearsInService]);

  useEffect(() => {
    if (!workspaceTouched && workspaceRecommendation) {
      setPreferredWorkspace(workspaceRecommendation.preferredWorkspace);
    }
  }, [workspaceRecommendation, workspaceTouched]);

  const handleSurveySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedApplication) {
      return;
    }

    setSubmitting(true);
    clearStartFlowDraft();

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
      <Card className="relative z-10 w-full max-w-3xl overflow-hidden border-white/70 bg-white/98 text-foreground shadow-[0_28px_70px_-38px_rgba(15,23,42,0.42)]">
        <CardHeader className="space-y-4 bg-[linear-gradient(180deg,rgba(248,251,248,0.98),rgba(255,255,255,0.98))] pb-4">
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

        <CardContent className="space-y-6 pt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                step: "Step 1",
                label: "Application",
                state: selectedApplication ? "done" : "active",
              },
              {
                step: "Step 2",
                label: "Role & Experience",
                state: hasProfileInputs ? "done" : selectedApplication ? "active" : "upcoming",
              },
              {
                step: "Step 3",
                label: "Workspace",
                state: hasProfileInputs ? "active" : "upcoming",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[calc(var(--radius)+4px)] border px-4 py-3 shadow-none transition-colors duration-150 ease-out",
                  item.state === "done" && "border-primary/15 bg-primary/5",
                  item.state === "active" && "border-primary/20 bg-[linear-gradient(180deg,#fbfdfb_0%,#f4f9f5_100%)]",
                  item.state === "upcoming" && "border-border/70 bg-muted/15"
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.step}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label className="block text-base font-semibold">1. Piliin ang application</Label>
              <p className="text-sm text-muted-foreground">
                Pumili kung practice preview muna o actual operations ang bubuksan.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {applicationOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedApplication === option.id;
                const optionNotice = isSelected ? getApplicationNotice(option.id) : null;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedApplication(option.id)}
                    className={cn(
                      "rounded-[calc(var(--radius)+8px)] border p-5 text-left shadow-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5",
                      isSelected
                        ? "border-primary/35 bg-[linear-gradient(180deg,#f7fbf8_0%,#eef7f1_100%)] ring-1 ring-primary/10"
                        : "border-border/90 bg-white hover:border-primary/20 hover:bg-[#fbfcfb] hover:shadow-md"
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-semibold text-foreground">{option.title}</h2>
                              <span className="rounded-full border border-border/80 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                {option.shortLabel}
                              </span>
                              {option.id === "live" ? (
                                <HoverTooltip text="Kailangan nito ng totoong sign-in account at kumpletong live Firebase/SMS setup bago magamit sa actual barangay operations.">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground">
                                    <CircleHelp className="h-3.5 w-3.5" />
                                  </span>
                                </HoverTooltip>
                              ) : null}
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <ChevronRight className={cn("h-5 w-5 shrink-0 transition-transform", isSelected ? "translate-x-0 text-primary" : "text-muted-foreground")} />
                      </div>

                      {optionNotice ? (
                        <div className={cn("rounded-[calc(var(--radius)+4px)] border px-4 py-3 text-sm shadow-sm animate-in fade-in-0 slide-in-from-top-1 duration-200", optionNotice.className)}>
                          <p className="font-semibold">{optionNotice.title}</p>
                          <p className="mt-1 leading-6">{optionNotice.text}</p>
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedApplication ? (
            <form onSubmit={handleSurveySubmit} className="space-y-5 rounded-[calc(var(--radius)+10px)] border border-border/60 bg-[linear-gradient(180deg,#fbfcfb_0%,#f6f9f6_100%)] p-6">
              <div className="space-y-1 pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Step 2 · Role & Experience
                </p>
                <p className="text-sm text-muted-foreground">
                  Ibahagi ang iyong posisyon, edad, at tagal sa serbisyo para makapagrekomenda ang system ng pinakamagandang workspace.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-base font-semibold">
                  2. Ano ang posisyon mo sa barangay?
                </Label>
                <Input
                  id="position"
                  list="common-role-options"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="Halimbawa: Barangay Secretary o AEW"
                  required
                />
                <datalist id="common-role-options">
                  <option value="Barangay Secretary" />
                  <option value="Barangay Captain" />
                  <option value="Barangay Administrator" />
                  <option value="Agricultural Extension Worker (AEW)" />
                  <option value="Barangay Kagawad" />
                  <option value="Municipal Agriculture Staff" />
                </datalist>
                <p className="text-xs leading-5 text-muted-foreground">
                  Pumili mula sa mga karaniwang role sa dropdown o mag-type ng sarili mong posisyon.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    Ginagamit ito para ma-recommend kung Simple o Detalyado ang mas babagay sa iyong setup.
                  </p>
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    Tinutulungan nito ang system na tantiyahin kung gaano kasimple o kalawak ang unang workspace mo.
                  </p>
                </div>
              </div>

              {workspaceRecommendation ? (
                <div className="rounded-[calc(var(--radius)+8px)] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,251,248,0.98))] p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        Rekomendasyon sa workspace
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {workspaceRecommendation.title}
                      </p>
                    </div>
                    {recommendedWorkspaceLabel ? (
                      <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                        {recommendedWorkspaceLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {workspaceRecommendation.description} Maaari mo pa ring piliin kung gusto mo ang
                    Simple o Detalyado sa ibaba.
                  </p>
                </div>
              ) : null}

              <div className="space-y-3.5 border-t border-border/70 pt-5">
                <div className="space-y-1">
                  <Label className="block text-base font-semibold">
                    5. Ano ang mas gusto mong workspace?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Step 3 · Piliin kung simple ang gusto mong galaw o detalyadong operational view ang mas bagay sa iyo.
                  </p>
                </div>
                <RadioGroup
                  value={preferredWorkspace}
                  onValueChange={(value) => {
                    setWorkspaceTouched(true);
                    setPreferredWorkspace(value as "simple" | "detailed");
                  }}
                  className="grid gap-3"
                >
                  {workspaceOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-[calc(var(--radius)+6px)] border bg-white p-4 shadow-sm transition-colors duration-150 ease-out",
                        preferredWorkspace === option.id
                          ? "border-primary/35 bg-[linear-gradient(180deg,#f7fbf8_0%,#eef7f1_100%)] ring-1 ring-primary/10"
                          : "border-border/90 hover:border-primary/15 hover:bg-[#fbfcfb]"
                      )}
                    >
                      <RadioGroupItem value={option.id} id={`workspace-${option.id}`} className="mt-1" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{option.title}</p>
                          {recommendedWorkspace === option.id ? (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                              Inirerekomenda
                            </span>
                          ) : null}
                        </div>
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
                <Button type="submit" disabled={submitting || !isSurveyComplete}>
                  {selectedApplication === "live" ? "Magpatuloy sa Live App" : "Magpatuloy sa Demo"}
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
