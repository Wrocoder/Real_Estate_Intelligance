import type { Metadata } from "next";

import { BuyerBetaContent } from "@/components/BuyerBetaContent";

export const metadata: Metadata = {
  title: "Apartment check before purchase | WartoMetr",
  description: "WartoMetr helps buyers avoid overpaying, understand risks, and prepare for negotiation.",
};

export default function BuyerBetaPage() {
  return <BuyerBetaContent />;
}
