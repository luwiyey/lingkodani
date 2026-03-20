import { normalizeKnowledgeQueryArticles } from '@/lib/knowledge-query';

describe('normalizeKnowledgeQueryArticles', () => {
  it('fills safe defaults for missing author and type', () => {
    const articles = normalizeKnowledgeQueryArticles([
      {
        id: 'kb-1',
        title: 'Peste sa Palay',
        summary: 'Maikling buod',
        content: 'Mas mahabang nilalaman',
        keywords: ['palay', 'peste'],
      },
    ]);

    expect(articles).toHaveLength(1);
    expect(articles[0]).toEqual(
      expect.objectContaining({
        id: 'kb-1',
        author: 'Imported Knowledge',
        type: 'article',
      })
    );
    expect(articles[0].lastUpdated).toEqual(expect.any(String));
  });

  it('drops malformed records instead of returning half-valid entries', () => {
    const articles = normalizeKnowledgeQueryArticles([
      {
        id: 'kb-1',
        title: 'Kulng ang summary',
        content: 'May laman',
        keywords: ['palay'],
      },
      {
        id: 'kb-2',
        title: 'Valid',
        summary: 'May buod',
        content: 'May laman',
        keywords: ['palay'],
      },
    ]);

    expect(articles).toHaveLength(1);
    expect(articles[0].id).toBe('kb-2');
  });
});
