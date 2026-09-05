"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Download, ExternalLink, RefreshCw, Search } from "lucide-react";

import { AuthForm } from "@/components/AuthForm";
import { DecisionSummary } from "@/components/DecisionSummary";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  ApiError,
  api,
  reportContentUrl,
  reportPdfUrl,
  type AccountSummary,
  type AIInsightListItem,
  type GeneratedReportListItem,
} from "@/lib/api";
import { dateValue } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import { REPORTS_PAGE_COPY, type Locale, type ReportsPageCopy } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const REPORTS_BUYER_COPY: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    metrics: {
      savedReports: string;
      reportsThisMonth: string;
      credits: string;
    };
    actions: {
      checkApartment: string;
      buyReport: string;
      openHtml: string;
      openPdf: string;
    };
    sections: {
      nextStep: string;
      library: string;
    };
    descriptions: {
      checkApartment: string;
      buyReport: string;
      empty: string;
    };
      values: {
        noInsight: string;
        created: (date: string) => string;
        version: (value: string) => string;
        dataAsOf: (date: string) => string;
    };
  }
> = {
  en: {
    title: "My property reports",
    subtitle: "Saved apartment reports, verdicts and supporting evidence for your buying decisions.",
    metrics: {
      savedReports: "Saved reports",
      reportsThisMonth: "Reports this month",
      credits: "Report credits",
    },
    actions: {
      checkApartment: "Check an apartment",
      buyReport: "Buy full report",
      openHtml: "Open report",
      openPdf: "Download PDF",
    },
    sections: {
      nextStep: "Next step",
      library: "Report library",
    },
    descriptions: {
      checkApartment: "Paste an Otodom or OLX link and get a buyer verdict first.",
      buyReport: "Open pricing after choosing an apartment to unlock the full report.",
      empty: "Reports appear here after you buy or prepare one from a checked apartment.",
    },
    values: {
      noInsight: "Summary will appear when available",
      created: (date) => `Created ${date}`,
      version: (value) => `Report version ${value}`,
      dataAsOf: (date) => `Data snapshot ${date}`,
    },
  },
  pl: {
    title: "Moje raporty mieszkań",
    subtitle: "Zapisane raporty, werdykty i uzasadnienia pomagające podjąć decyzję o zakupie.",
    metrics: {
      savedReports: "Zapisane raporty",
      reportsThisMonth: "Raporty w tym miesiącu",
      credits: "Kredyty raportów",
    },
    actions: {
      checkApartment: "Sprawdź mieszkanie",
      buyReport: "Kup pełny raport",
      openHtml: "Otwórz raport",
      openPdf: "Pobierz PDF",
    },
    sections: {
      nextStep: "Następny krok",
      library: "Biblioteka raportów",
    },
    descriptions: {
      checkApartment: "Wklej link z Otodom lub OLX i najpierw zobacz werdykt dla kupującego.",
      buyReport: "Otwórz płatności po wyborze mieszkania, aby odblokować pełny raport.",
      empty: "Raporty pojawią się tutaj po zakupie albo przygotowaniu ich ze sprawdzonego mieszkania.",
    },
    values: {
      noInsight: "Podsumowanie pojawi się, gdy będzie dostępne",
      created: (date) => `Utworzono ${date}`,
      version: (value) => `Wersja raportu: ${value}`,
      dataAsOf: (date) => `Dane na dzień: ${date}`,
    },
  },
  ru: {
    title: "Мои отчеты по квартирам",
    subtitle: "Сохраненные отчеты, выводы и обоснования для решений о покупке.",
    metrics: {
      savedReports: "Сохраненные отчеты",
      reportsThisMonth: "Отчеты за месяц",
      credits: "Кредиты отчетов",
    },
    actions: {
      checkApartment: "Проверить квартиру",
      buyReport: "Купить полный отчет",
      openHtml: "Открыть отчет",
      openPdf: "Скачать PDF",
    },
    sections: {
      nextStep: "Следующий шаг",
      library: "Библиотека отчетов",
    },
    descriptions: {
      checkApartment: "Вставьте ссылку Otodom или OLX и сначала получите вывод для покупателя.",
      buyReport: "Откройте оплату после выбора квартиры, чтобы разблокировать полный отчет.",
      empty: "Отчеты появятся здесь после покупки или подготовки из проверенной квартиры.",
    },
    values: {
      noInsight: "Резюме появится, когда будет доступно",
      created: (date) => `Создан ${date}`,
      version: (value) => `Версия отчета: ${value}`,
      dataAsOf: (date) => `Снимок данных: ${date}`,
    },
  },
  uk: {
    title: "Мої звіти по квартирах",
    subtitle: "Збережені звіти, висновки й обґрунтування для рішень про купівлю.",
    metrics: {
      savedReports: "Збережені звіти",
      reportsThisMonth: "Звіти за місяць",
      credits: "Кредити звітів",
    },
    actions: {
      checkApartment: "Перевірити квартиру",
      buyReport: "Купити повний звіт",
      openHtml: "Відкрити звіт",
      openPdf: "Завантажити PDF",
    },
    sections: {
      nextStep: "Наступний крок",
      library: "Бібліотека звітів",
    },
    descriptions: {
      checkApartment: "Вставте посилання Otodom або OLX і спочатку отримайте висновок для покупця.",
      buyReport: "Відкрийте оплату після вибору квартири, щоб розблокувати повний звіт.",
      empty: "Звіти з'являться тут після купівлі або підготовки з перевіреної квартири.",
    },
    values: {
      noInsight: "Резюме з'явиться, коли буде доступне",
      created: (date) => `Створено ${date}`,
      version: (value) => `Версія звіту: ${value}`,
      dataAsOf: (date) => `Знімок даних: ${date}`,
    },
  },
};

const REPORTS_LOADING_STEPS: Record<Locale, string[]> = {
  en: ["Loading saved reports", "Finding report insights", "Checking available credits"],
  pl: ["Ładujemy zapisane raporty", "Szukamy podsumowań raportów", "Sprawdzamy dostępne kredyty"],
  ru: ["Загружаем сохраненные отчеты", "Ищем выводы из отчетов", "Проверяем доступные кредиты"],
  uk: ["Завантажуємо збережені звіти", "Шукаємо висновки зі звітів", "Перевіряємо доступні кредити"],
};

export default function ReportsPage() {
  const { locale } = useLocalePreference();
  const copy = REPORTS_PAGE_COPY[locale];
  const buyerCopy = REPORTS_BUYER_COPY[locale];
  const [reports, setReports] = useState<GeneratedReportListItem[]>([]);
  const [insights, setInsights] = useState<AIInsightListItem[]>([]);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [status, setStatus] = useState(copy.statuses.loading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setAuthRequired(false);
    setIsLoading(true);
    setStatus(copy.statuses.loading);
    try {
      const [accountData, data, insightData] = await Promise.all([
        api.getMe(),
        api.listReports(),
        api.listAIInsights({ limit: 200 }),
      ]);
      setAccount(accountData);
      setReports(data);
      setInsights(insightData);
      setStatus(copy.statuses.loaded(data.length));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setAuthRequired(true);
        setStatus("");
      } else {
        setError(localizedError(caught, locale, copy.values.unknownError));
        setStatus(copy.statuses.backendUnavailable);
      }
    } finally {
      setIsLoading(false);
    }
  }, [copy, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const buyerReports = reports.filter((report) => report.audience === "buyer");

  if (authRequired) return <AuthForm onAuthenticated={load} />;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{buyerCopy.title}</h1>
          <p>{buyerCopy.subtitle}</p>
        </div>
        <div className="button-row">
          <button className="button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} /> {copy.actions.refresh}
          </button>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>{buyerCopy.metrics.savedReports}</span>
          <strong>{buyerReports.length}</strong>
        </div>
        <div className="metric">
          <span>{buyerCopy.metrics.reportsThisMonth}</span>
          <strong>
            {account
              ? `${account.usage.reports_this_month}/${account.limits.monthly_reports}`
              : copy.values.noInsight}
          </strong>
        </div>
        <div className="metric">
          <span>{buyerCopy.metrics.credits}</span>
          <strong>{account ? account.usage.report_credits_available : 0}</strong>
        </div>
        <div className="metric">
          <span>{copy.table.date}</span>
          <strong>{status}</strong>
        </div>
      </section>

      <section className="account-action-grid" aria-label={buyerCopy.sections.nextStep}>
        <Link className="account-action-card primary" href="/check">
          <Search size={18} />
          <span>
            <strong>{buyerCopy.actions.checkApartment}</strong>
            <small>{buyerCopy.descriptions.checkApartment}</small>
          </span>
        </Link>
        <Link className="account-action-card" href="/pricing">
          <CreditCard size={18} />
          <span>
            <strong>{buyerCopy.actions.buyReport}</strong>
            <small>{buyerCopy.descriptions.buyReport}</small>
          </span>
        </Link>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{buyerCopy.sections.library}</h2>
          <span className="muted">{copy.values.items(buyerReports.length)}</span>
        </div>
        <div className="panel-body">
          {error ? (
            <ErrorBlock message={error} prefix={copy.errorPrefix} />
          ) : buyerReports.length === 0 && isLoading ? (
            <LoadingBlock label={copy.empty.loading} steps={REPORTS_LOADING_STEPS[locale]} />
          ) : buyerReports.length === 0 ? (
            <EmptyBlock label={buyerCopy.descriptions.empty} />
          ) : (
            <div className="report-library-grid">
              {buyerReports.map((report) => {
                const insight = insightForReport(insights, report.id);
                return (
                  <article className="report-library-card" key={report.id}>
                    <div className="panel-header inline">
                      <div>
                        <h3>{report.title}</h3>
                        <p className="muted">{reportSubject(report.listing_id, locale)}</p>
                      </div>
                      <span className="status-pill info">
                        {copy.values.audienceLabels[report.audience] ?? report.audience}
                      </span>
                    </div>

                    <DecisionSummary
                      compact
                      fallbackSummary={report.summary}
                      locale={locale}
                      snapshot={report.decision_summary}
                    />

                    <div className="report-insight">
                      <strong>{insight ? insightLabel(insight, copy) : buyerCopy.values.noInsight}</strong>
                      {insight ? <p>{insight.summary}</p> : null}
                    </div>

                    <div className="meta-row">
                      <span>{buyerCopy.values.created(dateValue(report.created_at, locale))}</span>
                      {report.report_version ? <span>{buyerCopy.values.version(report.report_version)}</span> : null}
                      {report.data_as_of ? <span>{buyerCopy.values.dataAsOf(dateValue(report.data_as_of, locale))}</span> : null}
                    </div>

                    <div className="button-row">
                      <a
                        className="button primary"
                        href={reportContentUrl(report.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={16} /> {buyerCopy.actions.openHtml}
                      </a>
                      <a
                        className="button"
                        href={reportPdfUrl(report.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={16} /> {buyerCopy.actions.openPdf}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function insightForReport(insights: AIInsightListItem[], reportId: string) {
  return (
    insights.find(
      (insight) =>
        insight.source_report_id === reportId && insight.insight_type === "object_explanation",
    ) ?? insights.find((insight) => insight.source_report_id === reportId)
  );
}

function insightLabel(insight: AIInsightListItem, copy: ReportsPageCopy) {
  return copy.values.insightLabels[insight.insight_type] ?? copy.values.insightLabels.report_summary;
}

function reportSubject(reference: string, locale: Locale) {
  if (reference.startsWith("area:")) {
    return {
      en: "Area report",
      pl: "Raport obszaru",
      ru: "Отчет по району",
      uk: "Звіт по району",
    }[locale];
  }
  return {
    en: "Apartment report",
    pl: "Raport mieszkania",
    ru: "Отчет по квартире",
    uk: "Звіт по квартирі",
  }[locale];
}
