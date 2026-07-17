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

import { LandingMapScene } from "@/components/LandingMapScene";

export const metadata: Metadata = {
  title: "Проверка квартиры перед покупкой | Domarion Analytics",
  description:
    "Paid beta Domarion: проверка квартиры по адресу или ссылке Otodom/OLX, отчет по цене, рискам, району и торгу.",
};

const reportChecks = [
  {
    icon: TrendingUp,
    title: "Цена и торг",
    text: "Сравниваем цену с районом и похожими объектами, показываем fair value, переплату и аргументы для offer.",
  },
  {
    icon: MapPinned,
    title: "Район и будущие планы",
    text: "Проверяем транспорт, школы, парки, planned investments и факторы, которые могут улучшить или ухудшить локацию.",
  },
  {
    icon: ShieldCheck,
    title: "Риски покупки",
    text: "Выносим в отчет ликвидность, слабые данные, долгое время на рынке, шумовые/промышленные proxy и developer risk.",
  },
  {
    icon: WalletCards,
    title: "Бюджет решения",
    text: "Добавляем ипотечный платеж, total purchase cost, max offer и checklist перед zadatek.",
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
            Введите адрес или ссылку на объект, а Domarion соберет отчет по цене,
            рискам, району, будущей инфраструктуре и аргументам для торга.
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
          <strong>29-199 PLN</strong>
          <span>гипотеза цены за разовый отчет</span>
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
            Buyer report должен дать короткий вывод: нормальная ли цена, где риски,
            какой offer разумен и что проверить до задатка.
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
