
'use client';
import React, { useState } from 'react';
import { knowledgeArticles as initialArticles, smsMessages } from '@/lib/data';
import type { KnowledgeArticle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot, Search, Volume2, BookOpen, Upload, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
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
  const [isNewEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'article' | 'audio'>('article');
  
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
        const articlesForSearch = knowledgeArticles.map(({ id, title, summary, keywords, type }) => ({ id, title, summary, keywords, type: type === 'audio' ? 'audio' : 'article' }));
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

  const handleAddNewEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const keywords = (formData.get('keywords') as string).split(',').map(kw => kw.trim()).filter(Boolean);
    const type = formData.get('type') as KnowledgeArticle['type'];

    if (!title || !summary || !keywords.length) {
        toast({title: "Kulang ang Impormasyon", description: "Punan ang lahat ng kinakailangang field.", variant: "destructive"});
        return;
    }

    const newEntry: KnowledgeArticle = {
        id: `KB${Date.now()}`,
        title,
        summary,
        content: type === 'article' ? formData.get('content') as string : '',
        audioUrl: type === 'audio' ? '/placeholder-audio.mp3' : undefined, // Placeholder URL for now
        keywords,
        type,
        author: 'Admin',
        lastUpdated: new Date().toISOString(),
    };

    setKnowledgeArticles(prev => [newEntry, ...prev]);
    setNewEntryDialogOpen(false);
    toast({title: "Tagumpay!", description: `Ang "${title}" ay naidagdag na sa knowledge base.`});
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Base ng Kaalaman</h1>
          <p className="text-muted-foreground">Maghanap ng impormasyon at pamahalaan ang mga artikulo at audio.</p>
        </div>
        <Dialog open={isNewEntryDialogOpen} onOpenChange={setNewEntryDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Bagong Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Magdagdag ng Bagong Entry</DialogTitle>
                    <DialogDescription>Punan ang mga detalye para sa bagong artikulo o audio story.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddNewEntry}>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Uri ng Content</Label>
                             <Select name="type" defaultValue={newEntryType} onValueChange={(value: 'article' | 'audio') => setNewEntryType(value)}>
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="article">Artikulo</SelectItem>
                                    <SelectItem value="audio">Boses ng Magsasaka (Audio)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Pamagat</Label>
                            <Input id="title" name="title" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="summary">Maikling Buod</Label>
                            <Textarea id="summary" name="summary" required />
                        </div>
                        {newEntryType === 'article' ? (
                            <div className="space-y-2">
                                <Label htmlFor="content">Nilalaman</Label>
                                <Textarea id="content" name="content" rows={8} required/>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="audio-file">Mag-upload ng Audio File</Label>
                                <Input id="audio-file" type="file" accept="audio/*" className="h-auto p-0 file:p-2 file:mr-4 file:border-0 file:bg-muted file:rounded-sm cursor-pointer file:cursor-pointer" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="keywords">Mga Keyword (paghiwalayin ng kuwit)</Label>
                            <Input id="keywords" name="keywords" placeholder="hal. pataba, mais, peste" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Kanselahin</Button></DialogClose>
                        <Button type="submit">I-save ang Entry</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
      
      {isSearching && (
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
      )}

      {searchResults ? (
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
                            <Card key={article.id}>
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
                                {article.type === 'audio' && article.audioUrl && (
                                    <CardFooter>
                                        <audio controls className="w-full">
                                            <source src={article.audioUrl} type="audio/mpeg" />
                                        </audio>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
      ) : !isSearching && (
        <Card>
            <CardHeader>
            <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <CardTitle>Mga Mungkahing Artikulo ng AI</CardTitle>
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
                    <Button onClick={fetchSuggestions} disabled={isSuggesting}>
                        <Bot className="mr-2"/>
                        {isSuggesting ? 'Nagmumungkahi...' : 'Kumuha ng mga Mungkahi'}
                    </Button>
                </div>
            )}
            </CardContent>
        </Card>
      )}

    </div>
  );
}
