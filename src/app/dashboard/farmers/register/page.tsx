
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { farmerRegistrationSchema, type FarmerRegistrationValues } from '@/lib/schemas';
import { useData } from '@/context/data-context';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Checkbox } from '@/components/ui/checkbox';

export default function RegisterFarmerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addPendingFarmer } = useData();

  const form = useForm<FarmerRegistrationValues>({
    resolver: zodResolver(farmerRegistrationSchema),
    defaultValues: {
      name: '',
      phone: '',
      barangay: 'Batakil',
      sitio: '',
      crops: '',
      gender: '',
      sharedPhone: false,
      householdLabel: '',
      sharedPhoneNotes: '',
    },
  });
  const sharedPhone = form.watch('sharedPhone');

  const handleRegisterFarmer = async (data: FarmerRegistrationValues) => {
    const result = await addPendingFarmer(data);

    if (!result.ok) {
      toast({
        title: result.reason === 'duplicate' ? 'May kaparehong registration' : 'Hindi na-save ang registration',
        description:
          result.reason === 'duplicate'
            ? 'May kaparehong numero na sa roster. Gamitin ang shared household option kung iisang numero talaga ito.'
            : 'Nagkaroon ng problema sa pag-save ng farmer registration. Subukang muli.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Nakabinbin para sa Pag-apruba',
      description: `Ang bagong magsasaka, ${data.name}, ay naidagdag na at naghihintay ng pag-apruba.`,
    });

    // Redirect to the approvals page
    router.push('/dashboard/farmers/approvals');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <HoverTooltip text="Bumalik sa pahina ng mga magsasaka">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
        </HoverTooltip>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Magrehistro ng Bagong Magsasaka</h1>
          <p className="text-muted-foreground">Manu-manong magdagdag ng bagong magsasaka sa sistema. Sila ay lilitaw sa pahina ng pag-apruba.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Form ng Pagpaparehistro</CardTitle>
            <CardDescription>Punan ang mga detalye sa ibaba. Ang mga field na may * ay kinakailangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => void handleRegisterFarmer(data))} className="max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buong Pangalan *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero ng Telepono *</FormLabel>
                        <FormControl>
                          <Input placeholder="+63..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sharedPhone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 rounded-xl border bg-muted/20 p-4">
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-base">Shared household number</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              I-enable ito kung may higit sa isang magsasaka sa iisang numero ng telepono.
                            </p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barangay</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {sharedPhone ? (
                    <>
                      <FormField
                        control={form.control}
                        name="householdLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Household Label</FormLabel>
                            <FormControl>
                              <Input placeholder="hal. Sambahayan nina Dela Cruz" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Makakatulong ito para ma-link ang magkakahiwalay na farmer profiles sa iisang household.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sharedPhoneNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Household Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="hal. Mag-ama ang gumagamit ng numerong ito" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : null}
                  <FormField
                    control={form.control}
                    name="sitio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio/Purok *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pumili ng Zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 7 }, (_, i) => i + 1).map(zone => (
                              <SelectItem key={zone} value={`Zone ${zone}`}>
                                Zone {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="crops"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mga Pangunahing Pananim</FormLabel>
                        <FormControl>
                          <Input placeholder="hal. Palay, Mais" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="farmSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sukat ng Bukid (ha)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edad</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ''} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kasarian</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pumili ng kasarian" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Babae">Babae</SelectItem>
                                <SelectItem value="Lalaki">Lalaki</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <div className="flex justify-end mt-6">
                <Button type="submit">Isumite para sa Pag-apruba</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
