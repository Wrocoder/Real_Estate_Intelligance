"use client";

import { AlertTriangle, BarChart3, BookOpen, ClipboardCheck, Database, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { methodologyMessages } from "@/lib/methodologyMessages";
import { useLocalePreference } from "@/lib/useLocalePreference";

export function MethodologyContent({ initialLocale }: { initialLocale: Locale }) {
  const { locale } = useLocalePreference(initialLocale);
  const copy = methodologyMessages[locale];
  const sectionIcons = [Database, Scale, ShieldCheck];

  return (
    <div className="methodology-page" lang={locale}>
      <header className="page-header methodology-header">
        <div>
          <span className="status-pill info">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/guides">
            <BookOpen aria-hidden="true" size={16} /> {copy.secondaryAction}
          </Link>
          <Link className="button primary" href="/check?source=methodology">
            <ClipboardCheck aria-hidden="true" size={16} /> {copy.primaryAction}
          </Link>
        </div>
      </header>

      <section className="methodology-trust-grid" aria-label={copy.eyebrow}>
        {copy.trustFacts.map((item, index) => {
          const Icon = index === 0 ? ShieldCheck : index === 1 ? Scale : AlertTriangle;
          return (
            <article className="methodology-card emphasis" key={item.title}>
              <Icon aria-hidden="true" size={22} />
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className="methodology-section">
        {copy.sections.map((section, index) => {
          const Icon = sectionIcons[index] ?? Database;
          return (
            <article className="methodology-block" key={section.title}>
              <div className="methodology-block-heading">
                <Icon aria-hidden="true" size={22} />
                <div>
                  <h2>{section.title}</h2>
                  {section.body ? <p>{section.body}</p> : null}
                </div>
              </div>
              <div className="methodology-detail-grid">
                {section.items.map((item) => (
                  <div className="methodology-detail" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="methodology-backtest" aria-labelledby="methodology-backtest-title">
        <div className="methodology-block-heading">
          <BarChart3 aria-hidden="true" size={22} />
          <div>
            <h2 id="methodology-backtest-title">{copy.backtesting.title}</h2>
            <p>{copy.backtesting.body}</p>
          </div>
        </div>
        <div className="methodology-backtest-grid">
          {copy.backtesting.metrics.map((metric) => (
            <div className="methodology-metric" key={metric.title}>
              <strong>{metric.title}</strong>
              <span>{metric.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="methodology-limits" aria-labelledby="methodology-limits-title">
        <div>
          <AlertTriangle aria-hidden="true" size={22} />
          <h2 id="methodology-limits-title">{copy.limits.title}</h2>
        </div>
        <ul className="section-list compact">
          {copy.limits.items.map((item) => (
            <li key={item}>
              <AlertTriangle aria-hidden="true" size={14} /> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="methodology-verification">
        <div>
          <h2>{copy.verification.title}</h2>
          <p>{copy.verification.body}</p>
        </div>
        <Link className="button primary" href="/check?source=methodology-bottom">
          <ClipboardCheck aria-hidden="true" size={16} /> {copy.primaryAction}
        </Link>
      </section>
    </div>
  );
}
