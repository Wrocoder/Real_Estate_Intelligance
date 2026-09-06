import type { Metadata } from "next";
import { AreasDirectory } from "@/components/AreasDirectory";
import { api, type AreaStatistics } from "@/lib/api";
import { siteUrl } from "@/lib/seoAreas";

export const metadata: Metadata = {
  title: "Dzielnice Wrocławia: ceny mieszkań, ryzyka i potencjał | WartoMetr",
  description:
    "Przewodnik WartoMetr po dzielnicach Wrocławia: cena za m2, aktywna podaż, dynamika rynku, infrastruktura i ryzyka zakupu mieszkania.",
  alternates: {
    canonical: `${siteUrl()}/areas`,
  },
};

export default async function AreasPage() {
  let initialAreas: AreaStatistics[] | null = null;
  try {
    initialAreas = await api.listAreas();
  } catch {
    // The client retries so a temporary server-side API failure remains recoverable.
  }
  return <AreasDirectory initialAreas={initialAreas} />;
}
