
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import type { KnowledgeArticle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Search, Volume2, FileText, ArrowUpRight, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { useData } from '@/context/data-context';
import { uploadKnowledgeAudioFile } from '@/lib/services/knowledge-file-service';
import { AiStatusBanner } from '@/components/shared/ai-status-banner';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';

type SuggestedArticle = {
    title: string;
    summary: string;
    keywords: string[];
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function searchArticlesLocally(query: string, articles: KnowledgeArticle[]) {
  const queryTokens = tokenize(query);

  const matches = articles
    .map((article) => {
      const haystack = tokenize([
        article.title,
        article.summary,
        article.content ?? '',
        article.keywords.join(' '),
        article.type,
      ].join(' '));

      const score = queryTokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);

      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const relevantArticles = matches.slice(0, 6).map((entry) => entry.article);
  const topArticle = relevantArticles[0];

  return {
    directAnswer: topArticle
      ? `Batay sa lokal na knowledge base, pinakamalapit na gabay ang "${topArticle.title}". ${topArticle.summary} Buksan ang kaugnay na artikulo sa ibaba para sa mas detalyadong paliwanag.`
      : `Wala pang eksaktong tugma sa lokal na knowledge base para sa "${query}". Subukang gumamit ng mas tiyak na keyword gaya ng pananim, peste, sintomas, o uri ng tulong na kailangan.`,
    articles: relevantArticles,
  };
}

function buildSuggestedArticlesLocally(messages: string[]): SuggestedArticle[] {
  const combined = messages.join(' ').toLowerCase();
  const suggestions: SuggestedArticle[] = [];

  if (combined.includes('peste') || combined.includes('leafminer') || combined.includes('daga')) {
    suggestions.push({
      title: 'Pangunang Gabay sa Karaniwang Peste sa Barangay',
      summary: 'Mga unang hakbang sa pag-report, pag-dokumento, at pansamantalang pagsugpo sa mga karaniwang pesteng naiuulat ng mga magsasaka.',
      keywords: ['peste', 'leafminer', 'daga', 'rice bugs'],
    });
  }

  if (combined.includes('bagyo') || combined.includes('baha') || combined.includes('emergency')) {
    suggestions.push({
      title: 'Gabay sa Bagyo, Baha, at Emergency Reporting',
      summary: 'Checklist para sa mabilis na pagreport ng pinsala at mga pangunahing susunod na hakbang ng barangay at magsasaka.',
      keywords: ['bagyo', 'baha', 'emergency', 'pinsala'],
    });
  }

  if (combined.includes('ani') || combined.includes('harvest') || combined.includes('presyo')) {
    suggestions.push({
      title: 'Post-Harvest at Price Watch Basics',
      summary: 'Mga paunang payo sa post-harvest handling, price checking, at paghahanda bago ibenta ang ani.',
      keywords: ['ani', 'harvest', 'presyo', 'price watch'],
    });
  }

  if (suggestions.length === 0) {
    suggestions.push(
      {
        title: 'Mga Madalas Itanong ng Magsasaka sa Barangay',
        summary: 'Panimulang gabay para sa karaniwang concern sa peste, panahon, inputs, at barangay support.',
        keywords: ['faq', 'magsasaka', 'barangay'],
      },
      {
        title: 'Paano Mag-report ng Concern sa Lingkod-Ani',
        summary: 'Maikling paliwanag kung paano magsumite ng malinaw na SMS report at anong detalye ang mahalaga.',
        keywords: ['sms', 'ulat', 'report', 'lingkod-ani'],
      },
    );
  }

  return suggestions.slice(0, 4);
}

export default function KnowledgeBasePage() {
  const { knowledgeArticles, addKnowledgeArticle, smsMessages } = useData();
  const { capabilities, capabilitiesLoading } = useRuntimeCapabilities();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ directAnswer: string; articles: KnowledgeArticle[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedArticle[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isNewEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'article' | 'audio'>('article');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  
  const { toast } = useToast();
  const audioUploadLocked = !capabilities.knowledgeAudioUploadConfigured;
  const audioUploadLockMessage =
    capabilities.reasons.knowledgeAudio ??
    'Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase storage setup.';

  const handleAddNewEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const keywords = (formData.get('keywords') as string).split(',').map(kw => kw.trim()).filter(Boolean);
    const type = formData.get('type') as KnowledgeArticle['type'];
    const content = type === 'article' ? formData.get('content') as string : '';
    const audioFile = formData.get('audioFile');

    if (type === 'audio' && audioUploadLocked) {
      toast({
        title: "Audio upload locked",
        description: audioUploadLockMessage,
        variant: "destructive",
      });
      return;
    }

    if (!title || !summary || !keywords.length) {
        toast({title: "Kulang ang Impormasyon", description: "Punan ang lahat ng kinakailangang field.", variant: "destructive"});
        return;
    }

    if (type === 'audio' && (!(audioFile instanceof File) || audioFile.size === 0)) {
      toast({ title: "Kulang ang Audio File", description: "Pumili ng audio file para sa knowledge audio entry.", variant: "destructive" });
      return;
    }

    setIsSavingEntry(true);

    try {
      const audioUrl = type === 'audio' && audioFile instanceof File
        ? await uploadKnowledgeAudioFile(audioFile, title)
        : undefined;

      addKnowledgeArticle({ title, summary, keywords, type, content, audioUrl });
      setNewEntryDialogOpen(false);
      toast({title: "Tagumpay!", description: `Ang "${title}" ay naidagdag na sa knowledge base.`});
    } catch (error) {
      toast({
        title: "Hindi ma-save ang knowledge entry",
        description: error instanceof Error ? error.message : "Nagkaroon ng problema sa pag-upload ng knowledge file.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEntry(false);
    }
  };

  async function fetchSuggestions() {
    setIsSuggesting(true);
    setSuggestedArticles([]);
    try {
        const smsReports = smsMessages.map(m => m.message).slice(0, 10);
        setSuggestedArticles(buildSuggestedArticlesLocally(smsReports));
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
        const response = searchArticlesLocally(searchQuery, knowledgeArticles);
        setSearchResults(response);

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

  const filteredLocalArticles = knowledgeArticles.filter(article => {
    if (!localSearchQuery) return false; // Don't show anything if search is empty, until user types
    const query = localSearchQuery.toLowerCase();
    return (
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.keywords.some(kw => kw.toLowerCase().includes(query))
    );
  });
  
  const articlesToShow = localSearchQuery ? filteredLocalArticles : knowledgeArticles.slice(0, 6);


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">Base ng Kaalaman</h1>
            <HelpDialog title="Base ng Kaalaman" tooltipText="Maghanap ng impormasyon at pamahalaan ang mga artikulo.">
              <p>Ito ang iyong sentral na hub para sa lahat ng impormasyon sa pagsasaka. Dito mo maaaring hanapin ang mga sagot sa mga tanong ng magsasaka, pamahalaan ang mga umiiral na artikulo, at magdagdag ng mga bago.</p>
              <p><strong>Search assistant (itaas na search bar):</strong> Sa preview, gumagamit muna ito ng lokal na article matching at guided fallback answers. Kapag naka-enable na ang live AI service, dito puwedeng pumasok ang mas advanced na semantic search at richer suggestions.</p>
              <p><strong>Mga Mungkahing Artikulo:</strong> Sa kasalukuyang preview, ang mga suggestion ay binubuo mula sa mga recent SMS pattern at local heuristics para manatiling usable kahit wala pang live AI dependency.</p>
              <p><strong>Mga Bagong Dagdag na Artikulo:</strong> Nagpapakita ito ng mga pinakabagong artikulo. Mayroon itong sariling simpleng search bar para mabilis na mahanap ang mga artikulo ayon sa pamagat o keyword. Pindutin ang "Tingnan Lahat" para makita ang kumpletong listahan sa isang hiwalay na pahina.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">Maghanap ng impormasyon at pamahalaan ang mga artikulo at audio.</p>
        </div>
      </div>

      <AiStatusBanner
        title="Preview search mode"
        description="Sa local preview, ang search sa Knowledge Base ay gumagamit muna ng local article matching at safe fallback suggestions. Hindi pa ito full live AI semantic search, kaya malinaw muna ang sagot kaysa misleading na magkunwaring fully AI-powered."
      />
      {audioUploadLocked ? (
        <AiStatusBanner
          title="Audio upload locked"
          description={audioUploadLockMessage}
        />
      ) : null}
      
      <form onSubmit={handleSearch}>
        <HoverTooltip text="Gamitin ito para sa mga tanong na parang nakikipag-usap sa isang eksperto. Hal. 'Paano ko masusugpo ang mga peste sa aking taniman ng kamatis?'">
          <div className="relative">
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
          </div>
        </HoverTooltip>
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
                    <div className="flex items-center">
                      <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Sagot ng Search Assistant</CardTitle>
                      <HelpDialog title="Sagot ng Search Assistant" tooltipText="Unawain kung paano binuo ang sagot.">
                        <p>Sa preview na ito, ang sagot ay binubuo muna mula sa lokal na knowledge base at keyword-based matching para manatiling matatag kahit wala pang full AI service sa runtime.</p>
                        <p>Kapag naka-enable na ang live AI service, puwede itong palawakin sa mas advanced na semantic search at richer article suggestions.</p>
                      </HelpDialog>
                    </div>
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
                <div className="flex items-center">
                    <div className="flex items-center">
                      <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6" />Mga Mungkahing Artikulo</CardTitle>
                      <HelpDialog title="Mga Mungkahing Artikulo" tooltipText="Tingnan ang mga mungkahi para sa mga bagong artikulo.">
                        <p>Sinusuri ng system ang mga kamakailang SMS mula sa mga magsasaka upang matukoy ang mga umuusbong na trend at mga karaniwang tanong. Batay dito, nagmumungkahi ito ng mga paksa para sa mga bagong artikulo na maaaring maging kapaki-pakinabang para sa komunidad.</p>
                        <p>Gamitin ito bilang inspirasyon para sa mga susunod na artikulo na iyong isusulat. Ito ay isang proaktibong paraan upang matugunan ang mga pangangailangan ng mga magsasaka bago pa man sila magtanong.</p>
                      </HelpDialog>
                    </div>
                </div>
                <HoverTooltip text="Hilingin sa AI na suriin ang mga kamakailang SMS at magmungkahi ng mga bagong paksa.">
                  <Button onClick={fetchSuggestions} disabled={isSuggesting} size="sm">
                      <Bot className="mr-2 h-4 w-4"/>
                      {isSuggesting ? 'Nagmumungkahi...' : 'Kumuha ng mga Mungkahi'}
                  </Button>
                </HoverTooltip>
            </div>
            <CardDescription>
                Pindutin ang button para kumuha ng mga suggested topic batay sa mga kamakailang SMS at local knowledge patterns.
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
            <Dialog open={isNewEntryDialogOpen} onOpenChange={setNewEntryDialogOpen}>
                <DialogTrigger asChild>
                   <HoverTooltip text="Magdagdag ng bagong artikulo o kwentong audio sa knowledge base.">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Bagong Entry
                    </Button>
                  </HoverTooltip>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Magdagdag ng Bagong Entry</DialogTitle>
                        <DialogDescription>Punan ang mga detalye para sa bagong artikulo o audio story.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddNewEntry}>
                        <div className="grid gap-6 py-4">
                           <HoverTooltip text="Pumili kung ito ay isang text-based na artikulo o isang audio recording.">
                            <div className="space-y-2">
                                <Label htmlFor="type-main">Uri ng Content</Label>
                                <Select name="type" defaultValue={newEntryType} onValueChange={(value: 'article' | 'audio') => setNewEntryType(value)}>
                                    <SelectTrigger id="type-main">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="article">Artikulo</SelectItem>
                                        <SelectItem value="audio" disabled={audioUploadLocked || capabilitiesLoading}>Boses ng Magsasaka (Audio)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                           </HoverTooltip>
                           <HoverTooltip text="Ang pamagat ng iyong artikulo o audio story.">
                            <div className="space-y-2">
                                <Label htmlFor="title-main">Pamagat</Label>
                                <Input id="title-main" name="title" required />
                            </div>
                           </HoverTooltip>
                           <HoverTooltip text="Isang maikling, isang-pangungusap na buod ng nilalaman.">
                            <div className="space-y-2">
                                <Label htmlFor="summary-main">Maikling Buod</Label>
                                <Textarea id="summary-main" name="summary" required />
                            </div>
                           </HoverTooltip>
                            {newEntryType === 'article' ? (
                                <HoverTooltip text="Isulat dito ang buong nilalaman ng iyong artikulo.">
                                <div className="space-y-2">
                                    <Label htmlFor="content-main">Nilalaman</Label>
                                    <Textarea id="content-main" name="content" rows={8} required/>
                                </div>
                                </HoverTooltip>
                            ) : (
                                <HoverTooltip text="Pumili ng audio file (hal. MP3) mula sa iyong computer.">
                                <div className="space-y-2">
                                    <Label htmlFor="audio-file-main">Mag-upload ng Audio File</Label>
                                    <Input id="audio-file-main" name="audioFile" type="file" accept="audio/*" className="h-auto p-0 file:p-2 file:mr-4 file:border-0 file:bg-muted file:rounded-sm cursor-pointer file:cursor-pointer" />
                                </div>
                                </HoverTooltip>
                            )}
                             <HoverTooltip text="Maglagay ng mga kaugnay na salita para mas madaling mahanap ang entry. Paghiwalayin ng kuwit.">
                              <div className="space-y-2">
                                  <Label htmlFor="keywords-main">Mga Keyword (paghiwalayin ng kuwit)</Label>
                                  <Input id="keywords-main" name="keywords" placeholder="hal. pataba, mais, peste" required />
                              </div>
                            </HoverTooltip>
                        </div>
                        <DialogFooter>
                            <HoverTooltip text="Isara ang window na ito nang hindi nagse-save.">
                              <DialogClose asChild><Button type="button" variant="outline">Kanselahin</Button></DialogClose>
                            </HoverTooltip>
                            <HoverTooltip text="I-save ang bagong entry sa knowledge base.">
                              <Button type="submit" disabled={isSavingEntry || (newEntryType === 'audio' && (audioUploadLocked || capabilitiesLoading))}>{isSavingEntry ? 'Nagse-save...' : 'I-save ang Entry'}</Button>
                            </HoverTooltip>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <HoverTooltip text="Mag-type dito upang mabilis na mahanap ang isang artikulo sa listahan.">
              <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Maghanap sa mga artikulo..."
                      className="w-full rounded-lg bg-background pl-10"
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                  />
              </div>
            </HoverTooltip>
            <HoverTooltip text="Tingnan ang kumpletong listahan ng lahat ng artikulo sa isang hiwalay na pahina.">
              <Button asChild variant="outline">
                  <Link href="/dashboard/knowledge-base/all">
                    Tingnan Lahat
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
            </HoverTooltip>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {articlesToShow.map((article) => (
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
             {localSearchQuery && articlesToShow.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    <p>Walang nahanap na artikulo para sa "{localSearchQuery}".</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
