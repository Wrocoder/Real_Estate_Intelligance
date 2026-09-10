import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { DemoModeBanner } from "@/components/DemoModeBanner";
import { AuthSessionNotice } from "@/components/AuthSessionNotice";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocalizedNavigation } from "@/components/LocalizedNavigation";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";

import "./globals.css";

const SKIP_TO_CONTENT = {
  pl: "Przejdź do treści",
  en: "Skip to content",
  ru: "Перейти к содержимому",
  uk: "Перейти до вмісту",
} as const;

const BRAND_TAGLINE = {
  pl: "Sprawdzenie mieszkania",
  en: "Apartment check",
  ru: "Проверка квартиры",
  uk: "Перевірка квартири",
} as const;

const MOBILE_MENU_LABEL = {
  pl: "Menu",
  en: "Menu",
  ru: "Меню",
  uk: "Меню",
} as const;

export const metadata: Metadata = {
  title: "WartoMetr",
  description: "Check an apartment before buying in Poland.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html lang={initialLocale}>
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/" className="brand">
              <span className="brand-mark">W</span>
              <span>
                <strong>WartoMetr</strong>
                <small>{BRAND_TAGLINE[initialLocale]}</small>
              </span>
            </Link>
            <details className="mobile-nav-disclosure">
              <summary className="mobile-nav-summary">
                <Menu aria-hidden="true" size={18} />
                <span>{MOBILE_MENU_LABEL[initialLocale]}</span>
              </summary>
              <div className="mobile-nav-content">
                <LocalizedNavigation initialLocale={initialLocale} />
                <LanguageSwitcher initialLocale={initialLocale} />
              </div>
            </details>
          </aside>
          <a className="skip-link" href="#main-content">
            {SKIP_TO_CONTENT[initialLocale]}
          </a>
          <main className="main" id="main-content">
            <DemoModeBanner initialLocale={initialLocale} />
            <AuthSessionNotice />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
