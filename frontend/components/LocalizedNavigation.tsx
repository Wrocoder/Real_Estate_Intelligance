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

const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: "/check", labelKey: "check", icon: ClipboardCheck },
  { href: "/", labelKey: "explorer", icon: Search },
  { href: "/check/drafts", labelKey: "myApartments", icon: Building2 },
  { href: "/areas", labelKey: "areas", icon: MapPinned },
];

const AUTH_COPY: Record<Locale, { section: string; signIn: string; register: string }> = {
  pl: { section: "Dostęp do konta", signIn: "Zaloguj się", register: "Utwórz konto" },
  en: { section: "Account access", signIn: "Sign in", register: "Create account" },
  ru: { section: "Доступ к аккаунту", signIn: "Войти", register: "Создать аккаунт" },
  uk: { section: "Доступ до акаунта", signIn: "Увійти", register: "Створити акаунт" },
};

export function LocalizedNavigation({ initialLocale }: { initialLocale: Locale }) {
  const { locale } = useLocalePreference(initialLocale);
  const labels = NAVIGATION_LABELS[locale];
  const authCopy = AUTH_COPY[locale];
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
      {session === null ? (
        <div className="nav-auth-actions" aria-label={authCopy.section}>
          <Link href="/account?mode=login">
            <LogIn size={18} />
            {authCopy.signIn}
          </Link>
          <Link className="nav-create-account" href="/account?mode=register">
            <UserPlus size={18} />
            {authCopy.register}
          </Link>
        </div>
      ) : (
        <Link className="nav-account-link" href="/account">
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
