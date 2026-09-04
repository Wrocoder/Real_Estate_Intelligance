"use client";

import {
  Building2,
  ClipboardCheck,
  LogIn,
  MapPinned,
  Search,
  UserCircle,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { AuthSession } from "@/lib/api";
import { NAVIGATION_LABELS, type Locale, type NavigationLabelKey } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type NavigationItem = {
  href: string;
  labelKey: NavigationLabelKey;
  icon: LucideIcon;
  external?: boolean;
};

const PRIMARY_NAVIGATION_ITEMS: NavigationItem[] = [
  { href: "/check", labelKey: "check", icon: ClipboardCheck },
];

const DISCOVERY_NAVIGATION_ITEMS: NavigationItem[] = [
  { href: "/", labelKey: "explorer", icon: Search },
  { href: "/saved", labelKey: "myApartments", icon: Building2 },
  { href: "/areas", labelKey: "areas", icon: MapPinned },
];

const NAV_COPY: Record<Locale, { navigation: string; primary: string; discovery: string; account: string; signIn: string; register: string }> = {
  pl: { navigation: "Nawigacja główna", primary: "Główna ścieżka", discovery: "Moje mieszkania i wyszukiwanie", account: "Dostęp do konta", signIn: "Zaloguj się", register: "Utwórz konto" },
  en: { navigation: "Primary navigation", primary: "Main flow", discovery: "My apartments and search", account: "Account access", signIn: "Sign in", register: "Create account" },
  ru: { navigation: "Основная навигация", primary: "Основной путь", discovery: "Мои квартиры и поиск", account: "Доступ к аккаунту", signIn: "Войти", register: "Создать аккаунт" },
  uk: { navigation: "Основна навігація", primary: "Основний шлях", discovery: "Мої квартири та пошук", account: "Доступ до акаунта", signIn: "Увійти", register: "Створити акаунт" },
};

export function LocalizedNavigation({ initialLocale }: { initialLocale: Locale }) {
  const { locale } = useLocalePreference(initialLocale);
  const labels = NAVIGATION_LABELS[locale];
  const navCopy = NAV_COPY[locale];
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const refreshSession = async () => {
      try {
        const response = await fetch("/api/auth/session-status", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) throw new Error("session status unavailable");
        const result = (await response.json()) as {
          authenticated: boolean;
          session?: AuthSession;
        };
        if (active) setSession(result.authenticated ? result.session : null);
      } catch {
        if (active) setSession(undefined);
      }
    };

    void refreshSession();
    window.addEventListener("domarion:auth-changed", refreshSession);
    return () => {
      active = false;
      window.removeEventListener("domarion:auth-changed", refreshSession);
    };
  }, []);

  function renderItems(items: NavigationItem[], group: "primary" | "discovery") {
    return items.map(({ href, labelKey, icon: Icon, external }) => {
        const label = labels[labelKey];
        const active = isNavigationItemActive(pathname, href);
        const className = `${group === "primary" ? "nav-primary-link" : ""}${active ? " active" : ""}`.trim();
        if (external) {
          return (
            <a className={className} href={href} key={href} target="_blank" rel="noreferrer">
              <Icon size={18} />
              {label}
            </a>
          );
        }
        return (
          <Link className={className} href={href} key={href} aria-current={active ? "page" : undefined}>
            <Icon size={18} />
            {label}
          </Link>
        );
      });
  }

  return (
    <nav className="nav-list" aria-label={navCopy.navigation}>
      <div className="nav-group nav-primary">
        <span className="nav-group-label">{navCopy.primary}</span>
        {renderItems(PRIMARY_NAVIGATION_ITEMS, "primary")}
      </div>
      <div className="nav-group nav-discovery">
        <span className="nav-group-label">{navCopy.discovery}</span>
        {renderItems(DISCOVERY_NAVIGATION_ITEMS, "discovery")}
      </div>
      {session === null ? (
        <div className="nav-auth-actions" aria-label={navCopy.account}>
          <Link href="/account?mode=login">
            <LogIn size={18} />
            {navCopy.signIn}
          </Link>
          <Link className="nav-create-account" href="/account?mode=register">
            <UserPlus size={18} />
            {navCopy.register}
          </Link>
        </div>
      ) : (
        <Link className={`nav-account-link${isNavigationItemActive(pathname, "/account") ? " active" : ""}`} href="/account" aria-current={isNavigationItemActive(pathname, "/account") ? "page" : undefined}>
          <UserCircle size={18} />
          <span>
            <strong>{session?.user.display_name || labels.account}</strong>
            {session?.user.email ? <small>{session.user.email}</small> : null}
          </span>
        </Link>
      )}
    </nav>
  );
}

function isNavigationItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/" || pathname.startsWith("/listings/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
