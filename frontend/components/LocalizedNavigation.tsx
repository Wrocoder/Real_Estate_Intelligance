"use client";

import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calculator,
  ClipboardCheck,
  Columns3,
  CreditCard,
  Database,
  FileText,
  Handshake,
  MapPinned,
  Newspaper,
  Search,
  TrendingUp,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { NAVIGATION_LABELS, type Locale, type NavigationLabelKey } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type NavigationItem = {
  href: string;
  labelKey: NavigationLabelKey;
  icon: LucideIcon;
  external?: boolean;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: "/beta", labelKey: "beta", icon: BadgeCheck },
  { href: "/realtors", labelKey: "realtors", icon: Handshake },
  { href: "/guides", labelKey: "guides", icon: BookOpen },
  { href: "/", labelKey: "explorer", icon: Search },
  { href: "/check", labelKey: "check", icon: ClipboardCheck },
  { href: "/reports", labelKey: "reports", icon: FileText },
  { href: "/compare", labelKey: "compare", icon: Columns3 },
  { href: "/areas", labelKey: "areas", icon: MapPinned },
  { href: "/developers", labelKey: "developers", icon: Building2 },
  { href: "/news", labelKey: "news", icon: Newspaper },
  { href: "/market", labelKey: "market", icon: TrendingUp },
  { href: "/mortgage", labelKey: "mortgage", icon: Calculator },
  { href: "/pricing", labelKey: "pricing", icon: CreditCard },
  { href: "/alerts", labelKey: "alerts", icon: Bell },
  { href: "/account", labelKey: "account", icon: UserCircle },
  { href: "/admin", labelKey: "admin", icon: Database },
  { href: "http://127.0.0.1:8000/docs", labelKey: "api", icon: BarChart3, external: true },
];

export function LocalizedNavigation({ initialLocale }: { initialLocale: Locale }) {
  const { locale } = useLocalePreference(initialLocale);
  const labels = NAVIGATION_LABELS[locale];

  return (
    <nav className="nav-list" aria-label="Primary navigation">
      {NAVIGATION_ITEMS.map(({ href, labelKey, icon: Icon, external }) => {
        const label = labels[labelKey];
        if (external) {
          return (
            <a href={href} key={href} target="_blank" rel="noreferrer">
              <Icon size={18} />
              {label}
            </a>
          );
        }
        return (
          <Link href={href} key={href}>
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
