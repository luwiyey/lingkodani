
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BarangaySettingsPage() {
    const { toast } = useToast();
    const [brgyDescription, setBrgyDescription] = useState("Isang masiglang barangay na nakatuon sa pagpapabuti ng agrikultura at kapakanan ng mga magsasaka nito.");
    const [zoneDescriptions, setZoneDescriptions] = useState(
        Array.from({ length: 7 }, (_, i) => ({ zone: `Zone ${i + 1}`, description: `Paglalarawan para sa Zone ${i + 1}...` }))
    );
    const [replyStartTime, setReplyStartTime] = useState("08:00");
    const [replyEndTime, setReplyEndTime] = useState("19:00");
    const [adminPhone, setAdminPhone] = useState("+639123456789");

    const [templates, setTemplates] = useState([
        "Salamat sa iyong ulat. Pinoproseso na namin ito.",
        "Natanggap na namin ang iyong kahilingan at babalikan ka namin sa lalong madaling panahon.",
        "Para sa mga emergency, mangyaring tumawag sa aming hotline sa [Numero ng Hotline].",
    ]);
    const [newTemplate, setNewTemplate] = useState('');

    const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
    const [autoReplyTimeout, setAutoReplyTimeout] = useState(3);


    const handleAddTemplate = () => {
        if (newTemplate.trim()) {
            setTemplates([...templates, newTemplate.trim()]);
            setNewTemplate('');
            toast({ title: "Tagumpay!", description: "Nalagay na ang bagong template." });
        }
    };

    const handleDeleteTemplate = (index: number) => {
        setTemplates(templates.filter((_, i) => i !== index));
        toast({ title: "Tagumpay!", description: "Natanggal na ang template.", variant: 'destructive' });
    };

    const handleSaveChanges = () => {
        // In a real app, you would save these settings to a database.
        toast({
            title: "Tagumpay!",
            description: "Matagumpay na nai-save ang mga setting ng barangay.",
        });
    };
    
    const handleNotify = () => {
        // In a real app, this would trigger an SMS broadcast.
        toast({
            title: "Nagpapadala ng Abiso...",
            description: `Ipinapadala ang mga bagong oras ng serbisyo sa lahat ng magsasaka. Ang mga mensahe sa labas ng ${replyStartTime} - ${replyEndTime} ay maaaring idirekta sa ${adminPhone}.`,
        });
    }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mga Setting ng Barangay</h1>
        <p className="text-muted-foreground">Pamahalaan ang mga detalye tungkol sa iyong barangay at i-configure ang mga setting ng system.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Impormasyon ng Barangay</CardTitle>
          <CardDescription>
            I-update ang mga paglalarawan at i-configure ang mga setting ng system para sa iyong barangay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="brgy-desc">Paglalarawan ng Barangay</Label>
                <Textarea 
                    id="brgy-desc" 
                    value={brgyDescription}
                    onChange={(e) => setBrgyDescription(e.target.value)}
                    placeholder="Isulat ang pangkalahatang paglalarawan ng iyong barangay dito..."
                />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Mga Paglalarawan ng Bawat Zone</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {zoneDescriptions.map((item, index) => (
                    <div key={item.zone} className="space-y-2">
                        <Label htmlFor={`zone-desc-${index}`}>{item.zone}</Label>
                        <Input
                            id={`zone-desc-${index}`}
                            value={item.description}
                            onChange={(e) => {
                                const newDescriptions = [...zoneDescriptions];
                                newDescriptions[index].description = e.target.value;
                                setZoneDescriptions(newDescriptions);
                            }}
                        />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Separator />
            
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label>Oras ng Serbisyo ng Auto-Reply</Label>
                     <div className="flex items-center gap-2">
                        <Input 
                            id="reply-start-time" 
                            type="time" 
                            value={replyStartTime}
                            onChange={(e) => setReplyStartTime(e.target.value)}
                        />
                        <span>hanggang</span>
                         <Input 
                            id="reply-end-time" 
                            type="time" 
                            value={replyEndTime}
                            onChange={(e) => setReplyEndTime(e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Sa labas ng mga oras na ito, aabisuhan ang mga magsasaka na makipag-ugnayan sa numero ng admin.
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="admin-phone">Numero ng Admin (para sa After-Hours)</Label>
                    <Input 
                        id="admin-phone" 
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                    />
                     <p className="text-sm text-muted-foreground">
                        Ang numerong ito ay ibabahagi para sa mga katanungan pagkatapos ng oras ng opisina.
                    </p>
                </div>
            </div>

        </CardContent>
        <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={handleNotify}>I-abiso ang mga Magsasaka</Button>
            <Button onClick={handleSaveChanges}>I-save ang mga Pagbabago</Button>
        </CardFooter>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Mga Template ng Tugon</CardTitle>
              <CardDescription>Gumawa at mamahala ng mga paunang-ginawang template para sa mabilis na pagtugon sa SMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label>Mga Kasalukuyang Template</Label>
                  <div className="space-y-2">
                      {templates.map((template, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                              <p className="flex-1 text-sm">{template}</p>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(index)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                          </div>
                      ))}
                  </div>
              </div>
               <Separator />
              <div className="space-y-2">
                  <Label htmlFor="new-template">Magdagdag ng Bagong Template</Label>
                  <Textarea id="new-template" value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} placeholder="Isulat ang iyong bagong template dito..." />
              </div>
          </CardContent>
          <CardFooter>
              <Button onClick={handleAddTemplate}>I-save ang Template</Button>
          </CardFooter>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Pagtugon sa Emergency</CardTitle>
              <CardDescription>Awtomatikong magpadala ng paunang tugon para sa mga mensaheng may mataas na prayoridad kung walang aksyon mula sa admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                  <Switch id="auto-reply-switch" checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                  <Label htmlFor="auto-reply-switch">Paganahin ang awtomatikong pagtugon para sa mga urgent na mensahe</Label>
              </div>
              {autoReplyEnabled && (
                <>
                  <div className="space-y-2 pt-4">
                      <Label htmlFor="auto-reply-timeout">Timeout para sa Admin (minuto)</Label>
                      <Input id="auto-reply-timeout" type="number" value={autoReplyTimeout} onChange={(e) => setAutoReplyTimeout(Number(e.target.value))} />
                      <p className="text-sm text-muted-foreground">
                          Kung walang aksyon mula sa admin sa loob ng panahong ito, isang paunang abiso ang ipapadala.
                      </p>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="auto-reply-template">Template para sa Auto-Reply</Label>
                      <Select defaultValue={templates[2]}>
                          <SelectTrigger id="auto-reply-template">
                              <SelectValue placeholder="Pumili ng template na ipapadala..." />
                          </SelectTrigger>
                          <SelectContent>
                              {templates.map((template, index) => (
                                  <SelectItem key={index} value={template}>
                                      {template}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                          Ito ang mensaheng awtomatikong ipapadala. Maaari kang magdagdag ng mga template sa itaas.
                      </p>
                  </div>
                </>
              )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges}>I-save ang mga Setting ng Emergency</Button>
          </CardFooter>
      </Card>

    </div>
  );
}
