"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { getLegalBackLink } from "@/lib/legal-links";

export function LegalBackLink() {
  const searchParams = useSearchParams();
  const { href, label } = getLegalBackLink(searchParams.get("from"));

  return (
    <Link href={href} className="mt-8 inline-block text-primary hover:underline">
      {label}
    </Link>
  );
}
