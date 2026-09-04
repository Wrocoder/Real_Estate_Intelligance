import { ExternalLink } from "lucide-react";

import { GUIDE_EDITORIAL_META } from "@/lib/seoGuides";

export function GuideEditorialMeta({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`guide-editorial-meta${compact ? " compact" : ""}`} aria-label="Informacje redakcyjne">
      <div className="guide-editorial-facts">
        <span><strong>Autor:</strong> {GUIDE_EDITORIAL_META.author}</span>
        <span><strong>Recenzja:</strong> {GUIDE_EDITORIAL_META.reviewer}</span>
        <span><strong>Aktualizacja:</strong> {GUIDE_EDITORIAL_META.updatedAt}</span>
      </div>
      {!compact && (
        <>
          <div className="guide-editorial-sources">
            <strong>Źródła referencyjne:</strong>{" "}
            {GUIDE_EDITORIAL_META.sources.map((source) => (
              <a href={source.href} key={source.href} target="_blank" rel="noreferrer">
                {source.label} <ExternalLink size={12} />
              </a>
            ))}
          </div>
          <p>{GUIDE_EDITORIAL_META.disclaimer}</p>
        </>
      )}
    </section>
  );
}
