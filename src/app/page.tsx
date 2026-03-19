import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, MessageSquare, ShieldAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { buildLegalPageHref } from "@/lib/legal-links";

const featureRows = [
  {
    icon: MessageSquare,
    title: "Pinag-isang Komunikasyon",
    description:
      "Pamahalaan ang lahat ng SMS mula sa mga magsasaka sa iisang live feed, na may AI analysis para sa layunin, tono, at antas ng pagkaapurahan.",
    points: [
      "Isang feed para sa lahat ng papasok na mensahe",
      "Mas mabilis na pag-triage gamit ang AI intent at urgency detection",
      "Mas malinaw na koordinasyon para sa field response",
    ],
  },
  {
    icon: BookOpen,
    title: "Base ng Kaalaman na may AI",
    description:
      "Maghanap ng sagot sa mga kumplikadong tanong gamit ang AI na natututo mula sa lokal na gabay, mga ulat, at barangay knowledge files.",
    points: [
      "Mas mabilis na pagkuha ng advisories",
      "Mas kaunting manu-manong paghahanap sa documentation",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Pamamahala ng Alerto",
    description:
      "Awtomatikong tukuyin ang mga panganib tulad ng peste at baha, at magpadala ng alerto sa komunidad sa loob lamang ng ilang click.",
    points: [
      "Mas maagang pagtukoy ng mga senyales ng panganib",
      "Mas mabilis na pagpapadala ng abiso sa komunidad",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" width={34} height={34} alt="Lingkod-Ani Logo" className="h-[34px] w-[34px]" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-foreground">Lingkod-Ani</span>
              <span className="text-[11px] text-muted-foreground">Kaagapay ng Magsasaka</span>
            </div>
          </Link>
          <Link href="/login" className={buttonVariants()}>
            Mag Log-in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-24 md:py-32 lg:py-36">
          <div className="absolute inset-0">
            <Image
              src="/hero-farm.png"
              alt="Rice field landscape for the Lingkod-Ani landing page"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(15,23,42,0.52),rgba(47,111,62,0.24))]" />
          </div>
          <div className="container relative mx-auto px-4 text-center text-primary-foreground">
            <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Paghubog sa kinabukasan ng pagsasaka gamit ang mas malinaw na barangay response.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-white/88 md:text-xl">
              Ang Lingkod-Ani ay isang plataporma para sa mga Agricultural Extension Workers na, sa tulong ng AI, ay nagbibigay ng real-time na komunikasyon, pagsubaybay sa mga aksyon sa barangay, at mas maayos na serbisyo para sa mga magsasakang Pilipino.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Button size="lg" asChild>
                <Link href="/start">
                  Magsimula Na
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Mga Pangunahing Kakayahan
              </p>
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">
                Mga tool na nakaayon sa tunay na daloy ng trabaho sa bukid at opisina
              </h2>
              <p className="max-w-3xl text-lg text-muted-foreground md:text-[1.35rem]">
                Sa halip na hiwa-hiwalay na mga module, ang Lingkod-Ani ay dinisenyo bilang isang iisang working surface para sa komunikasyon, kaalaman, alerts, at follow-through sa farmer support.
              </p>
            </div>

            <div className="mx-auto mt-14 max-w-5xl">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                {(() => {
                  const primaryFeature = featureRows[0];
                  const Icon = primaryFeature.icon;

                  return (
                    <article className="rounded-[calc(var(--radius)+10px)] border border-border/90 bg-card p-8 shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:border-primary/15 md:p-10">
                      <div className="grid gap-10 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
                        <div>
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[calc(var(--radius)+6px)] bg-primary text-primary-foreground shadow-sm">
                              <Icon className="h-8 w-8" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary/80">Pangunahing kakayahan</p>
                              <h3 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
                                {primaryFeature.title}
                              </h3>
                            </div>
                          </div>
                          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
                            {primaryFeature.description}
                          </p>
                          <div className="mt-8 space-y-4">
                            {primaryFeature.points.map((point) => (
                              <div key={point} className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Check className="h-4 w-4" />
                                </div>
                                <p className="text-sm leading-6 text-foreground/90 md:text-base">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[calc(var(--radius)+8px)] border border-border/80 bg-muted/35 p-5">
                          <div className="flex items-center justify-between border-b border-border/70 pb-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Live SMS Feed</p>
                              <p className="text-xs text-muted-foreground">Barangay field support preview</p>
                            </div>
                            <div className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                              3 active
                            </div>
                          </div>
                          <div className="mt-4 space-y-3">
                            <div className="rounded-[calc(var(--radius)+6px)] border border-border/80 bg-card p-4 shadow-sm">
                              <p className="text-xs font-medium text-muted-foreground">8:12 AM - Magsasaka</p>
                              <p className="mt-2 text-sm leading-6 text-foreground">
                                "May dilaw na batik ang palay sa timog na bahagi ng bukid."
                              </p>
                            </div>
                            <div className="rounded-[calc(var(--radius)+6px)] border border-primary/15 bg-primary/5 p-4">
                              <p className="text-xs font-medium text-primary">AI triage</p>
                              <p className="mt-2 text-sm leading-6 text-foreground">
                                Posibleng disease issue. Mataas ang urgency. I-route sa crop protection advisory.
                              </p>
                            </div>
                            <div className="rounded-[calc(var(--radius)+6px)] border border-border/80 bg-card p-4 shadow-sm">
                              <p className="text-xs font-medium text-muted-foreground">8:15 AM - Draft reply</p>
                              <p className="mt-2 text-sm leading-6 text-foreground">
                                Magpadala ng litrato at lokasyon para makapagbigay ng agarang rekomendasyon.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })()}

                <div className="grid gap-6">
                  {featureRows.slice(1).map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <article
                        key={feature.title}
                        className="rounded-[calc(var(--radius)+10px)] border border-border/90 bg-card p-7 shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:border-primary/15"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[calc(var(--radius)+6px)] bg-muted text-primary shadow-sm">
                            <Icon className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary/80">
                              {feature.title === "Base ng Kaalaman na may AI" ? "AI Knowledge Base" : "Alert Management"}
                            </p>
                            <h3 className="text-2xl font-semibold tracking-tight">{feature.title}</h3>
                          </div>
                        </div>
                        <p className="mt-3 text-base leading-7 text-muted-foreground">{feature.description}</p>
                        <div className="mt-6 space-y-3">
                          {feature.points.map((point) => (
                            <div key={point} className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Check className="h-4 w-4" />
                              </div>
                              <p className="text-sm leading-6 text-foreground/90">{point}</p>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} Lingkod-Ani. All rights reserved.</p>
          <div className="flex gap-4">
                            <Link href={buildLegalPageHref("/terms-of-service", "startup")} className="hover:underline">
              Terms of Service
            </Link>
            <Link href={buildLegalPageHref("/privacy-policy", "startup")} className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
