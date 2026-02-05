import { knowledgeArticles } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot } from 'lucide-react';

const suggestedArticles = [
    { title: 'Pinakamahusay na Kasanayan para sa Pagpapataba ng Mais', summary: 'Sinasaklaw ang tiyempo at mga uri ng pataba para sa mga pananim na mais batay sa mga kamakailang katanungan tungkol sa mga kakulangan sa sustansya.', keywords: ['mais', 'pataba', 'sustansya'] },
    { title: 'Pagkilala sa mga Karaniwang Peste ng Tubo', summary: 'Isang biswal na gabay sa pagkilala sa mga sugarcane borer at iba pang peste, na may mga organikong paraan ng pagkontrol.', keywords: ['tubo', 'peste', 'borer', 'organiko'] },
]

export default function KnowledgeBasePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Base ng Kaalaman</h1>
          <p className="text-muted-foreground">Pamahalaan ang mga artikulo ng gabay sa pagsasaka at mga mungkahi ng nilalaman na mula sa AI.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Bagong Artikulo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <CardTitle>Mga Mungkahing Artikulo ng AI</CardTitle>
          </div>
          <CardDescription>
            Batay sa mga kamakailang uso sa SMS, narito ang ilang mga iminungkahing paksa para sa mga bagong artikulo.
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
            <CardTitle>Mga Inilathalang Artikulo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pamagat</TableHead>
                <TableHead>Mga Keyword</TableHead>
                <TableHead>Huling Na-update</TableHead>
                <TableHead>May-akda</TableHead>
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
