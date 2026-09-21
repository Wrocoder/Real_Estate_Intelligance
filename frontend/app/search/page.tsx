import type { Metadata } from "next";
import ExplorerExperience from "@/components/ExplorerExperience";

export const metadata: Metadata = {
  title: "Wyszukaj mieszkanie | WartoMetr",
  description: "Znajdź mieszkanie według lokalizacji, budżetu i potrzeb.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return <ExplorerExperience />;
}
