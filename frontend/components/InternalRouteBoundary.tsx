import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export function InternalRouteBoundary({ children }: { children: ReactNode }) {
  const explicitlyConfigured = process.env.INTERNAL_ROUTES_ENABLED;
  const enabled =
    explicitlyConfigured === "true" ||
    (explicitlyConfigured === undefined && process.env.NODE_ENV !== "production");

  if (!enabled) notFound();
  return children;
}
