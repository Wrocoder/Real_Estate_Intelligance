import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckListingExperience from "@/components/CheckListingExperience";
import { SEARCH_QUERY_KEYS } from "@/lib/searchRouting";

export const metadata: Metadata = {
  title: "Sprawdź mieszkanie przed zakupem | WartoMetr",
  description: "Wklej ogłoszenie. Sprawdzimy dostępne dane rynkowe, ryzyka i pokażemy, ile rozsądnie zapłacić.",
  alternates: { canonical: "/" },
};

export default async function HomePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (!params.draft && Object.keys(params).some((key) => SEARCH_QUERY_KEYS.has(key))) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value !== undefined) query.set(key, value);
    }
    redirect(`/search?${query}`);
  }
  return <CheckListingExperience />;
}
