import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { BetaLeadForm } from "@/components/BetaLeadForm";
import { LandingMapScene } from "@/components/LandingMapScene";

export const metadata: Metadata = {
  title: "Проверка квартиры перед покупкой | Domarion Analytics",
  description:
    "Paid beta Domarion: не переплатить за квартиру, не купить проблему и подготовиться к торгу перед zadatek.",
};

const reportChecks = [
  {
    icon: TrendingUp,
    title: "Не переплатить",
    text: "Показываем fair range, переплату, opening offer и максимальную цену, выше которой нужен сильный аргумент.",
  },
  {
    icon: MapPinned,
    title: "Район и будущие планы",
    text: "Проверяем транспорт, школы, парки, planned investments и факторы, которые могут улучшить или ухудшить локацию.",
  },
  {
    icon: ShieldCheck,
    title: "Не купить проблему",
    text: "Выносим legal/technical unknowns, шумовые и промышленные proxy, слабые данные, developer risk и checklist до zadatek.",
  },
  {
    icon: WalletCards,
    title: "Подготовиться к торгу",
    text: "Собираем seller questions, аргументы по цене, walk-away level и список того, что проверить на просмотре.",
  },
];

const workflow = [
  "Вставьте ссылку Otodom/OLX или заполните адрес, цену, площадь и комнаты вручную.",
  "Подтвердите извлеченные параметры: мы не сохраняем фото, контакты и полный текст объявления.",
  "Получите buyer report: fair price, риски, район, вопросы продавцу и решение, стоит ли идти дальше.",
];

export default function BuyerBetaPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <LandingMapScene variant="buyer" />
        <div className="landing-hero-shade" />
        <div className="landing-hero-content">
          <span className="landing-eyebrow">Paid beta · Wrocław i okolice</span>
          <h1>Проверка квартиры перед покупкой</h1>
          <p>
            Введите адрес или ссылку на объект, а Domarion ответит: покупать,
            торговаться, отказаться или сначала закрыть критичные неизвестные.
          </p>
          <div className="landing-cta-row">
            <Link className="button primary landing-button" href="/check?source=buyer-beta">
              <ClipboardCheck size={18} /> Проверить объект
            </Link>
            <Link className="button landing-button" href="/pricing?source=buyer-beta">
              <FileText size={18} /> Посмотреть отчеты
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-proof-strip" aria-label="Paid beta metrics">
        <div>
          <strong>49-149 PLN</strong>
          <span>гипотеза цены за buyer reports</span>
        </div>
        <div>
          <strong>15 минут</strong>
          <span>быстрый object-check flow в MVP</span>
        </div>
        <div>
          <strong>0 фото</strong>
          <span>без копирования фото и контактов порталов</span>
        </div>
        <div>
          <strong>Wrocław+</strong>
          <span>стартовый coverage с suburban fallback</span>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-eyebrow">Что внутри отчета</span>
          <h2>Не еще одно объявление, а решение по объекту</h2>
          <p>
            Buyer report должен быстро показать, где можно сэкономить, где объект
            может стать проблемой и какие аргументы использовать до offer.
          </p>
        </div>
        <div className="landing-card-grid">
          {reportChecks.map((item) => {
            const Icon = item.icon;
            return (
              <article className="landing-card" key={item.title}>
                <Icon size={20} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-section-muted">
        <div className="landing-section-header">
          <span className="landing-eyebrow">Как работает beta</span>
          <h2>От ссылки к отчету без зависимости от спорного scraping</h2>
        </div>
        <ol className="landing-steps">
          {workflow.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <BetaLeadForm segment="buyer_beta" entryPoint="/beta" />

      <section className="landing-section landing-compliance">
        <div>
          <span className="landing-eyebrow">Data policy</span>
          <h2>Минимум данных, максимум пользы для решения</h2>
        </div>
        <ul className="section-list">
          <li>
            <LockKeyhole size={16} />
            Source URL хранится как приватный reference и не показывается публично.
          </li>
          <li>
            <CheckCircle2 size={16} />
            Сравнение строится на нашей базе, партнерских snapshots и open-data слоях.
          </li>
          <li>
            <ShieldCheck size={16} />
            Отчет не является юридической, финансовой или инвестиционной гарантией.
          </li>
        </ul>
        <Link className="button primary landing-button" href="/check?source=buyer-beta-bottom">
          <ArrowRight size={18} /> Начать проверку
        </Link>
      </section>
    </div>
  );
}
