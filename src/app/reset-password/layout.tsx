
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');

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
          {children}
      </div>
    </div>
  );
}
