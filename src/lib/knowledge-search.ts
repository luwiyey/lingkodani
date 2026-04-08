import { getEffectiveSmsCaseOutcome, isFarmerConfirmedResolution } from "@/lib/sms-case-outcomes";
import type { KnowledgeArticle, SmsMessage } from "@/lib/types";

export type KnowledgeSearchResult = {
  directAnswer: string;
  articles: KnowledgeArticle[];
};

export type KnowledgeSupportInsight = {
  confidenceScore: number;
  confidenceTier: "high" | "medium" | "low";
  confidenceLabel: string;
  localCoverageRatio: number;
  whyThisAnswer: string;
  assumptions: string[];
  evidenceItems: string[];
  conflictWarnings: string[];
  gapWarnings: string[];
  reviewRecommendation: {
    level: "ready" | "review" | "caution";
    label: string;
    reason: string;
  };
  strongestArticleTitle?: string;
  articleUsageBreakdown: Array<{
    articleId: string;
    articleTitle: string;
    referencedCases: number;
    confirmedResolved: number;
    reopenedCases: number;
    ongoingCases: number;
    successRate: number | null;
  }>;
  usageSummary: {
    referencedCases: number;
    confirmedResolved: number;
    reopenedCases: number;
    ongoingCases: number;
  };
};

export type SuggestedKnowledgeTopic = {
  title: string;
  summary: string;
  keywords: string[];
};

function cleanSuggestionTerm(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?.,;:]+$/g, "");
}

function buildQuestionSuggestions(term: string) {
  const cleaned = cleanSuggestionTerm(term);

  if (!cleaned) {
    return [] as string[];
  }

  return [
    `Paano sugpuin ang ${cleaned}?`,
    `Ano ang dapat gawin kapag may ${cleaned}?`,
    `Mga senyales ng ${cleaned}`,
  ];
}

export function buildKnowledgeAutocompleteSuggestions(
  query: string,
  articles: KnowledgeArticle[],
  limit = 6
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [] as string[];
  }

  const suggestions = new Set<string>();

  for (const article of articles.filter(isKnowledgeArticleApproved)) {
    const title = article.title.trim();
    if (title.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(title);
      buildQuestionSuggestions(title).forEach((suggestion) => suggestions.add(suggestion));
    }

    for (const keyword of article.keywords) {
      const normalizedKeyword = keyword.trim();
      if (normalizedKeyword.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(normalizedKeyword);
        buildQuestionSuggestions(normalizedKeyword).forEach((suggestion) => suggestions.add(suggestion));
      }
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

export function isKnowledgeArticleApproved(article: KnowledgeArticle) {
  return article.reviewStatus !== "needs_review" && article.reviewStatus !== "archived";
}

export function tokenizeKnowledgeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function summarizeArticleTokens(article: KnowledgeArticle) {
  return tokenizeKnowledgeText(
    [
      article.title,
      article.summary,
      article.content ?? "",
      article.keywords.join(" "),
      article.author,
      article.sourceLabel ?? "",
      article.type,
    ].join(" ")
  );
}

function normalizeArticleTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\bv\d+\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function formatArticleDate(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return timestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function hasAnyToken(queryTokens: string[], values: string[]) {
  const normalizedValues = values.map((value) => value.toLowerCase());
  return queryTokens.some((token) => normalizedValues.includes(token));
}

function buildWhyThisAnswer(input: {
  strongestArticle?: KnowledgeArticle;
  answerMode: "local_only" | "local_ai" | "local_web";
  relevantArticles: KnowledgeArticle[];
  usedWebGrounding: boolean;
  localCoverageRatio: number;
}) {
  const strongestTitle = input.strongestArticle?.title ?? input.relevantArticles[0]?.title;

  if (!strongestTitle) {
    return "Walang matibay na lokal na article match, kaya mas fallback-style at mas maingat ang sagot.";
  }

  if (input.answerMode === "local_web" && input.usedWebGrounding) {
    return `Pangunahin pa ring nakaangkla ang sagot sa "${strongestTitle}", pero dinagdagan ito ng web grounding dahil hindi sapat ang lokal na coverage para sa buong tanong.`;
  }

  if (input.answerMode === "local_ai") {
    return input.localCoverageRatio >= 0.75
      ? `Naka-base ang sagot sa lokal na article na "${strongestTitle}" at nirewrite lang ng AI para maging mas malinaw ang paliwanag.`
      : `Ginamit ang "${strongestTitle}" bilang pinakamalapit na lokal na source, pero medyo general pa ang coverage kaya kailangan pa ring i-verify ang field specifics.`;
  }

  return `Lokal na article matching lang ang ginamit, at ang pinakamalapit na pinanggalingan ay "${strongestTitle}".`;
}

function buildAssumptions(input: {
  queryTokens: string[];
  relevantArticles: KnowledgeArticle[];
  localCoverageRatio: number;
  usedWebGrounding: boolean;
}) {
  const assumptions: string[] = [];
  const cropTerms = ["palay", "mais", "kamatis", "sibuyas", "talong", "sitaw", "gulay", "okra", "ampalaya"];
  const locationTerms = ["zone", "sitio", "barangay", "batakil"];
  const stageTerms = ["punla", "seedling", "vegetative", "flowering", "fruiting", "harvest", "ani"];

  if (!hasAnyToken(input.queryTokens, cropTerms)) {
    assumptions.push("Walang malinaw na crop term sa query, kaya ipinapalagay ng sagot na tugma ang article sa tinutukoy na pananim.");
  }

  if (!hasAnyToken(input.queryTokens, locationTerms)) {
    assumptions.push("Walang espesipikong lokasyon sa query, kaya maaaring kailangan pa ring i-adjust ang payo ayon sa aktwal na zone, tubig, o weather condition.");
  }

  if (!hasAnyToken(input.queryTokens, stageTerms)) {
    assumptions.push("Walang crop-stage detail sa query, kaya dapat pang i-check kung punla, vegetative, flowering, o malapit nang anihin ang pananim.");
  }

  if (input.localCoverageRatio < 0.7) {
    assumptions.push("Hindi pa buo ang local coverage ng query, kaya may bahagi ng sagot na mas general kaysa fully localized.");
  }

  if (input.usedWebGrounding) {
    assumptions.push("May dagdag na web grounding, pero local articles pa rin ang dapat tratuhing pangunahing source of truth.");
  }

  if (input.relevantArticles.length === 1) {
    assumptions.push("Iisang pangunahing article lang ang tumama sa tanong na ito, kaya manipis pa ang corroboration mula sa ibang local source.");
  }

  return assumptions.slice(0, 5);
}

export function buildKnowledgeSupportInsight(input: {
  query: string;
  relevantArticles: KnowledgeArticle[];
  approvedArticles: KnowledgeArticle[];
  answerMode: "local_only" | "local_ai" | "local_web";
  usedWebGrounding: boolean;
  smsMessages?: SmsMessage[];
}): KnowledgeSupportInsight {
  const {
    query,
    relevantArticles,
    approvedArticles,
    answerMode,
    usedWebGrounding,
    smsMessages = [],
  } = input;
  const queryTokens = Array.from(new Set(tokenizeKnowledgeText(query)));
  const coveredTokens = new Set<string>();
  const sourceLabels = new Set<string>();
  const normalizedTitleCounts = new Map<string, number>();

  for (const article of relevantArticles) {
    const articleTokens = summarizeArticleTokens(article);
    for (const token of queryTokens) {
      if (articleTokens.includes(token)) {
        coveredTokens.add(token);
      }
    }

    if (article.sourceLabel?.trim()) {
      sourceLabels.add(article.sourceLabel.trim());
    }

    const normalizedTitle = normalizeArticleTitle(article.title);
    normalizedTitleCounts.set(
      normalizedTitle,
      (normalizedTitleCounts.get(normalizedTitle) ?? 0) + 1
    );
  }

  const localCoverageRatio =
    queryTokens.length === 0
      ? relevantArticles.length > 0
        ? 1
        : 0
      : coveredTokens.size / queryTokens.length;
  const relevantArticleIds = new Set(relevantArticles.map((article) => article.id));
  const referencedCases = smsMessages.filter((message) =>
    message.knowledgeBaseId ? relevantArticleIds.has(message.knowledgeBaseId) : false
  );
  const confirmedResolved = referencedCases.filter((message) =>
    isFarmerConfirmedResolution(message)
  ).length;
  const reopenedCases = referencedCases.filter(
    (message) => message.resolutionConfirmationStatus === "reopened"
  ).length;
  const ongoingCases = referencedCases.filter((message) => {
    const outcome = getEffectiveSmsCaseOutcome(message);
    return outcome !== "resolved" && message.resolutionConfirmationStatus !== "reopened";
  }).length;

  const conflictWarnings: string[] = [];
  const gapWarnings: string[] = [];
  const evidenceItems: string[] = [];
  const articleUsageBreakdown = relevantArticles.map((article) => {
    const linkedCases = smsMessages.filter((message) => message.knowledgeBaseId === article.id);
    const confirmedResolvedCount = linkedCases.filter((message) =>
      isFarmerConfirmedResolution(message)
    ).length;
    const reopenedCount = linkedCases.filter(
      (message) => message.resolutionConfirmationStatus === "reopened"
    ).length;
    const ongoingCount = linkedCases.filter((message) => {
      const outcome = getEffectiveSmsCaseOutcome(message);
      return outcome !== "resolved" && message.resolutionConfirmationStatus !== "reopened";
    }).length;
    const successRate =
      linkedCases.length > 0
        ? Number((confirmedResolvedCount / linkedCases.length).toFixed(2))
        : null;

    return {
      articleId: article.id,
      articleTitle: article.title,
      referencedCases: linkedCases.length,
      confirmedResolved: confirmedResolvedCount,
      reopenedCases: reopenedCount,
      ongoingCases: ongoingCount,
      successRate,
    };
  });
  const strongestArticle =
    relevantArticles[0]
      ? [...relevantArticles]
          .sort((left, right) => {
            const leftTokens = summarizeArticleTokens(left);
            const rightTokens = summarizeArticleTokens(right);
            const leftMatches = queryTokens.filter((token) => leftTokens.includes(token)).length;
            const rightMatches = queryTokens.filter((token) => rightTokens.includes(token)).length;

            if (rightMatches !== leftMatches) {
              return rightMatches - leftMatches;
            }

            return new Date(right.lastUpdated).getTime() - new Date(left.lastUpdated).getTime();
          })[0]
      : undefined;

  if (relevantArticles.length === 0) {
    gapWarnings.push(
      "Walang direktang approved local article na tumama sa query na ito. Mas ligtas munang magtanong pa o magdagdag ng lokal na gabay."
    );
  }

  if (relevantArticles.length === 1) {
    gapWarnings.push(
      "Iisa lang ang direktang local article na pinanggalingan ng sagot, kaya mas manipis ang lokal na coverage."
    );
  }

  if (localCoverageRatio < 0.55) {
    gapWarnings.push(
      "Hindi pa natatakpan ng local knowledge ang karamihan ng mahahalagang salita sa query. Magandang dagdagan pa ang crop- o symptom-specific article."
    );
  }

  if (
    relevantArticles.some(
      (article) =>
        article.supersedesArticleId &&
        relevantArticleIds.has(article.supersedesArticleId)
    )
  ) {
    conflictWarnings.push(
      "May lumang at bagong bersyon ng magkalapit na article sa resulta. I-prioritize ang pinakabagong version bago magpadala ng payo."
    );
  }

  if ([...normalizedTitleCounts.values()].some((count) => count > 1)) {
    conflictWarnings.push(
      "May higit sa isang article na halos magkapareho ang paksa o pamagat. Tingnan kung alin ang pinaka-updated at pinaka-angkop sa kasalukuyang kaso."
    );
  }

  if (sourceLabels.size >= 3 && localCoverageRatio < 0.8) {
    conflictWarnings.push(
      "Magkakaiba ang pinanggalingan ng mga article pero hindi pa ganap ang query coverage. Mabuting i-double check muna ang crop stage at actual field conditions."
    );
  }

  evidenceItems.push(
    relevantArticles.length > 0
      ? `${relevantArticles.length} approved local article ang direktang tumugma sa query.`
      : `0 approved local article ang direktang tumugma sa query.`
  );

  if (queryTokens.length > 0) {
    evidenceItems.push(
      `${coveredTokens.size} sa ${queryTokens.length} mahahalagang query token ang natakpan ng local knowledge.`
    );
  }

  const freshestArticle = [...relevantArticles]
    .sort(
      (left, right) =>
        new Date(right.lastUpdated).getTime() - new Date(left.lastUpdated).getTime()
    )[0];
  const freshestArticleDate = formatArticleDate(freshestArticle?.lastUpdated);
  if (freshestArticle && freshestArticleDate) {
    evidenceItems.push(
      `Pinakabagong lokal na source: "${freshestArticle.title}" (${freshestArticleDate}).`
    );
  }

  if (usedWebGrounding && answerMode === "local_web") {
    evidenceItems.push(
      "May dagdag na web grounding ang sagot, pero local knowledge pa rin ang primary source of truth."
    );
  }

  if (referencedCases.length > 0) {
    evidenceItems.push(
      `May ${referencedCases.length} naunang case na gumamit ng isa sa mga article na ito.`
    );
  } else {
    evidenceItems.push(
      "Wala pang historical case link para masukat kung gaano kadalas magamit ang eksaktong article na ito."
    );
  }

  const freshnessBoost = relevantArticles.some((article) => {
    const updatedAt = new Date(article.lastUpdated).getTime();
    if (Number.isNaN(updatedAt)) {
      return false;
    }

    return Date.now() - updatedAt <= 180 * 24 * 60 * 60 * 1000;
  })
    ? 0.08
    : 0;
  const historicalConfirmedRate =
    referencedCases.length > 0 ? confirmedResolved / referencedCases.length : 0;
  const conflictPenalty = Math.min(0.18, conflictWarnings.length * 0.09);
  const gapPenalty = Math.min(0.22, gapWarnings.length * 0.11);

  const rawConfidence =
    0.3 +
    Math.min(0.18, relevantArticles.length * 0.06) +
    localCoverageRatio * 0.24 +
    freshnessBoost +
    historicalConfirmedRate * 0.08 +
    (usedWebGrounding ? 0.04 : 0) -
    conflictPenalty -
    gapPenalty;

  const confidenceScore = Number(clamp(rawConfidence, 0.18, 0.96).toFixed(2));
  const confidenceTier =
    confidenceScore >= 0.78 ? "high" : confidenceScore >= 0.55 ? "medium" : "low";
  const confidenceLabel =
    confidenceTier === "high"
      ? "Mataas"
      : confidenceTier === "medium"
        ? "Katamtaman"
        : "Mababa";

  if (
    relevantArticles.length > 0 &&
    approvedArticles.length > 0 &&
    relevantArticles.length / Math.max(approvedArticles.length, 1) < 0.05 &&
    queryTokens.length > 0
  ) {
    gapWarnings.push(
      "Maliit lang ang bahagi ng kabuuang approved knowledge base ang tumama sa query na ito, kaya maaaring kulang pa ang local coverage para sa concern na ito."
    );
  }

  const whyThisAnswer = buildWhyThisAnswer({
    strongestArticle,
    answerMode,
    relevantArticles,
    usedWebGrounding,
    localCoverageRatio,
  });
  const assumptions = buildAssumptions({
    queryTokens,
    relevantArticles,
    localCoverageRatio,
    usedWebGrounding,
  });
  const reviewRecommendation =
    confidenceTier === "high" && conflictWarnings.length === 0 && gapWarnings.length === 0
      ? {
          level: "ready" as const,
          label: "Handa para sa staff use",
          reason: "Matibay ang local support at wala pang malinaw na conflict o gap warning sa sagot na ito.",
        }
      : confidenceTier === "low" || conflictWarnings.length > 0 || gapWarnings.length >= 2
        ? {
            level: "caution" as const,
            label: "Kailangan ng maingat na review",
            reason: "May sapat na dahilan para huwag agad tratuhing final ang sagot nang walang human check o dagdag na detalye.",
          }
        : {
            level: "review" as const,
            label: "I-review bago gamitin",
            reason: "May local support, pero may isa o dalawang uncertainty na dapat pang i-check bago ipadala sa magsasaka.",
          };

  return {
    confidenceScore,
    confidenceTier,
    confidenceLabel,
    localCoverageRatio: Number(localCoverageRatio.toFixed(2)),
    whyThisAnswer,
    assumptions,
    evidenceItems,
    conflictWarnings,
    gapWarnings,
    reviewRecommendation,
    strongestArticleTitle: strongestArticle?.title,
    articleUsageBreakdown,
    usageSummary: {
      referencedCases: referencedCases.length,
      confirmedResolved,
      reopenedCases,
      ongoingCases,
    },
  };
}

export function searchArticlesLocally(query: string, articles: KnowledgeArticle[]): KnowledgeSearchResult {
  const searchableArticles = articles.filter(isKnowledgeArticleApproved);
  const queryTokens = tokenizeKnowledgeText(query);

  const matches = searchableArticles
    .map((article) => {
      const haystack = tokenizeKnowledgeText(
        [
          article.title,
          article.summary,
          article.content ?? "",
          article.keywords.join(" "),
          article.type,
          article.author,
        ].join(" ")
      );

      const uniqueQueryTokens = new Set(queryTokens);
      const score = Array.from(uniqueQueryTokens).reduce((total, token) => {
        return total + (haystack.includes(token) ? 1 : 0);
      }, 0);

      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const relevantArticles = matches.slice(0, 6).map((entry) => entry.article);
  const topArticle = relevantArticles[0];

  return {
    directAnswer: topArticle
      ? `Batay sa lokal na knowledge base, pinakamalapit na gabay ang "${topArticle.title}". ${topArticle.summary} Buksan ang kaugnay na artikulo sa ibaba para sa mas detalyadong paliwanag at mas ligtas na pagsunod.`
      : `Wala pang eksaktong approved na tugma sa lokal na knowledge base para sa "${query}". Subukang gumamit ng mas tiyak na keyword gaya ng pananim, peste, sintomas, lokasyon, o uri ng tulong na kailangan, o magpa-review muna ng imported article kung mayroon na.`,
    articles: relevantArticles,
  };
}

export function buildSuggestedArticlesLocally(messages: string[]): SuggestedKnowledgeTopic[] {
  const combined = messages.join(" ").toLowerCase();
  const suggestions: SuggestedKnowledgeTopic[] = [];

  if (combined.includes("peste") || combined.includes("leafminer") || combined.includes("daga")) {
    suggestions.push({
      title: "Pangunang Gabay sa Karaniwang Peste sa Barangay",
      summary: "Mga unang hakbang sa pag-report, pag-dokumento, at pansamantalang pagsugpo sa mga karaniwang pesteng naiuulat ng mga magsasaka.",
      keywords: ["peste", "leafminer", "daga", "rice bugs"],
    });
  }

  if (combined.includes("bagyo") || combined.includes("baha") || combined.includes("emergency")) {
    suggestions.push({
      title: "Gabay sa Bagyo, Baha, at Emergency Reporting",
      summary: "Checklist para sa mabilis na pagreport ng pinsala at mga pangunahing susunod na hakbang ng barangay at magsasaka.",
      keywords: ["bagyo", "baha", "emergency", "pinsala"],
    });
  }

  if (combined.includes("ani") || combined.includes("harvest") || combined.includes("presyo")) {
    suggestions.push({
      title: "Post-Harvest at Price Watch Basics",
      summary: "Mga paunang payo sa post-harvest handling, price checking, at paghahanda bago ibenta ang ani.",
      keywords: ["ani", "harvest", "presyo", "price watch"],
    });
  }

  if (suggestions.length === 0) {
    suggestions.push(
      {
        title: "Mga Madalas Itanong ng Magsasaka sa Barangay",
        summary: "Panimulang gabay para sa karaniwang concern sa peste, panahon, inputs, at barangay support.",
        keywords: ["faq", "magsasaka", "barangay"],
      },
      {
        title: "Paano Mag-report ng Concern sa Lingkod-Ani",
        summary: "Maikling paliwanag kung paano magsumite ng malinaw na SMS report at anong detalye ang mahalaga.",
        keywords: ["sms", "ulat", "report", "lingkod-ani"],
      }
    );
  }

  return suggestions.slice(0, 4);
}
