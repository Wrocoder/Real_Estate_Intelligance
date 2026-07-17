type LandingMapSceneProps = {
  variant: "buyer" | "realtor";
};

const buyerBadges = [
  { className: "badge-a", label: "Fair value -4.8%" },
  { className: "badge-b", label: "Tram 2028" },
  { className: "badge-c", label: "Noise risk" },
  { className: "badge-d", label: "74 days on market" },
];

const realtorBadges = [
  { className: "badge-a", label: "Client PDF ready" },
  { className: "badge-b", label: "3 comparables" },
  { className: "badge-c", label: "Offer anchor" },
  { className: "badge-d", label: "Area delta +6%" },
];

export function LandingMapScene({ variant }: LandingMapSceneProps) {
  const badges = variant === "buyer" ? buyerBadges : realtorBadges;

  return (
    <div className={`landing-map-scene ${variant}`} aria-hidden="true">
      <span className="map-water" />
      <span className="map-zone zone-a" />
      <span className="map-zone zone-b" />
      <span className="map-zone zone-c" />
      <span className="map-zone zone-d" />
      <span className="map-road road-a" />
      <span className="map-road road-b" />
      <span className="map-road road-c" />
      <span className="map-road road-d" />
      <span className="map-route route-a" />
      <span className="map-route route-b" />
      <span className="map-pin pin-a" />
      <span className="map-pin pin-b" />
      <span className="map-pin pin-c" />
      <span className="map-pin pin-d" />
      {badges.map((badge) => (
        <span className={`scene-badge ${badge.className}`} key={badge.className}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
