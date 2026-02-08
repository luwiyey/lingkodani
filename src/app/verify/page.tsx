
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import { Leaf, ShieldCheck } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { registeredUsers } from '@/lib/data';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = searchParams.get('email');
    const user = registeredUsers.find(u => u.email === email);

    toast({
      title: "Pag-verify Nagtagumpay!",
      description: "Maligayang pagbabalik sa Lingkod-Ani.",
    });

    if (user?.role === 'developer') {
      router.push('/dashboard/developer');
    } else {
      router.push('/dashboard');
    }
  };

  const handleResendCode = () => {
    toast({
      title: "Code Ipinadala Muli",
      description: "Isang bagong verification code ang ipinadala sa iyong email.",
    });
  };

  return (
    <div className="w-full h-screen relative">
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
      <div className="relative z-10 flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">I-verify ang Iyong Pag-login</h1>
            </div>
            <CardTitle className="text-2xl">2-Step Verification</CardTitle>
            <CardDescription>
              Nagpadala kami ng 6-digit na code sa iyong email. Ilagay ito sa ibaba.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <HoverTooltip text="Ilagay ang 6-digit na verification code na ipinadala sa iyong email.">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              </HoverTooltip>
               <HoverTooltip text="I-verify ang code at magpatuloy sa dashboard.">
                <Button type="submit" className="w-full mt-2">
                  I-verify
                </Button>
              </HoverTooltip>
            </form>
             <div className="mt-4 text-center text-sm">
                <HoverTooltip text="Humingi ng bagong code kung hindi mo natanggap ang una.">
                  <button onClick={handleResendCode} className="underline text-muted-foreground">
                    Hindi natanggap ang code? Ipadala muli.
                  </button>
                </HoverTooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
