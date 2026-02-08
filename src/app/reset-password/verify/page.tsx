
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ShieldCheck } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { HoverTooltip } from '@/components/ui/hover-tooltip';

export default function ResetPasswordVerifyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would verify the code and update the password
    toast({
      title: "Tagumpay!",
      description: "Matagumpay na na-reset ang iyong password. Maaari ka nang mag-login gamit ang iyong bagong password.",
    });
    router.push('/');
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">I-verify at I-reset</h1>
        </div>
        <CardTitle className="text-2xl">I-reset ang Iyong Password</CardTitle>
        <CardDescription>
            Ilagay ang verification code at ang iyong bagong password.
        </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
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
            <HoverTooltip text="Ilagay ang iyong bagong password.">
                <div className="space-y-2">
                    <Label htmlFor="new-password">Bagong Password</Label>
                    <Input id="new-password" type="password" required />
                </div>
            </HoverTooltip>
            <HoverTooltip text="Kumpirmahin ang iyong bagong password.">
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Kumpirmahin ang Bagong Password</Label>
                    <Input id="confirm-password" type="password" required />
                </div>
            </HoverTooltip>
             <HoverTooltip text="I-save ang iyong bagong password at bumalik sa login.">
                <Button type="submit" className="w-full mt-2">
                    I-reset ang Password
                </Button>
            </HoverTooltip>
        </form>
         <div className="mt-4 text-center text-sm">
            <HoverTooltip text="Bumalik sa pahina ng pag-login nang hindi nagre-reset.">
                <Link href="/" className="underline text-muted-foreground">
                    Bumalik sa Pag-login
                </Link>
            </HoverTooltip>
        </div>
        </CardContent>
    </Card>
  );
}
