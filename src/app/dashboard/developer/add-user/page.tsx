
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
import Link from 'next/link';
import { userManagementSchema, type UserManagementValues } from '@/lib/schemas';
import { HoverTooltip } from '@/components/ui/hover-tooltip';

export default function AddUserPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<UserManagementValues>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'barangay',
    },
  });

  const handleAddUser = (data: UserManagementValues) => {
    // In a real app, this would save to a database and update a global state.
    // Since we are using mock data, this will just show a success message and redirect.
    // The new user will not actually appear in the list on the developer page without a backend.
    console.log('Adding new user:', data);

    toast({
      title: 'Tagumpay!',
      description: `Ang user na si ${data.name} ay naidagdag na. Ang pagbabago ay makikita kapag mayroon nang database.`,
    });

    router.push('/dashboard/developer');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <HoverTooltip text="Bumalik sa Developer Dashboard">
            <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/developer">
                <ArrowLeft />
            </Link>
            </Button>
        </HoverTooltip>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Magdagdag ng Bagong User</h1>
          <p className="text-muted-foreground">Punan ang mga detalye ng bagong user.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Form ng Pagpaparehistro ng User</CardTitle>
            <CardDescription>Punan ang mga detalye sa ibaba. Ang mga field na may * ay kinakailangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddUser)} className="max-w-2xl space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buong Pangalan</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan dela Cruz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="juan@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barangay">Barangay Staff</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button type="submit">I-save ang User</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
