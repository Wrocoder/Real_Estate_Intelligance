"use client";

import { LockKeyhole, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const COPY: Record<
  Locale,
  { required: string; expired: string; forbidden: string; action: string; close: string }
> = {
  pl: { required: "Zaloguj się, aby kontynuować.", expired: "Sesja wygasła. Zaloguj się ponownie, aby kontynuować.", forbidden: "To konto nie ma dostępu do tej operacji.", action: "Przejdź do konta", close: "Zamknij" },
  en: { required: "Sign in to continue.", expired: "Your session expired. Sign in again to continue.", forbidden: "This account cannot perform that action.", action: "Go to account", close: "Dismiss" },
  ru: { required: "Войдите, чтобы продолжить.", expired: "Сессия истекла. Войдите снова, чтобы продолжить.", forbidden: "У этого аккаунта нет доступа к действию.", action: "Перейти в аккаунт", close: "Закрыть" },
  uk: { required: "Увійдіть, щоб продовжити.", expired: "Сесія завершилася. Увійдіть знову, щоб продовжити.", forbidden: "Цей акаунт не має доступу до дії.", action: "Перейти до акаунта", close: "Закрити" },
};

type AuthNotice = { status: 401 | 403; reason: "required" | "expired" };

export function AuthSessionNotice() {
  const { locale } = useLocalePreference();
  const [notice, setNotice] = useState<AuthNotice | null>(null);

  useEffect(() => {
    const required = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: number; reason?: string }>).detail;
      const status = detail?.status;
      if (status !== 401 && status !== 403) return;
      const reason = detail?.reason === "required" ? "required" : "expired";
      if (status === 401 && reason === "required" && window.location.pathname === "/account") {
        setNotice(null);
        return;
      }
      setNotice({ status, reason });
    };
    const changed = () => setNotice(null);
    window.addEventListener("domarion:auth-required", required);
    window.addEventListener("domarion:auth-changed", changed);
    return () => {
      window.removeEventListener("domarion:auth-required", required);
      window.removeEventListener("domarion:auth-changed", changed);
    };
  }, []);

  if (notice === null) return null;
  const copy = COPY[locale];
  const returnTo = typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`;
  return (
    <div className={`auth-notice ${notice.status === 403 ? "forbidden" : ""}`} role="alert">
      <LockKeyhole size={18} />
      <span>
        {notice.status === 403
          ? copy.forbidden
          : notice.reason === "required"
            ? copy.required
            : copy.expired}
      </span>
      <Link href={`/account?returnTo=${encodeURIComponent(returnTo)}`}>{copy.action}</Link>
      <button type="button" onClick={() => setNotice(null)} title={copy.close} aria-label={copy.close}>
        <X size={18} />
      </button>
    </div>
  );
}
