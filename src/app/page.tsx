
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { registeredUsers } from "@/lib/data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function LoginPage() {
  const router = useRouter();
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');
  const [showNotRegisteredDialog, setShowNotRegisteredDialog] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const email = emailInput.value;

    const isRegistered = registeredUsers.some(user => user.email === email);

    if (isRegistered) {
      router.push("/verify");
    } else {
      setShowNotRegisteredDialog(true);
    }
  };

  return (
    <div className="w-full h-screen relative flex flex-col">
      <div className="absolute inset-0">
        {loginBg && (
           <Image
              src={loginBg.imageUrl}
              alt={loginBg.description}
              fill
              className="object-cover"
              data-ai-hint={loginBg.imageHint}
           />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-primary/40" />
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center h-full p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Leaf className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="text-2xl">Pag-login ng Administrator</CardTitle>
            <CardDescription>
              Ilagay ang iyong mga kredensyal upang ma-access ang dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <HoverTooltip text="Ilagay ang email address na nakarehistro sa iyong account.">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    defaultValue="brgy-admin@lingkodani.gov.ph"
                    required
                  />
                </div>
              </HoverTooltip>
              <HoverTooltip text="Ilagay ang iyong password.">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" defaultValue="password" required />
                </div>
              </HoverTooltip>
               <HoverTooltip text="I-click upang mag-sign in sa iyong account.">
                <Button type="submit" className="w-full mt-2">
                  Mag-sign In
                </Button>
              </HoverTooltip>
            </form>
            <div className="mt-4 text-center text-sm">
                <HoverTooltip text="Simulan ang proseso ng pag-reset ng iyong password.">
                  <Link href="/reset-password" className="underline text-muted-foreground">
                    Nakalimutan ang iyong password?
                  </Link>
                </HoverTooltip>
            </div>
          </CardContent>
        </Card>
      </div>
       <footer className="relative z-10 p-4 text-center text-xs text-white">
          <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link> | <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        </footer>

        <AlertDialog open={showNotRegisteredDialog} onOpenChange={setShowNotRegisteredDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hindi Nakarehistro</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ang email address na iyong inilagay ay hindi nakarehistro sa aming sistema. Mangyaring makipag-ugnayan sa developer upang ma-access ang Lingkod-Ani.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowNotRegisteredDialog(false)}>Naiintindihan</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
