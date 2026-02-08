
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Shield, Edit } from 'lucide-react';
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
import { HoverTooltip } from '@/components/ui/hover-tooltip';

type User = {
  email: string;
  name: string;
  role: 'barangay' | 'developer';
}

export default function DeveloperPage() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
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

    const handleEditUser = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingUser) return;

        const formData = new FormData(event.currentTarget);
        const updatedEmail = formData.get('email') as string;

        if (users.some(u => u.email === updatedEmail && u.email !== editingUser.email)) {
            toast({ title: "Error", description: "Ang email na iyan ay ginagamit na ng ibang user.", variant: "destructive" });
            return;
        }

        const updatedUser: User = {
            name: formData.get('name') as string,
            email: updatedEmail,
            role: formData.get('role') as 'barangay' | 'developer',
        };

        setUsers(prev => prev.map(u => (u.email === editingUser.email ? updatedUser : u)));
        setEditingUser(null);
        toast({ title: "Tagumpay!", description: `Nai-update na ang mga detalye ni ${updatedUser.name}.` });
    };

    const handleDeleteUser = (email: string) => {
        const userToDelete = users.find(u => u.email === email);
        if (userToDelete) {
            setUsers(prev => prev.filter(u => u.email !== email));
            toast({ title: "Tagumpay!", description: `Ang user na si ${userToDelete.name} ay natanggal na.`, variant: "destructive" });
        }
    };


  return (
    <>
    <div className="flex flex-col gap-6">
       <div className="space-y-1">
        <div className="flex items-center">
            <Shield className="mr-2 h-6 w-6"/>
            <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng User (Developer)</h1>
            <HelpDialog title="Pamamahala ng User">
                <p>Ang pahinang ito ay para sa developer upang pamahalaan kung sino ang maaaring maka-access sa Lingkod-Ani system para sa isang partikular na barangay.</p>
                <p><strong>Magdagdag ng User:</strong> Gamitin ang button na ito upang mag-rehistro ng isang bagong user (hal., ang Barangay Captain, Secretary, o AEW). Sila ay magkakaroon ng access sa system pagkatapos maidagdag dito.</p>
                <p><strong>I-edit:</strong> I-update ang pangalan, email, o role ng isang kasalukuyang user.</p>
                <p><strong>Alisin:</strong> Ang pag-alis sa isang user ay magbabawi ng kanilang access sa system.</p>
            </HelpDialog>
        </div>
        <p className="text-muted-foreground">Magdagdag, mag-edit, o mag-alis ng mga user na may access sa dashboard ng barangay.</p>
      </div>

       <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <CardTitle>Listahan ng mga Awtorisadong User</CardTitle>
                <CardDescription>Ito ang mga user na may access sa system.</CardDescription>
            </div>
             <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <HoverTooltip text="Magbukas ng form para magdagdag ng bagong user sa system.">
                    <Button><PlusCircle /> Magdagdag ng User</Button>
                  </HoverTooltip>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Magdagdag ng Bagong User</DialogTitle>
                    <DialogDescription>Punan ang mga detalye ng bagong user.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="add-name">Buong Pangalan</Label>
                                <Input id="add-name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add-email">Email Address</Label>
                                <Input id="add-email" name="email" type="email" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="add-role">Role</Label>
                                <Select name="role" defaultValue="barangay" required>
                                    <SelectTrigger id="add-role">
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
                       <div className="flex gap-2 justify-end">
                          <HoverTooltip text="I-edit ang mga detalye ng user na ito.">
                             <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}><Edit /> I-edit</Button>
                          </HoverTooltip>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <HoverTooltip text="Permanenteng alisin ang user na ito sa system.">
                                  <Button variant="destructive" size="sm"><Trash2 /> Alisin</Button>
                                </HoverTooltip>
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
                       </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

     {editingUser && (
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>I-edit ang User</DialogTitle>
                  <DialogDescription>I-update ang mga detalye para kay {editingUser.name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditUser}>
                  <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                          <Label htmlFor="edit-name">Buong Pangalan</Label>
                          <Input id="edit-name" name="name" defaultValue={editingUser.name} required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="edit-email">Email Address</Label>
                          <Input id="edit-email" name="email" type="email" defaultValue={editingUser.email} required />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="edit-role">Role</Label>
                          <Select name="role" defaultValue={editingUser.role} required>
                              <SelectTrigger id="edit-role">
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
                      <Button type="submit">I-save ang mga Pagbabago</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    )}
    </>
  );
}
