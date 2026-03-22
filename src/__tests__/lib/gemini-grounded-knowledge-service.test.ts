import { extractGroundedKnowledgeMetadata } from "@/lib/services/gemini-grounded-knowledge-service";

describe("gemini-grounded-knowledge-service", () => {
  it("extracts unique grounded web sources and queries from Gemini metadata", () => {
    const metadata = extractGroundedKnowledgeMetadata({
      candidates: [
        {
          groundingMetadata: {
            webSearchQueries: ["rice bug management philippines", "rice bug management philippines"],
            groundingChunks: [
              {
                web: {
                  title: "PhilRice guide",
                  uri: "https://example.com/philrice",
                },
              },
              {
                web: {
                  title: "PhilRice guide",
                  uri: "https://example.com/philrice",
                },
              },
              {
                web: {
                  title: "DA advisory",
                  uri: "https://example.com/da",
                },
              },
            ],
          },
        },
      ],
    });

    expect(metadata.usedWebGrounding).toBe(true);
    expect(metadata.webSearchQueries[0]).toContain("rice bug");
    expect(metadata.webSources).toHaveLength(2);
    expect(metadata.webSources[0]?.title).toBe("PhilRice guide");
  });
});
