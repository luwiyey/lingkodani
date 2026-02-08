
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
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
import { HoverTooltip } from '@/components/ui/hover-tooltip';

export default function ResetPasswordPage() {
  const router = useRouter();

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send a reset link/code to the user's email
    router.push('/reset-password/verify');
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
            <KeyRound className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">I-reset ang Password</h1>
        </div>
        <CardTitle className="text-2xl">Nakalimutan ang Password?</CardTitle>
        <CardDescription>
            Walang problema. Ilagay ang iyong email address at padadalhan ka namin ng verification code.
        </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleRequestReset} className="space-y-4">
            <HoverTooltip text="Ilagay ang email address na nauugnay sa iyong account.">
                <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="angiyongemail@example.com"
                    defaultValue="brgy-admin@lingkodani.gov.ph"
                    required
                />
                </div>
            </HoverTooltip>
             <HoverTooltip text="Ipadala ang request para sa verification code.">
                <Button type="submit" className="w-full mt-2">
                    Humingi ng Verification Code
                </Button>
            </HoverTooltip>
        </form>
        <div className="mt-4 text-center text-sm">
            <HoverTooltip text="Bumalik sa pahina ng pag-login.">
                <Link href="/" className="underline text-muted-foreground">
                    Bumalik sa Pag-login
                </Link>
            </HoverTooltip>
        </div>
        </CardContent>
    </Card>
  );
}
