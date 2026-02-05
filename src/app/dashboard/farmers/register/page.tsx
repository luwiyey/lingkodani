
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegisterFarmerPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleRegisterFarmer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const farmerName = formData.get('name') as string;
    
    // In a real app, you would save this to your database.
    // Here, we'll just show a success message.
    console.log('Registering new farmer:', Object.fromEntries(formData.entries()));

    toast({
      title: 'Nakabinbin para sa Pag-apruba',
      description: `Ang bagong magsasaka, ${farmerName}, ay naidagdag na at naghihintay ng pag-apruba.`,
    });

    // Redirect to the approvals page
    router.push('/dashboard/farmers/approvals');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Magrehistro ng Bagong Magsasaka</h1>
          <p className="text-muted-foreground">Manu-manong magdagdag ng bagong magsasaka sa sistema. Sila ay lilitaw sa pahina ng pag-apruba.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Form ng Pagpaparehistro</CardTitle>
            <CardDescription>Punan ang mga detalye sa ibaba.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterFarmer} className="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Buong Pangalan</Label>
                    <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Numero ng Telepono</Label>
                    <Input id="phone" name="phone" required placeholder="+63..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay</Label>
                    <Input id="barangay" name="barangay" defaultValue="Batakil" required readOnly />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sitio">Sitio/Purok</Label>
                    <Select name="sitio" required>
                      <SelectTrigger id="sitio">
                        <SelectValue placeholder="Pumili ng Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 7 }, (_, i) => i + 1).map(zone => (
                          <SelectItem key={zone} value={`Zone ${zone}`}>
                            Zone {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="crops">Mga Pangunahing Pananim</Label>
                    <Input id="crops" name="crops" placeholder="hal. Palay, Mais" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="farm-size">Sukat ng Bukid (ha)</Label>
                    <Input id="farm-size" name="farm-size" type="number" step="0.1" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="age">Edad</Label>
                    <Input id="age" name="age" type="number"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="gender">Kasarian</Label>
                    <Input id="gender" name="gender"/>
                </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit">Isumite para sa Pag-apruba</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
