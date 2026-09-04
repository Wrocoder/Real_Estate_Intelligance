import type { Metadata } from "next";

import { RealtorsContent } from "@/components/RealtorsContent";

export const metadata: Metadata = {
  title: "Analytics and reports for realtors | WartoMetr",
  description: "Client-ready property reports, market context, comparisons, and negotiation evidence for realtors.",
};

export default function RealtorsPage() {
  return <RealtorsContent />;
}
