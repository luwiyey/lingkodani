import {
  buildKnowledgeAutocompleteSuggestions,
  buildKnowledgeSupportInsight,
  buildSuggestedArticlesLocally,
  searchArticlesLocally,
} from "@/lib/knowledge-search";
import type { KnowledgeArticle, SmsMessage } from "@/lib/types";

const articles: KnowledgeArticle[] = [
  {
    id: "KB-1",
    title: "Gabay sa Rice Bugs",
    summary: "Mga unang hakbang laban sa rice bugs sa palayan.",
    content: "Mag-inspeksyon agad at gumamit ng tamang pesticide kung aprubado ng AEW.",
    keywords: ["rice bugs", "peste", "palay"],
    lastUpdated: "2026-03-20T08:00:00.000Z",
    author: "Barangay Admin",
    type: "article",
  },
  {
    id: "KB-2",
    title: "Pagbaha at agarang tugon",
    summary: "Checklist kapag may baha sa taniman.",
    content: "I-secure ang mga punla at i-dokumento ang lawak ng pinsala.",
    keywords: ["baha", "bagyo", "emergency"],
    lastUpdated: "2026-03-20T08:30:00.000Z",
    author: "Barangay Admin",
    type: "tip",
  },
];

const smsMessages: SmsMessage[] = [
  {
    id: "SMS-KB-1",
    farmerId: "FARM-1",
    farmerName: "Juan",
    phone: "+639171234567",
    message: "May rice bugs sa palayan.",
    timestamp: "2026-03-25T08:00:00.000Z",
    parsedIntent: "PEST_DISEASE",
    urgency: "medium",
    status: "approved",
    aiAdvice: "Mag-monitor at magpa-validate.",
    aiConfidence: 0.84,
    safetyFlag: "Medium",
    knowledgeBaseId: "KB-1",
    resolutionConfirmationStatus: "confirmed_by_farmer",
  },
  {
    id: "SMS-KB-2",
    farmerId: "FARM-2",
    farmerName: "Maria",
    phone: "+639181234567",
    message: "May baha sa bukid namin.",
    timestamp: "2026-03-26T08:00:00.000Z",
    parsedIntent: "WEATHER_HELP",
    urgency: "high",
    status: "approved",
    aiAdvice: "I-secure ang punla at i-dokumento ang pinsala.",
    aiConfidence: 0.88,
    safetyFlag: "High",
    knowledgeBaseId: "KB-2",
    resolutionConfirmationStatus: "reopened",
  },
];

describe("knowledge-search", () => {
  it("finds relevant local articles for a query", () => {
    const result = searchArticlesLocally("May rice bugs sa palayan", articles);

    expect(result.articles[0]?.id).toBe("KB-1");
    expect(result.directAnswer).toContain("Gabay sa Rice Bugs");
  });

  it("builds grounded fallback suggestions from recent messages", () => {
    const suggestions = buildSuggestedArticlesLocally([
      "May baha po sa bukid namin",
      "Emergency po dahil sa bagyo",
    ]);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].keywords.join(" ")).toContain("bagyo");
  });

  it("builds autocomplete suggestions from approved article titles and keywords", () => {
    const suggestions = buildKnowledgeAutocompleteSuggestions("rice", articles);

    expect(suggestions).toContain("Gabay sa Rice Bugs");
    expect(suggestions).toContain("rice bugs");
    expect(suggestions.some((suggestion) => suggestion.startsWith("Paano sugpuin ang"))).toBe(true);
  });

  it("builds why-this-answer and article track record insight", () => {
    const insight = buildKnowledgeSupportInsight({
      query: "May rice bugs sa palay sa Zone 1",
      relevantArticles: [articles[0]],
      approvedArticles: articles,
      answerMode: "local_ai",
      usedWebGrounding: false,
      smsMessages,
    });

    expect(insight.whyThisAnswer).toContain("Gabay sa Rice Bugs");
    expect(insight.reviewRecommendation.label.length).toBeGreaterThan(0);
    expect(insight.articleUsageBreakdown[0]).toEqual(
      expect.objectContaining({
        articleId: "KB-1",
        referencedCases: 1,
        confirmedResolved: 1,
      })
    );
    expect(insight.assumptions.length).toBeGreaterThan(0);
  });
});
