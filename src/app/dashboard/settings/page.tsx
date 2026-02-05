'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

export default function BarangaySettingsPage() {
    const { toast } = useToast();
    const [brgyDescription, setBrgyDescription] = useState("Isang masiglang barangay na nakatuon sa pagpapabuti ng agrikultura at kapakanan ng mga magsasaka nito.");
    const [zoneDescriptions, setZoneDescriptions] = useState(
        Array.from({ length: 7 }, (_, i) => ({ zone: `Zone ${i + 1}`, description: `Paglalarawan para sa Zone ${i + 1}...` }))
    );
    const [replyStartTime, setReplyStartTime] = useState("08:00");
    const [replyEndTime, setReplyEndTime] = useState("19:00");
    const [adminPhone, setAdminPhone] = useState("+639123456789");


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
            
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
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
    </div>
  );
}
