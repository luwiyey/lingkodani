
'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { KnowledgeArticle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Search, Volume2, FileText, ArrowUpRight, PlusCircle, Copy } from 'lucide-react';
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
import { buildKnowledgeAutocompleteSuggestions, buildSuggestedArticlesLocally, isKnowledgeArticleApproved, searchArticlesLocally, type SuggestedKnowledgeTopic } from '@/lib/knowledge-search';
import { uploadKnowledgeAudioFile } from '@/lib/services/knowledge-file-service';
import { transcribeAudioUpload } from '@/lib/services/audio-transcription-service';
import { AiStatusBanner } from '@/components/shared/ai-status-banner';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';
import { Switch } from '@/components/ui/switch';

type SearchResultsState = {
  directAnswer: string;
  articles: KnowledgeArticle[];
  answerMode: 'local_only' | 'local_ai' | 'local_web';
  usedWebGrounding: boolean;
  webSearchQueries: string[];
  webSources: { title: string; url: string }[];
};

function getAnswerModeLabel(answerMode: SearchResultsState['answerMode']) {
  if (answerMode === 'local_web') {
    return 'Local + Gemini + Web';
  }

  if (answerMode === 'local_ai') {
    return 'Local + Gemini';
  }

  return 'Local only';
}

export default function KnowledgeBasePage() {
  const { knowledgeArticles, addKnowledgeArticle, smsMessages } = useData();
  const { capabilities, capabilitiesLoading } = useRuntimeCapabilities();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultsState | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedKnowledgeTopic[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isNewEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'article' | 'audio'>('article');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [includeWebGrounding, setIncludeWebGrounding] = useState(true);
  
  const { toast } = useToast();
  const audioUploadLocked = !capabilities.storageUploadConfigured;
  const approvedKnowledgeArticles = knowledgeArticles.filter(isKnowledgeArticleApproved);
  const pendingKnowledgeArticles = knowledgeArticles.filter(
    (article) => article.reviewStatus === 'needs_review'
  );
  const autocompleteSuggestions = useMemo(
    () => buildKnowledgeAutocompleteSuggestions(searchQuery, approvedKnowledgeArticles),
    [approvedKnowledgeArticles, searchQuery]
  );
  const audioUploadLockMessage =
    capabilities.reasons.storageUpload ??
    'Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase storage setup.';
  const showAutocomplete = !isSearching && searchQuery.trim().length > 0 && autocompleteSuggestions.length > 0;

  const handleCopyAnswer = async () => {
    if (!searchResults?.directAnswer) {
      return;
    }

    try {
      await navigator.clipboard.writeText(searchResults.directAnswer);
      toast({
        title: "Nakopya ang sagot",
        description: "Maaari mo na itong i-paste sa notes, report, o reply drafting flow.",
      });
    } catch {
      toast({
        title: "Hindi makopya ang sagot",
        description: "Subukan muli o i-highlight na lang muna ang text.",
        variant: "destructive",
      });
    }
  };

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
            body: JSON.stringify({
              smsReports: smsMessages.map((message) => message.message).slice(0, 30),
              farmerInquiries: smsMessages.map((message) => message.message).slice(0, 30),
            }),
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

  const performSearch = async (queryValue: string) => {
    const normalizedQuery = queryValue.trim();
    if (!normalizedQuery) return;
    setIsSearching(true);
    setSearchResults(null);

    try {
        const localResult = searchArticlesLocally(normalizedQuery, approvedKnowledgeArticles);

        if (capabilities.aiConfigured) {
          const response = await fetch('/api/knowledge/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: normalizedQuery,
              includeWebGrounding,
              articles: approvedKnowledgeArticles,
            }),
          });

          if (response.ok) {
            const payload = await response.json() as {
              directAnswer?: string;
              relevantArticleIds?: string[];
              relevantArticles?: KnowledgeArticle[];
              answerMode?: SearchResultsState['answerMode'];
              usedWebGrounding?: boolean;
              webSearchQueries?: string[];
              webSources?: { title?: string; url?: string }[];
            };
            const relevantArticles = Array.isArray(payload.relevantArticles) && payload.relevantArticles.length > 0
              ? payload.relevantArticles
              : (payload.relevantArticleIds ?? [])
                .map((articleId) => approvedKnowledgeArticles.find((article) => article.id === articleId))
                .filter((article): article is KnowledgeArticle => Boolean(article));

            setSearchResults({
              directAnswer: payload.directAnswer?.trim() || localResult.directAnswer,
              articles: relevantArticles.length > 0 ? relevantArticles : localResult.articles,
              answerMode: payload.answerMode ?? (payload.usedWebGrounding ? 'local_web' : 'local_ai'),
              usedWebGrounding: Boolean(payload.usedWebGrounding),
              webSearchQueries: Array.isArray(payload.webSearchQueries) ? payload.webSearchQueries.filter(Boolean) : [],
              webSources: Array.isArray(payload.webSources)
                ? payload.webSources
                    .map((source) => ({
                      title: source.title?.trim() || '',
                      url: source.url?.trim() || '',
                    }))
                    .filter((source) => source.title && source.url)
                : [],
            });
            return;
          }
        }

        setSearchResults({
          directAnswer: localResult.directAnswer,
          articles: localResult.articles,
          answerMode: 'local_only',
          usedWebGrounding: false,
          webSearchQueries: [],
          webSources: [],
        });

    } catch (error) {
        console.error("Search failed:", error);
        const fallback = searchArticlesLocally(normalizedQuery, approvedKnowledgeArticles);
        setSearchResults({
          directAnswer: fallback.directAnswer,
          articles: fallback.articles,
          answerMode: 'local_only',
          usedWebGrounding: false,
          webSearchQueries: [],
          webSources: [],
        });
        toast({
            title: "Gumamit muna ng lokal na search",
            description: "Hindi makuha ang AI-assisted answer sa ngayon, kaya local knowledge matching muna ang ginamit.",
        });
    } finally {
        setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchQuery);
  };

  const filteredLocalArticles = approvedKnowledgeArticles.filter(article => {
    if (!localSearchQuery) return false; // Don't show anything if search is empty, until user types
    const query = localSearchQuery.toLowerCase();
    return (
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.keywords.some(kw => kw.toLowerCase().includes(query))
    );
  });
  
  const articlesToShow = localSearchQuery ? filteredLocalArticles : approvedKnowledgeArticles.slice(0, 6);


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
          ? "Gumagamit ang search ng lokal na knowledge articles bilang source of truth, habang tumutulong ang Gemini sa pagbuo ng mas malinaw na sagot. Maaari mo ring i-on ang optional web grounding para may dagdag na live web sources kapag kailangan."
          : "Lokal na article matching muna ang ginagamit ng search habang hindi pa available ang AI service. Grounded pa rin ito sa naka-save na knowledge articles."}
      />
      {audioUploadLocked ? (
        <AiStatusBanner
          title="Audio upload locked"
          description={audioUploadLockMessage}
        />
      ) : null}
      {pendingKnowledgeArticles.length > 0 ? (
        <AiStatusBanner
          title="May imported knowledge na naghihintay ng review"
          description={`${pendingKnowledgeArticles.length} knowledge entr${pendingKnowledgeArticles.length === 1 ? 'y' : 'ies'} ang hindi pa approved. I-review muna ang mga ito sa Settings bago sila gamitin ng search at AI.`}
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchResults(null);
                }}
            />
            <Button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isSearching}>
                {isSearching ? 'Naghahanap...' : 'Maghanap'}
            </Button>
            {showAutocomplete ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Mga mungkahing query
                </p>
                <div className="flex flex-col gap-1">
                  {autocompleteSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        void performSearch(suggestion);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </HoverTooltip>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Switch
              checked={includeWebGrounding}
              onCheckedChange={setIncludeWebGrounding}
              disabled={!capabilities.aiConfigured}
              aria-label="Isama ang web grounding"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium leading-none">Isama ang web grounding</p>
              <p className="text-xs text-muted-foreground">
                {capabilities.aiConfigured
                  ? "Kapag naka-on, magdadagdag ang Gemini ng live web-supported sources kung kulang ang local knowledge."
                  : "Kailangan munang active ang Gemini AI bago magamit ang optional web grounding."}
              </p>
            </div>
          </div>
        </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Sagot ng Search Assistant</CardTitle>
                      <Badge variant={searchResults.answerMode === 'local_only' ? 'outline' : 'secondary'}>
                        {getAnswerModeLabel(searchResults.answerMode)}
                      </Badge>
                      <Badge variant="outline">Local knowledge</Badge>
                      {searchResults.usedWebGrounding ? <Badge variant="secondary">Web grounding</Badge> : null}
                      <HelpDialog title="Sagot ng Search Assistant" tooltipText="Unawain kung paano binuo ang sagot.">
                        <p>Ang sagot ay laging nakaangkla muna sa approved local knowledge base. Kapag available ang AI, nire-rewrite nito ang sagot sa mas malinaw na Filipino nang hindi lumalayo sa mga na-review nang article.</p>
                        <p>Kapag naka-on ang web grounding, maaari ring gumamit ang Gemini ng live web sources para dagdagan ang lokal na sagot. Ipapakita ang mga source sa ibaba para transparent ang pinanggalingan.</p>
                        <p>Kapag kulang ang local content, mas magandang magdagdag ng bagong article o mag-import ng PDF/image references kaysa magkunwaring may sagot ang system na wala naman sa source material.</p>
                      </HelpDialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground">{searchResults.directAnswer}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleCopyAnswer}>
                        <Copy className="mr-2 h-4 w-4" />
                        Kopyahin ang Sagot
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {searchResults.articles.map((article) => (
                        <Button
                          key={`citation-local-${article.id}`}
                          asChild
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <Link href={`/dashboard/knowledge-base/${article.id}`}>
                            Lokal: {article.title}
                          </Link>
                        </Button>
                      ))}
                      {searchResults.webSources.map((source) => (
                        <Button
                          key={`citation-web-${source.url}`}
                          asChild
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <a href={source.url} target="_blank" rel="noreferrer">
                            Web: {source.title}
                          </a>
                        </Button>
                      ))}
                    </div>
                    {searchResults.webSearchQueries.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {searchResults.webSearchQueries.map((query) => (
                          <Badge key={query} variant="outline">Query: {query}</Badge>
                        ))}
                      </div>
                    ) : null}
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
                                        <CardDescription className="space-y-2">
                                          <span className="block">{article.summary}</span>
                                          <span className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Approved</Badge>
                                            {article.sourceLabel ? <Badge variant="outline">Source: {article.sourceLabel}</Badge> : null}
                                          </span>
                                        </CardDescription>
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

            {searchResults.webSources.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Mga Web Source mula sa Gemini Grounding</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {searchResults.webSources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <ArrowUpRight className="h-4 w-4" />
                            {source.title}
                          </CardTitle>
                          <CardDescription className="break-all">{source.url}</CardDescription>
                        </CardHeader>
                      </Card>
                    </a>
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
                            <CardDescription className="space-y-2">
                              <span className="block">{article.summary}</span>
                              <span className="flex flex-wrap gap-2">
                                <Badge variant="secondary">Approved</Badge>
                                {article.sourceLabel ? <Badge variant="outline">{article.sourceLabel}</Badge> : null}
                              </span>
                            </CardDescription>
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
