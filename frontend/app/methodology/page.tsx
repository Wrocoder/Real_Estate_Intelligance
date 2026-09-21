import type { Metadata } from "next";
import { cookies } from "next/headers";

import { MethodologyContent } from "@/components/MethodologyContent";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";
import { siteUrl } from "@/lib/seoAreas";

export const metadata: Metadata = {
  title: "Metodologia WartoMetr: cena, ryzyko i zaufanie",
  description:
    "Jak WartoMetr wyjaśnia fair price, porównywalne dane, pewność analizy, backtesting i ograniczenia przed decyzją o zakupie mieszkania.",
  alternates: {
    canonical: `${siteUrl()}/methodology`,
  },
};

export default async function MethodologyPage() {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return <MethodologyContent initialLocale={initialLocale} />;
}
