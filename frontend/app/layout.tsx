import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocalizedNavigation } from "@/components/LocalizedNavigation";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";

import "./globals.css";

export const metadata: Metadata = {
  title: "Domarion Analytics",
  description: "Real estate intelligence for Wrocław property decisions.",
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
              <span className="brand-mark">D</span>
              <span>
                <strong>Domarion</strong>
                <small>Analytics</small>
              </span>
            </Link>
            <LocalizedNavigation initialLocale={initialLocale} />
            <LanguageSwitcher initialLocale={initialLocale} />
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
