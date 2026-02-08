
import { MetadataRoute } from 'next';
import { farmers, knowledgeArticles } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lingkod-ani.example.com';

  // Static pages
  const staticRoutes = [
    '/',
    '/dashboard',
    '/dashboard/account',
    '/dashboard/active-farms',
    '/dashboard/active-issues',
    '/dashboard/ai-toolkit',
    '/dashboard/audit-log',
    '/dashboard/disaster-mode',
    '/dashboard/disaster/inventory',
    '/dashboard/disaster/sms',
    '/dashboard/farmers',
    '/dashboard/farmers/approvals',
    '/dashboard/farmers/register',
    '/dashboard/inventory',
    '/dashboard/knowledge-base',
    '/dashboard/knowledge-base/all',
    '/dashboard/oversight',
    '/dashboard/reports',
    '/dashboard/settings',
    '/dashboard/sms-feed',
    '/dashboard/training',
    '/dashboard/vouchers',
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // Dynamic farmer pages
  const farmerRoutes = farmers.map((farmer) => ({
    url: `${baseUrl}/dashboard/farmers/${farmer.id}`,
    lastModified: new Date(farmer.lastSmsActivity),
  }));

  // Dynamic knowledge base pages
  const knowledgeRoutes = knowledgeArticles.map((article) => ({
    url: `${baseUrl}/dashboard/knowledge-base/${article.id}`,
    lastModified: new Date(article.lastUpdated),
  }));

  return [...staticRoutes, ...farmerRoutes, ...knowledgeRoutes];
}
