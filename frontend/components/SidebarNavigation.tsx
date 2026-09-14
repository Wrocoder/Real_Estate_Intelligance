"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

export function SidebarNavigation({ children, label }: { children: ReactNode; label: string }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const Icon = open ? X : Menu;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function closeAfterNavigation(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpenPath(null);
  }

  return (
    <div className="mobile-nav-disclosure" data-open={open}>
      <button
        className="mobile-nav-summary"
        type="button"
        aria-expanded={open}
        aria-controls="sidebar-navigation"
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        <Icon aria-hidden="true" size={18} />
        <span>{label}</span>
      </button>
      <div className="mobile-nav-content" id="sidebar-navigation" onClick={closeAfterNavigation}>
        {children}
      </div>
    </div>
  );
}
