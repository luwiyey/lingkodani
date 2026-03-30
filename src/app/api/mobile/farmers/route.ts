import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import type { Farmer } from "@/lib/types";

function matchesQuery(farmer: Farmer, query: string) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  const haystack = [
    farmer.name,
    farmer.phone,
    farmer.barangay,
    farmer.sitio,
    ...(farmer.crops ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function byRecentActivity(left: Farmer, right: Farmer) {
  return new Date(right.lastSmsActivity ?? right.registrationDate).getTime() -
    new Date(left.lastSmsActivity ?? left.registrationDate).getTime();
}

export async function GET(request: Request) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const snapshot = await getServerFirestore()
    .collection(firebaseCollections.farmers)
    .limit(300)
    .get();

  const farmers = snapshot.docs
    .map((documentSnapshot) => {
      const farmer = documentSnapshot.data() as Farmer;
      return {
        ...farmer,
        id: farmer.id ?? documentSnapshot.id,
      };
    })
    .filter((farmer) => matchesQuery(farmer, query))
    .sort(byRecentActivity)
    .slice(0, 60);

  return NextResponse.json({ farmers });
}
