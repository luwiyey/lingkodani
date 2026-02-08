'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { registeredUsers as initialUsers } from '@/lib/data';
import { HelpDialog } from '@/components/ui/help-dialog';

type User = {
  email: string;
  name: string;
  role: 'barangay' | 'developer';
}

export default function DeveloperPage() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleAddUser = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const newUser: User = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as 'barangay' | 'developer',
        };

        if (users.some(u => u.email === newUser.email)) {
            toast({ title: "Error", description: "Ang email ay kasalukuyan nang ginagamit.", variant: "destructive" });
            return;
        }

        setUsers(prev => [newUser, ...prev]);
        setAddUserDialogOpen(false);
        toast({ title: "Tagumpay!", description: `Ang user na si ${newUser.name} ay naidagdag na.` });
    };

    const handleDeleteUser = (email: string) => {
        const userToDelete = users.find(u => u.email === email);
        if (userToDelete) {
            setUsers(prev => prev.filter(u => u.email !== email));
            toast({ title: "Tagumpay!", description: `Ang user na si ${userToDelete.name} ay natanggal na.`, variant: "destructive" });
        }
    };


  return (
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <div className="flex items-center">
            <Shield className="mr-2 h-6 w-6"/>
            <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng User (Developer)</h1>
            <HelpDialog title="Pamamahala ng User">
                <p>Ang pahinang ito ay para sa developer upang pamahalaan kung sino ang maaaring maka-access sa Lingkod-Ani system para sa isang partikular na barangay.</p>
                <p><strong>Magdagdag ng User:</strong> Gamitin ang button na ito upang mag-rehistro ng isang bagong user (hal., ang Barangay Captain, Secretary, o AEW). Sila ay magkakaroon ng access sa system pagkatapos maidagdag dito.</p>
                <p><strong>Tanggalin ang User:</strong> Ang pag-alis sa isang user ay magbabawi ng kanilang access sa system.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Magdagdag o mag-alis ng mga user na may access sa dashboard ng barangay.</p>
      </div>

       <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <CardTitle>Listahan ng mga Awtorisadong User</CardTitle>
                <CardDescription>Ito ang mga user na may access sa system.</CardDescription>
            </div>
             <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle /> Magdagdag ng User</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Magdagdag ng Bagong User</DialogTitle>
                    <DialogDescription>Punan ang mga detalye ng bagong user.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Buong Pangalan</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue="barangay" required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="barangay">Barangay Staff</SelectItem>
                                        <SelectItem value="developer">Developer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Kanselahin</Button></DialogClose>
                            <Button type="submit">I-save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
             </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Pangalan</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Mga Aksyon</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {users.map((user) => (
                    <TableRow key={user.email}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === 'developer' ? 'destructive' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm"><Trash2 /> Alisin</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sigurado ka ba?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Ang aksyon na ito ay mag-aalis ng access ni {user.name} sa system.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Kanselahin</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.email)}>Ituloy</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
