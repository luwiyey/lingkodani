
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { KnowledgeArticle } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Volume2, FileText, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { useData } from '@/context/data-context';
import { AiStatusBanner } from '@/components/shared/ai-status-banner';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';
import { uploadKnowledgeAudioFile } from '@/lib/services/knowledge-file-service';
import { transcribeAudioUpload } from '@/lib/services/audio-transcription-service';
import { isKnowledgeArticleApproved } from '@/lib/knowledge-search';


export default function AllKnowledgeArticlesPage() {
  const { knowledgeArticles, addKnowledgeArticle } = useData();
  const { capabilities } = useRuntimeCapabilities();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isNewEntryDialogOpen, setNewEntryDialogOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'article' | 'audio'>('article');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const audioUploadLocked = !capabilities.storageUploadConfigured;
  const audioUploadLockMessage =
    capabilities.reasons.storageUpload ??
    'Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase storage setup.';
  const approvedKnowledgeArticles = knowledgeArticles.filter(isKnowledgeArticleApproved);
  const pendingKnowledgeArticles = knowledgeArticles.filter(
    (article) => article.reviewStatus === 'needs_review'
  );

  const handleAddNewEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawTitle = (formData.get('title') as string | null)?.trim() ?? '';
    const summary = (formData.get('summary') as string | null)?.trim() ?? '';
    const keywords = (formData.get('keywords') as string).split(',').map(kw => kw.trim()).filter(Boolean);
    const type = formData.get('type') as KnowledgeArticle['type'];
    const content = type === 'article' ? formData.get('content') as string : '';
    const audioFile = formData.get('audioFile');

    const requiresManualMetadata = type !== 'audio';

    if ((!rawTitle && type === 'article') || (requiresManualMetadata && (!summary || !keywords.length))) {
        toast({title: "Kulang ang Impormasyon", description: "Punan ang lahat ng kinakailangang field.", variant: "destructive"});
        return;
    }

    if (type === 'audio' && audioUploadLocked) {
      toast({ title: "Audio upload locked", description: audioUploadLockMessage, variant: "destructive" });
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

  const filteredArticles = approvedKnowledgeArticles.filter(article => {
    if (!localSearchQuery) return true;
    const query = localSearchQuery.toLowerCase();
    return (
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.keywords.some(kw => kw.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
            <HoverTooltip text="Bumalik sa pangunahing pahina ng Knowledge Base.">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft />
              </Button>
            </HoverTooltip>
            <div className="space-y-1">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold tracking-tight">Lahat ng Artikulo sa Knowledge Base</h1>
                  <HelpDialog title="Lahat ng Artikulo" tooltipText="Hanapin, idagdag, at pamahalaan ang lahat ng entry.">
                    <p>Ito ang iyong kumpletong aklatan ng lahat ng kaalaman sa pagsasaka. Dito mo maaaring tingnan, hanapin, at pamahalaan ang bawat artikulo at audio story na nasa iyong sistema.</p>
                    <p>Gamitin ang search bar upang mabilis na mahanap ang isang partikular na paksa. Ang pag-click sa anumang card ng artikulo ay magdadala sa iyo sa pahina ng pagbabasa para sa entry na iyon.</p>
                    <p>Pindutin ang "Bagong Entry" na button upang magdagdag ng bagong kaalaman sa iyong koleksyon. Maaari kang magdagdag ng mga nakasulat na artikulo o mag-upload ng mga audio recording.</p>
                  </HelpDialog>
                </div>
                <p className="text-muted-foreground">Maghanap, magdagdag, at pamahalaan ang lahat ng entry.</p>
            </div>
        </div>

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

        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <HoverTooltip text="Mag-type dito para mahanap ang isang artikulo ayon sa pamagat, buod, o keyword.">
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
            <Dialog open={isNewEntryDialogOpen} onOpenChange={setNewEntryDialogOpen}>
                <DialogTrigger asChild>
                    <HoverTooltip text="Magdagdag ng bagong artikulo o audio story sa knowledge base.">
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
                            <div className="space-y-2">
                                <Label htmlFor="type">Uri ng Content</Label>
                                <Select name="type" defaultValue={newEntryType} onValueChange={(value: 'article' | 'audio') => setNewEntryType(value)}>
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="article">Artikulo</SelectItem>
                                        <SelectItem value="audio" disabled={audioUploadLocked}>Boses ng Magsasaka (Audio)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Pamagat</Label>
                                <Input id="title" name="title" required={newEntryType === 'article'} placeholder={newEntryType === 'audio' ? 'Opsyonal para sa audio. Kapag iniwang blangko, gagawa ang system ng pamagat mula sa transcript o file name.' : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="summary">Maikling Buod</Label>
                                <Textarea id="summary" name="summary" required={newEntryType === 'article'} placeholder={newEntryType === 'audio' ? 'Opsyonal para sa audio. Kapag iniwang blangko, gagawa ang system ng buod mula sa transcript.' : ''} />
                            </div>
                            {newEntryType === 'article' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="content">Nilalaman</Label>
                                    <Textarea id="content" name="content" rows={8} required/>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="audio-file">Mag-upload ng Audio File</Label>
                                    <Input id="audio-file" name="audioFile" type="file" accept="audio/*" className="h-auto p-0 file:p-2 file:mr-4 file:border-0 file:bg-muted file:rounded-sm cursor-pointer file:cursor-pointer" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="keywords">Mga Keyword (paghiwalayin ng kuwit)</Label>
                                <Input id="keywords" name="keywords" placeholder={newEntryType === 'audio' ? 'Opsyonal para sa audio. Hal. peste, palay, baha' : 'hal. pataba, mais, peste'} required={newEntryType === 'article'} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Kanselahin</Button></DialogClose>
                            <Button type="submit" disabled={isSavingEntry || (newEntryType === 'audio' && audioUploadLocked)}>
                              {isSavingEntry ? 'Nagse-save...' : 'I-save ang Entry'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
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
             {filteredArticles.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    <p>Walang nahanap na artikulo para sa "{localSearchQuery}".</p>
                </div>
            )}
        </div>
    </div>
  );
}
