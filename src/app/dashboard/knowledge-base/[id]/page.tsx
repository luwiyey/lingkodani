'use client';

import { useParams, useRouter } from 'next/navigation';
import { knowledgeArticles } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Volume2 } from 'lucide-react';

export default function KnowledgeArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const article = knowledgeArticles.find(a => a.id === articleId);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Artikulo sa Knowledge Base</h1>
          <p className="text-muted-foreground">Pagtingin sa isang partikular na entry ng kaalaman.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            {article.type === 'audio' ? <Volume2 className="h-6 w-6 text-primary" /> : <BookOpen className="h-6 w-6 text-primary" />}
            <CardTitle className="text-2xl">{article.title}</CardTitle>
          </div>
          <CardDescription>{article.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {article.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
          </div>
          {article.type === 'article' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
              <p>{article.content}</p>
            </div>
          ) : (
            article.audioUrl && (
              <div className="py-4">
                <audio controls className="w-full">
                  <source src={article.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <p>May-akda: {article.author} | Huling Na-update: {new Date(article.lastUpdated).toLocaleDateString()}</p>
        </CardFooter>
      </Card>

    </div>
  );
}
