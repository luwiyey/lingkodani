import type { KnowledgeArticle } from "@/lib/types";

export type KnowledgeSearchResult = {
  directAnswer: string;
  articles: KnowledgeArticle[];
};

export type SuggestedKnowledgeTopic = {
  title: string;
  summary: string;
  keywords: string[];
};

export function tokenizeKnowledgeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

export function searchArticlesLocally(query: string, articles: KnowledgeArticle[]): KnowledgeSearchResult {
  const queryTokens = tokenizeKnowledgeText(query);

  const matches = articles
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
      : `Wala pang eksaktong tugma sa lokal na knowledge base para sa "${query}". Subukang gumamit ng mas tiyak na keyword gaya ng pananim, peste, sintomas, lokasyon, o uri ng tulong na kailangan.`,
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
