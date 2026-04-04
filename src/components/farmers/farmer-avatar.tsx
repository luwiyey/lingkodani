import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/avatar-placeholder";
import { cn } from "@/lib/utils";

type FarmerAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function FarmerAvatar({
  name,
  avatarUrl,
  className,
  fallbackClassName,
}: FarmerAvatarProps) {
  const displayName = name?.trim() || "Lingkod-Ani";

  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-emerald-50 to-green-100 font-semibold text-emerald-700",
          fallbackClassName
        )}
      >
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
