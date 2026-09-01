"use client";

import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  Search,
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
  { href: "/check", labelKey: "check", icon: ClipboardCheck },
  { href: "/", labelKey: "explorer", icon: Search },
  { href: "/reports", labelKey: "reports", icon: FileText },
  { href: "/pricing", labelKey: "pricing", icon: CreditCard },
  { href: "/guides", labelKey: "guides", icon: BookOpen },
  { href: "/account", labelKey: "account", icon: UserCircle },
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
