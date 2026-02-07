'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { knowledgeArticles as initialArticles, smsMessages } from '@/lib/data';
import type { KnowledgeArticle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Search, Volume2, FileText, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { suggestKnowledgeBaseArticles } from '@/ai/flows/suggest-knowledge-base-articles';
import { searchKnowledgeBase } from '@/ai/flows/search-knowledge-base';

type SuggestedArticle = {
    title: string;
    summary: string;
    keywords: string[];
}

export default function KnowledgeBasePage() {
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ directAnswer: string; articles: KnowledgeArticle[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedArticle[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const { toast } = useToast();

  async function fetchSuggestions() {
    setIsSuggesting(true);
    setSuggestedArticles([]);
    try {
        const smsReports = smsMessages.map(m => m.message).slice(0, 10);
        const result = await suggestKnowledgeBaseArticles({ smsReports, farmerInquiries: [] });
        setSuggestedArticles(result.suggestedArticles);
    } catch (error) {
        console.error("Failed to fetch AI suggestions:", error);
        toast({
            title: "Error sa Pagkuha ng Mungkahi",
            description: "Hindi makuha ang mga mungkahi mula sa AI. Maaaring puno na ang quota.",
            variant: "destructive"
        });
    } finally {
      setIsSuggesting(false);
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);

    try {
        const articlesForSearch = knowledgeArticles.map(({ id, title, summary, keywords, type }) => ({ id, title, summary, keywords, type: type === 'audio' ? 'audio' : 'article' as 'article' | 'audio' }));
        const response = await searchKnowledgeBase({ query: searchQuery, articles: articlesForSearch });

        const relevantArticles = knowledgeArticles.filter(article => 
            response.relevantArticleIds.includes(article.id)
        );

        setSearchResults({
            directAnswer: response.directAnswer,
            articles: relevantArticles,
        });

    } catch (error) {
        console.error("Search failed:", error);
        toast({
            title: "Error sa Paghahanap",
            description: "Nagkaroon ng problema sa pagproseso ng iyong tanong.",
            variant: "destructive"
        });
    } finally {
        setIsSearching(false);
    }
  };

  const recentArticles = knowledgeArticles.slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Base ng Kaalaman</h1>
          <p className="text-muted-foreground">Maghanap ng impormasyon at pamahalaan ang mga artikulo at audio.</p>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
            type="search"
            placeholder="Magtanong tungkol sa pagsasaka... hal. 'Paano sugpuin ang armyworms sa sibuyas?'"
            className="w-full rounded-lg bg-background pl-12 pr-24 py-6 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSearching}>
            {isSearching ? 'Naghahanap...' : 'Maghanap'}
        </Button>
      </form>
      
      {isSearching ? (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        </div>
      ) : searchResults ? (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Sagot ng AI</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground">{searchResults.directAnswer}</p>
                </CardContent>
            </Card>

            {searchResults.articles.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Mga Kaugnay na Resulta mula sa Knowledge Base</h2>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {searchResults.articles.map((article) => (
                            <Link key={article.id} href={`/dashboard/knowledge-base/${article.id}`}>
                                <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            {article.type === 'audio' ? <Volume2/> : <FileText/>}
                                            {article.title}
                                        </CardTitle>
                                        <CardDescription>{article.summary}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {article.keywords.map(kw => <Badge key={kw} variant="outline">{kw}</Badge>)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
      ) : (
        <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <CardTitle>Mga Mungkahing Artikulo ng AI</CardTitle>
                </div>
                <Button onClick={fetchSuggestions} disabled={isSuggesting} size="sm">
                    <Bot className="mr-2 h-4 w-4"/>
                    {isSuggesting ? 'Nagmumungkahi...' : 'Kumuha ng mga Mungkahi'}
                </Button>
            </div>
            <CardDescription>
                Pindutin ang button para hilingin sa AI na magmungkahi ng mga paksa para sa bagong artikulo batay sa mga kamakailang SMS.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {isSuggesting ? (
                <>
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="h-36 w-full" />
                </>
            ) : suggestedArticles.length > 0 ? (
                suggestedArticles.map(article => (
                    <Card key={article.title} className="bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{article.summary}</p>
                            <div className="flex flex-wrap gap-2">
                                {article.keywords.map(kw => <Badge key={kw} variant="outline">{kw}</Badge>)}
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">Handa nang mag-isip ng mga bagong ideya ang AI.</p>
                </div>
            )}
            </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Mga Bagong Dagdag na Artikulo</h2>
          <Button asChild variant="outline">
            <Link href="/dashboard/knowledge-base/all">
              Tingnan Lahat
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((article) => (
                <Link key={article.id} href={`/dashboard/knowledge-base/${article.id}`}>
                    <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                {article.type === 'audio' ? <Volume2/> : <FileText/>}
                                {article.title}
                            </CardTitle>
                            <CardDescription>{article.summary}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {article.keywords.map(kw => <Badge key={kw} variant="outline">{kw}</Badge>)}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
