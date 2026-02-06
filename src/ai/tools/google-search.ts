'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const googleSearchTool = ai.defineTool(
  {
    name: 'googleSearchTool',
    description: 'Performs a web search using Google to find up-to-date information on a topic. Use this to find information not present in the local knowledge base.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.array(
        z.object({
            title: z.string(),
            link: z.string(),
            snippet: z.string(),
        })
    ),
  },
  async (input) => {
    // In a real implementation, this would call the Google Custom Search API with an API key.
    // For now, we'll return mock data to simulate the functionality.
    console.log(`Simulating Google Search for: ${input.query}`);
    
    // Example mock response
    if (input.query.toLowerCase().includes('armyworms')) {
        return [
            {
                title: 'Control of Fall Armyworm in the Philippines | CABI',
                link: 'https://www.cabi.org/isc/datasheet/29810',
                snippet: 'Management of fall armyworm (Spodoptera frugiperda) in the Philippines focuses on integrated pest management (IPM) strategies, including cultural, biological, and chemical control methods.'
            },
            {
                title: 'Fall Armyworm (FAW) | Philippine Rice Research Institute',
                link: 'https://www.philrice.gov.ph/fall-armyworm-faw/',
                snippet: 'FAW is a highly destructive pest that can cause significant damage to corn and other crops. Early detection and rapid response are crucial for effective management.'
            }
        ];
    }
    
    // Default mock response
    return [
      {
        title: "Sample Web Search Result",
        link: "https://example.com/sample-result",
        snippet: "This is a sample snippet returned from a web search. It provides additional context that the AI can use to formulate a better answer.",
      },
       {
        title: "Another Relevant Article",
        link: "https://example.com/another-article",
        snippet: "More details about the user's query can be found here, discussing various aspects and solutions.",
      },
    ];
  }
);
