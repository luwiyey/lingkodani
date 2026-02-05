"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";

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

export default function LoginPage() {
  const router = useRouter();
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');

  const handleLogin = () => {
    // In a real app, you'd perform authentication here
    router.push("/dashboard");
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
      <div className="relative z-10 flex items-center justify-center h-full">
        <Card className="w-full max-w-md mx-4 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <Leaf className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">Lingkod-Ani</h1>
            </div>
            <CardTitle className="text-2xl">Administrator Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  defaultValue="admin@lingkodani.gov.ph"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" defaultValue="password" required />
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full mt-6">
              Sign In
            </Button>
            <div className="mt-4 text-center text-sm">
              <a href="#" className="underline text-muted-foreground">
                Forgot your password?
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
