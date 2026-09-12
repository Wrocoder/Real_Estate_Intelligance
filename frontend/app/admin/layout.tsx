import type { ReactNode } from "react";

import { InternalRouteBoundary } from "@/components/InternalRouteBoundary";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <InternalRouteBoundary>{children}</InternalRouteBoundary>;
}
