import type { Metadata } from "next";
import CheckListingExperience from "@/components/CheckListingExperience";

export const metadata: Metadata = {
  title: "Sprawdź mieszkanie przed zakupem | WartoMetr",
  description: "Sprawdź dostępne dane rynkowe, ryzyka i rozsądny zakres ceny mieszkania.",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return <CheckListingExperience />;
}
