import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Columns3,
  CreditCard,
  FileText,
  Search,
  UserCircle,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "Domarion Analytics",
  description: "Real estate intelligence for Wrocław property decisions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
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
            <nav className="nav-list" aria-label="Primary navigation">
              <Link href="/">
                <Search size={18} />
                Подбор
              </Link>
              <Link href="/reports">
                <FileText size={18} />
                Отчеты
              </Link>
              <Link href="/compare">
                <Columns3 size={18} />
                Сравнение
              </Link>
              <Link href="/pricing">
                <CreditCard size={18} />
                Оплата
              </Link>
              <Link href="/alerts">
                <Bell size={18} />
                Alerts
              </Link>
              <Link href="/account">
                <UserCircle size={18} />
                Аккаунт
              </Link>
              <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
                <BarChart3 size={18} />
                API
              </a>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
