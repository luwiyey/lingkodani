
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
import { buildSuggestedArticlesLocally, searchArticlesLocally, type SuggestedKnowledgeTopic } from '@/lib/knowledge-search';
import { uploadKnowledgeAudioFile } from '@/lib/services/knowledge-file-service';
import { transcribeAudioUpload } from '@/lib/services/audio-transcription-service';
import { AiStatusBanner } from '@/components/shared/ai-status-banner';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';

export default function KnowledgeBasePage() {
  const { knowledgeArticles, addKnowledgeArticle, smsMessages } = useData();
  const { capabilities, capabilitiesLoading } = useRuntimeCapabilities();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ directAnswer: string; articles: KnowledgeArticle[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedKnowledgeTopic[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isNewEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'article' | 'audio'>('article');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  
  const { toast } = useToast();
  const audioUploadLocked = !capabilities.storageUploadConfigured;
  const audioUploadLockMessage =
    capabilities.reasons.storageUpload ??
    'Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase storage setup.';

  const handleAddNewEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawTitle = (formData.get('title') as string | null)?.trim() ?? '';
    const summary = (formData.get('summary') as string | null)?.trim() ?? '';
    const keywords = (formData.get('keywords') as string).split(',').map(kw => kw.trim()).filter(Boolean);
    const type = formData.get('type') as KnowledgeArticle['type'];
    const content = type === 'article' ? (formData.get('content') as string) : '';
    const audioFile = formData.get('audioFile');

    if (type === 'audio' && audioUploadLocked) {
      toast({
        title: "Audio upload locked",
        description: audioUploadLockMessage,
        variant: "destructive",
      });
      return;
    }

    const requiresManualMetadata = type !== 'audio';

    if ((!rawTitle && type === 'article') || (requiresManualMetadata && (!summary || !keywords.length))) {
        toast({title: "Kulang ang Impormasyon", description: "Punan ang lahat ng kinakailangang field.", variant: "destructive"});
        return;
    }

    if (type === 'audio' && (!(audioFile instanceof File) || audioFile.size === 0)) {
      toast({ title: "Kulang ang Audio File", description: "Pumili ng audio file para sa knowledge audio entry.", variant: "destructive" });
      return;
    }

    setIsSavingEntry(true);

    try {
      const audioTranscription = type === 'audio' && audioFile instanceof File
        ? await transcribeAudioUpload(audioFile, 'knowledge_audio')
        : null;
      const fallbackTitle = type === 'audio' && audioFile instanceof File
        ? audioFile.name.replace(/\.[^.]+$/, '').trim()
        : '';
      const title = rawTitle || audioTranscription?.suggestedTitle?.trim() || fallbackTitle || 'Bagong Audio Knowledge Entry';
      const audioUrl = type === 'audio' && audioFile instanceof File
        ? await uploadKnowledgeAudioFile(audioFile, title)
        : undefined;
      const mergedKeywords = Array.from(
        new Set([
          ...keywords,
          ...(audioTranscription?.keywords ?? []),
        ].map((keyword) => keyword.trim()).filter(Boolean))
      );

      addKnowledgeArticle({
        title,
        summary: type === 'audio' ? (summary.trim() || audioTranscription?.summary || 'Auto-generated mula sa transcript ng audio entry.') : summary,
        keywords: mergedKeywords,
        type,
        content: type === 'audio' ? (audioTranscription?.transcript ?? '') : content,
        audioUrl,
      });
      setNewEntryDialogOpen(false);
      toast({
        title: "Tagumpay!",
        description:
          type === 'audio'
            ? `Ang "${title}" ay naidagdag na sa knowledge base kasama ang transcript at searchable keywords.`
            : `Ang "${title}" ay naidagdag na sa knowledge base.`,
      });
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
        if (capabilities.aiConfigured) {
          const response = await fetch('/api/knowledge/suggestions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });

          if (response.ok) {
            const payload = await response.json() as { suggestedArticles?: SuggestedKnowledgeTopic[] };
            setSuggestedArticles(Array.isArray(payload.suggestedArticles) ? payload.suggestedArticles : []);
            return;
          }
        }

        setSuggestedArticles(buildSuggestedArticlesLocally(smsMessages.map(m => m.message).slice(0, 10)));
    } catch (error) {
        console.error("Failed to fetch AI suggestions:", error);
        setSuggestedArticles(buildSuggestedArticlesLocally(smsMessages.map(m => m.message).slice(0, 10)));
        toast({
            title: "Gumamit muna ng lokal na suggestions",
            description: "Hindi makuha ang AI-assisted suggestions sa ngayon, kaya lokal na patterns muna ang ginamit.",
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
        const localResult = searchArticlesLocally(searchQuery, knowledgeArticles);

        if (capabilities.aiConfigured) {
          const response = await fetch('/api/knowledge/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
            }),
          });

          if (response.ok) {
            const payload = await response.json() as {
              directAnswer?: string;
              relevantArticleIds?: string[];
              relevantArticles?: KnowledgeArticle[];
            };
            const relevantArticles = Array.isArray(payload.relevantArticles) && payload.relevantArticles.length > 0
              ? payload.relevantArticles
              : (payload.relevantArticleIds ?? [])
                .map((articleId) => knowledgeArticles.find((article) => article.id === articleId))
                .filter((article): article is KnowledgeArticle => Boolean(article));

            setSearchResults({
              directAnswer: payload.directAnswer?.trim() || localResult.directAnswer,
              articles: relevantArticles.length > 0 ? relevantArticles : localResult.articles,
            });
            return;
          }
        }

        setSearchResults(localResult);

    } catch (error) {
        console.error("Search failed:", error);
        setSearchResults(searchArticlesLocally(searchQuery, knowledgeArticles));
        toast({
            title: "Gumamit muna ng lokal na search",
            description: "Hindi makuha ang AI-assisted answer sa ngayon, kaya local knowledge matching muna ang ginamit.",
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
              <p><strong>Search assistant (itaas na search bar):</strong> Gumagamit ito ng lokal na knowledge articles bilang pangunahing source. Kapag available ang AI, nire-rewrite nito ang sagot para maging mas malinaw at grounded sa aktwal na lokal na content.</p>
              <p><strong>Mga Mungkahing Artikulo:</strong> Binubuo ito mula sa recent SMS patterns at, kapag available, AI-assisted topic suggestions para malaman kung anong local guide pa ang kulang.</p>
              <p><strong>Mga Bagong Dagdag na Artikulo:</strong> Nagpapakita ito ng mga pinakabagong artikulo. Mayroon itong sariling simpleng search bar para mabilis na mahanap ang mga artikulo ayon sa pamagat o keyword. Pindutin ang "Tingnan Lahat" para makita ang kumpletong listahan sa isang hiwalay na pahina.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">Maghanap ng impormasyon at pamahalaan ang mga artikulo at audio.</p>
        </div>
      </div>

      <AiStatusBanner
        title={capabilities.aiConfigured ? "AI-assisted local knowledge search" : "Local knowledge search"}
        description={capabilities.aiConfigured
          ? "Gumagamit ang search ng lokal na knowledge articles bilang source of truth, habang tumutulong ang AI sa pagbuo ng mas malinaw na sagot at suggested topics."
          : "Lokal na article matching muna ang ginagamit ng search habang hindi pa available ang AI service. Grounded pa rin ito sa naka-save na knowledge articles."}
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
                        <p>Ang sagot ay laging nakaangkla muna sa lokal na knowledge base. Kapag available ang AI, nire-rewrite nito ang sagot sa mas malinaw na Filipino nang hindi lumalayo sa mga naka-save na article.</p>
                        <p>Kapag kulang ang local content, mas magandang magdagdag ng bagong article o mag-import ng PDF/image references kaysa magkunwaring may sagot ang system na wala naman sa source material.</p>
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
                                <Input
                                  id="title-main"
                                  name="title"
                                  required={newEntryType === 'article'}
                                  placeholder={newEntryType === 'audio' ? 'Opsyonal para sa audio. Kapag iniwang blangko, gagawa ang system ng pamagat mula sa transcript o file name.' : ''}
                                />
                            </div>
                           </HoverTooltip>
                           <HoverTooltip text="Isang maikling, isang-pangungusap na buod ng nilalaman.">
                            <div className="space-y-2">
                                <Label htmlFor="summary-main">Maikling Buod</Label>
                                <Textarea id="summary-main" name="summary" required={newEntryType === 'article'} placeholder={newEntryType === 'audio' ? 'Opsyonal para sa audio. Kapag iniwang blangko, gagawa ang system ng buod mula sa transcript.' : ''} />
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
                                  <Input id="keywords-main" name="keywords" placeholder={newEntryType === 'audio' ? 'Opsyonal para sa audio. Hal. peste, palay, baha' : 'hal. pataba, mais, peste'} required={newEntryType === 'article'} />
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
