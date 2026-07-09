import type { ListingAnalysis } from "@/lib/api";

type Props = {
  analyses: ListingAnalysis[];
};

export function PropertyMap({ analyses }: Props) {
  return (
    <div className="map-panel" aria-label="Схематичная карта объектов">
      <div className="map-river" />
      <div className="map-road" />
      {analyses.map((item, index) => {
        const left = 16 + ((index * 27) % 62);
        const top = 26 + ((index * 19) % 52);
        const risk = item.scores.risk_score >= 40;
        return (
          <a
            key={item.listing.id}
            className={risk ? "pin risk-pin" : "pin"}
            href={`/listings/${item.listing.id}`}
            title={`${item.listing.title}: ${item.scores.investment_score}/100`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span>{item.scores.investment_score}</span>
          </a>
        );
      })}
    </div>
  );
}

