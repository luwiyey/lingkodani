
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle, FilePen, RefreshCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { canAccessDataCenter, canManageBarangaySettings } from '@/lib/access-control';
import { isLiveMode } from '@/lib/config/app-mode';
import type { SystemTemplate, SystemTemplateCategory } from '@/lib/types';
import { defaultSystemSettings } from '@/lib/system-settings';

export default function BarangaySettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { systemSettings, saveSystemSettings } = useData();
    const { currentUser, currentUserProfile } = useAuth();
    const [brgyDescription, setBrgyDescription] = useState(defaultSystemSettings.brgyDescription);
    const [zoneDescriptions, setZoneDescriptions] = useState(defaultSystemSettings.zoneDescriptions);
    const [replyStartTime, setReplyStartTime] = useState(defaultSystemSettings.replyStartTime);
    const [replyEndTime, setReplyEndTime] = useState(defaultSystemSettings.replyEndTime);
    const [adminPhone, setAdminPhone] = useState(defaultSystemSettings.adminPhone);
    
    const [templateCategories, setTemplateCategories] = useState<SystemTemplateCategory[]>(defaultSystemSettings.templateCategories);
    
    // State for Dialogs
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<{ categoryId: string; template: SystemTemplate } | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<{ categoryId: string; templateId: string } | null>(null);

    // State for controlled components in dialogs
    const [newTemplateText, setNewTemplateText] = useState('');
    const [newTemplateKeywords, setNewTemplateKeywords] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('');
    
    const [editedTemplateText, setEditedTemplateText] = useState('');
    const [editedTemplateKeywords, setEditedTemplateKeywords] = useState('');


    const [autoReplyEnabled, setAutoReplyEnabled] = useState(defaultSystemSettings.autoReplyEnabled);
    const [autoReplyTimeout, setAutoReplyTimeout] = useState(defaultSystemSettings.autoReplyTimeoutMinutes);
    const [runningAutomation, setRunningAutomation] = useState<null | 'overdue' | 'followup'>(null);
    const canManageSettings = canManageBarangaySettings(currentUserProfile);
    const canOpenDataCenter = canAccessDataCenter(currentUserProfile);

    useEffect(() => {
        if (currentUserProfile && !canManageSettings) {
            router.replace('/dashboard');
        }
    }, [canManageSettings, currentUserProfile, router]);
    
    useEffect(() => {
        setBrgyDescription(systemSettings.brgyDescription);
        setZoneDescriptions(systemSettings.zoneDescriptions);
        setReplyStartTime(systemSettings.replyStartTime);
        setReplyEndTime(systemSettings.replyEndTime);
        setAdminPhone(systemSettings.adminPhone);
        setTemplateCategories(systemSettings.templateCategories);
        setAutoReplyEnabled(systemSettings.autoReplyEnabled);
        setAutoReplyTimeout(systemSettings.autoReplyTimeoutMinutes);
    }, [systemSettings]);

    const handleOpenEditDialog = (categoryId: string, template: SystemTemplate) => {
        setEditingTemplate({ categoryId, template });
        setEditedTemplateText(template.text);
        setEditedTemplateKeywords(template.keywords.join(', '));
    };

    const handleUpdateTemplate = () => {
        if (!editingTemplate) return;

        const { categoryId, template } = editingTemplate;
        
        setTemplateCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId
                    ? {
                        ...cat,
                        templates: cat.templates.map(t =>
                            t.id === template.id
                                ? {
                                    ...t,
                                    text: editedTemplateText,
                                    keywords: editedTemplateKeywords.split(',').map(kw => kw.trim()).filter(Boolean),
                                  }
                                : t
                        ),
                      }
                    : cat
            )
        );

        toast({ title: "Tagumpay!", description: "Nai-update na ang template." });
        setEditingTemplate(null);
    };


    const handleAddTemplate = () => {
        if (!newTemplateText.trim() || !newTemplateCategory) {
            toast({ title: "Kulang ang Impormasyon", description: "Mangyaring punan ang text ng template at pumili ng kategorya.", variant: 'destructive' });
            return;
        }

        const newTemplate: SystemTemplate = {
            id: `t${Date.now()}`,
            text: newTemplateText.trim(),
            keywords: newTemplateKeywords.split(',').map(kw => kw.trim()).filter(Boolean),
        };

        setTemplateCategories(prev =>
            prev.map(cat =>
                cat.id === newTemplateCategory
                    ? { ...cat, templates: [...cat.templates, newTemplate] }
                    : cat
            )
        );
        
        setAddDialogOpen(false);
        setNewTemplateText('');
        setNewTemplateKeywords('');
        setNewTemplateCategory('');
        toast({ title: "Tagumpay!", description: "Nalagay na ang bagong template." });
    };

    const handleDeleteTemplate = () => {
        if (!deletingTemplate) return;
        const { categoryId, templateId } = deletingTemplate;

        setTemplateCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId
                    ? { ...cat, templates: cat.templates.filter(t => t.id !== templateId) }
                    : cat
            )
        );
        toast({ title: "Tagumpay!", description: "Natanggal na ang template.", variant: 'destructive' });
        setDeletingTemplate(null);
    };

    const handleSaveChanges = async () => {
        await saveSystemSettings({
            ...systemSettings,
            brgyDescription,
            zoneDescriptions,
            replyStartTime,
            replyEndTime,
            adminPhone,
            templateCategories,
            autoReplyEnabled,
            autoReplyTimeoutMinutes: Math.max(1, autoReplyTimeout),
        });
        toast({
            title: "Tagumpay!",
            description: "Nai-save na ang live runtime settings ng barangay.",
        });
    };
    
    const handleNotify = async () => {
        const advisoryNotice = `Advisory Notice: Ang oras ng serbisyo ng barangay agriculture team ay ${replyStartTime} hanggang ${replyEndTime}. Para sa after-hours concerns, makipag-ugnayan sa ${adminPhone}.`;

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(advisoryNotice);
        }
        toast({
            title: "Handa na ang Advisory Notice",
            description: `Nakopya ang after-hours advisory notice para sa oras na ${replyStartTime} - ${replyEndTime}.`,
        });
    }

    const runAutomation = async (target: 'overdue' | 'followup') => {
        if (!currentUser) {
            toast({
                title: "Walang live session",
                description: "Mag-sign in muna sa live account bago magpatakbo ng automation.",
                variant: "destructive",
            });
            return;
        }

        setRunningAutomation(target);

        try {
            const token = await currentUser.getIdToken();
            const path = target === 'overdue'
                ? '/api/system/process-overdue-sms'
                : '/api/system/process-follow-ups';
            const response = await fetch(path, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(typeof payload.error === 'string' ? payload.error : 'Hindi natapos ang automation run.');
            }

            toast({
                title: target === 'overdue' ? 'Natapos ang overdue SMS check' : 'Natapos ang follow-up check',
                description: payload.skipped
                    ? 'May kasalukuyang automation run na isinasagawa sa ibang session.'
                    : `${payload.processedCount ?? 0} item ang naproseso sa batch na ito.`,
            });
        } catch (error) {
            toast({
                title: "Hindi natapos ang automation run",
                description: error instanceof Error ? error.message : "Subukan muli pagkatapos ng ilang sandali.",
                variant: "destructive",
            });
        } finally {
            setRunningAutomation(null);
        }
    };

    if (currentUserProfile && !canManageSettings) {
        return (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Card className="max-w-lg border-amber-300/40 bg-amber-50/60">
              <CardHeader>
                <CardTitle>Limitado ang Access sa Settings</CardTitle>
                <CardDescription>
                  Ang page na ito ay para lamang sa barangay managers at developers. Ibinabalik ka na sa dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        );
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
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                        <Input 
                            id="reply-start-time" 
                            type="time" 
                            value={replyStartTime}
                            onChange={(e) => setReplyStartTime(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">hanggang</span>
                         <Input 
                            id="reply-end-time" 
                            type="time" 
                            value={replyEndTime}
                            onChange={(e) => setReplyEndTime(e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Ito ang live service hours na ginagamit sa advisory notice at after-hours automation copy.
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
                        Ang numerong ito ay ilalagay sa after-hours advisory notice.
                     </p>
                </div>
            </div>

        </CardContent>
        <CardFooter className="justify-end gap-2">
            {canOpenDataCenter ? (
              <Button variant="outline" asChild>
                  <Link href="/dashboard/data-center">Buksan ang Data Center</Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={handleNotify}>Kopyahin ang Advisory Notice</Button>
            <Button onClick={handleSaveChanges}>I-save ang Live Settings</Button>
        </CardFooter>
      </Card>

      {isLiveMode ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Automation sa Free Hosting</CardTitle>
            <CardDescription>
              Gumagana pa rin ang overdue SMS at follow-up automation sa Vercel Hobby kahit walang paid cron jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Habang may naka-open na live dashboard, awtomatikong tatakbo ang overdue SMS checks kada 1 minuto at ang follow-up checks kada 30 minuto.
            </p>
            <p>
              Kapag walang staff na naka-open sa dashboard, hindi tuloy-tuloy ang background run. Maaari mong gamitin ang mga button sa ibaba para mano-manong patakbuhin ang checks anumang oras.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => runAutomation('overdue')}
              disabled={runningAutomation !== null}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {runningAutomation === 'overdue' ? 'Pinoproseso ang overdue SMS...' : 'Patakbuhin ang Overdue SMS Check'}
            </Button>
            <Button
              onClick={() => runAutomation('followup')}
              disabled={runningAutomation !== null}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {runningAutomation === 'followup' ? 'Pinoproseso ang follow-up...' : 'Patakbuhin ang Follow-up Check'}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
      
        <Card>
          <CardHeader>
                <CardTitle>Mga Template ng Tugon</CardTitle>
                <CardDescription>Pindutin ang isang kategorya para tingnan, i-edit, o tanggalin ang mga template.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templateCategories.map((category) => (
                        <Dialog key={category.id}>
                            <DialogTrigger asChild>
                                <button className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                                    <h3 className="font-semibold">{category.label}</h3>
                                    <p className="text-sm text-muted-foreground">{category.templates.length} templates</p>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Mga Template: {category.label}</DialogTitle>
                                    <DialogDescription>Pamahalaan ang mga template para sa kategoryang ito.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-72 my-4">
                                    <div className="space-y-3 pr-4">
                                        {category.templates.map((template) => (
                                            <div key={template.id} className="flex items-start gap-2 p-3 border rounded-md">
                                                <div className="flex-1">
                                                    <p className="text-sm">{template.text}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {template.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" onClick={() => handleOpenEditDialog(category.id, template)}>
                                                        <FilePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeletingTemplate({ categoryId: category.id, templateId: template.id })}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {category.templates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Walang template sa kategoryang ito.</p>}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => setAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Magdagdag ng Template</Button>
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
                          Ito ang live timeout na ginagamit ng inbound analysis at overdue SMS automation.
                      </p>
                  </div>
                  <div className="space-y-2">
                      <Label>Template source para sa Auto-Reply</Label>
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">
                          Ginagamit ng system ang unang template sa kategoryang <strong>Emergency</strong> para sa urgent cases,
                          <strong> Pagsisiyasat</strong> para sa clarification cases, at <strong>Pagkumpirma</strong> o
                          <strong> Resolusyon</strong> para sa mga regular na fallback reply.
                      </div>
                      <p className="text-sm text-muted-foreground">
                          Kapag in-edit at sinave ang mga template sa itaas, iyon din ang gagamitin ng automation sa live mode.
                      </p>
                  </div>
                </>
              )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges}>I-save ang mga Setting ng Emergency</Button>
          </CardFooter>
      </Card>
      
      {/* Add Template Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Magdagdag ng Bagong Template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-template-text">Text ng Template</Label>
                        <Textarea id="new-template-text" value={newTemplateText} onChange={(e) => setNewTemplateText(e.target.value)} placeholder="Isulat ang iyong bagong template dito..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-template-keywords">Mga Keyword (paghiwalayin ng kuwit)</Label>
                        <Input id="new-template-keywords" value={newTemplateKeywords} onChange={(e) => setNewTemplateKeywords(e.target.value)} placeholder="hal. voucher, binhi, kunin" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-template-category">Kategorya</Label>
                        <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                            <SelectTrigger id="new-template-category">
                                <SelectValue placeholder="Pumili ng kategorya..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templateCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Kanselahin</Button></DialogClose>
                    <Button onClick={handleAddTemplate}>I-save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>I-edit ang Template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-template-text">Text ng Template</Label>
                        <Textarea id="edit-template-text" value={editedTemplateText} onChange={(e) => setEditedTemplateText(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-template-keywords">Mga Keyword (paghiwalayin ng kuwit)</Label>
                        <Input id="edit-template-keywords" value={editedTemplateKeywords} onChange={(e) => setEditedTemplateKeywords(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Kanselahin</Button></DialogClose>
                    <Button onClick={handleUpdateTemplate}>I-save ang mga Pagbabago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sigurado ka ba?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ang aksyon na ito ay hindi na maaaring bawiin. Permanenteng tatanggalin nito ang template na ito.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingTemplate(null)}>Kanselahin</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTemplate}>Ituloy</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
