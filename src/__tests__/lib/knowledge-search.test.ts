import {
  buildKnowledgeAutocompleteSuggestions,
  buildSuggestedArticlesLocally,
  searchArticlesLocally,
} from "@/lib/knowledge-search";
import type { KnowledgeArticle } from "@/lib/types";

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
});
