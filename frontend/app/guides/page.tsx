import type { Metadata } from "next";
import { cookies } from "next/headers";

import { GuidesIndexContent } from "@/components/GuidesIndexContent";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";
import { siteUrl } from "@/lib/seoAreas";

export const metadata: Metadata = {
  title: "Przewodniki po zakupie mieszkania w Polsce | WartoMetr",
  description:
    "Praktyczne materiały WartoMetr: cena za m2, dzielnice, kredyt hipoteczny, lista kontroli, księga wieczysta i całkowity koszt zakupu.",
  alternates: {
    canonical: `${siteUrl()}/guides`,
  },
};

export default async function GuidesPage() {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return <GuidesIndexContent initialLocale={initialLocale} />;
}
