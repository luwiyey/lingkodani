import { knowledgeArticles } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot } from 'lucide-react';

const suggestedArticles = [
    { title: 'Best Practices for Corn Fertilization', summary: 'Covers timing and types of fertilizer for corn crops based on recent inquiries about nutrient deficiencies.', keywords: ['corn', 'fertilizer', 'nutrients'] },
    { title: 'Identifying Common Sugarcane Pests', summary: 'A visual guide to identifying sugarcane borers and other pests, with organic control methods.', keywords: ['sugarcane', 'pest', 'borer', 'organic'] },
]

export default function KnowledgeBasePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage farming guidance articles and AI-driven content suggestions.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <CardTitle>AI-Suggested Articles</CardTitle>
          </div>
          <CardDescription>
            Based on recent SMS trends, here are some suggested topics for new articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {suggestedArticles.map(article => (
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
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Published Articles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Author</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledgeArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {article.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(article.lastUpdated).toLocaleDateString()}</TableCell>
                  <TableCell>{article.author}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
