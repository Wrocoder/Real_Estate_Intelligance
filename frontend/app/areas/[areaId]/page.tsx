import type { Metadata } from "next";

import { AreaDetailPage } from "@/components/AreaDetailPage";
import { api, type AreaStatistics } from "@/lib/api";
import { siteUrl } from "@/lib/seoAreas";

type PageProps = {
  params: Promise<{ areaId: string }>;
};

async function getArea(areaId: string): Promise<AreaStatistics | null> {
  try {
    return await api.getAreaStatistics(areaId);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaId } = await params;
  const area = await getArea(areaId);
  const title = area
    ? `${area.name}: ceny transakcyjne mieszkań | WartoMetr`
    : "Dane osiedla we Wrocławiu | WartoMetr";
  const description = area
    ? `Mediana cen transakcyjnych mieszkań na osiedlu ${area.name}, liczba obserwacji, okres danych i źródło.`
    : "Sprawdź dostępne dane transakcyjne dla osiedli Wrocławia.";
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/areas/${areaId}` },
  };
}

export default async function AreaPage({ params }: PageProps) {
  const { areaId } = await params;
  const area = await getArea(areaId);
  const jsonLd = area ? {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${area.name}, ${area.city}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: area.city,
      addressRegion: "Dolnośląskie",
      addressCountry: "PL",
    },
    url: `${siteUrl()}/areas/${area.area_id}`,
  } : null;

  return (
    <>
      {jsonLd ? (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          type="application/ld+json"
        />
      ) : null}
      <AreaDetailPage areaId={areaId} initialArea={area} />
    </>
  );
}
