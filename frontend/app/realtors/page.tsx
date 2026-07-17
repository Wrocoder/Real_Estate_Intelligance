import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Handshake,
  Layers3,
  Presentation,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { LandingMapScene } from "@/components/LandingMapScene";

export const metadata: Metadata = {
  title: "Аналитика и отчеты для риелторов | Domarion Analytics",
  description:
    "Domarion для риелторов: branded reports, сравнение объектов, аргументы по цене, районная аналитика и paid beta для агентств.",
};

const realtorUseCases = [
  {
    icon: Presentation,
    title: "Отчет для клиента",
    text: "Готовьте buyer/realtor PDF с ценой, comparables, картой района, рисками и вопросами продавцу.",
  },
  {
    icon: BarChart3,
    title: "Аргументы по цене",
    text: "Показывайте fair price, price history, дни на рынке и negotiation anchor без ручной сборки таблиц.",
  },
  {
    icon: Layers3,
    title: "Районная аналитика",
    text: "Сравнивайте районы, инфраструктуру, planned investments и market snapshots для презентации клиенту.",
  },
  {
    icon: UsersRound,
    title: "Команда агентства",
    text: "Workspace, роли owner/admin/agent, white-label поля и история отчетов для повторяемого процесса.",
  },
];

const packages = [
  "Object report для клиента перед просмотром или offer.",
  "Area report для выбора района и объяснения бюджета.",
  "Realtor branded report с логотипом, цветами и disclaimer.",
  "Hidden gems shortlist для инвестора или активного покупателя.",
];

export default function RealtorsPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero realtor">
        <LandingMapScene variant="realtor" />
        <div className="landing-hero-shade" />
        <div className="landing-hero-content">
          <span className="landing-eyebrow">Paid beta · Agencies and solo agents</span>
          <h1>Аналитика и отчеты для риелторов</h1>
          <p>
            Быстро превращайте объект, район и историю цены в клиентский отчет:
            аргументы для торга, сравнение с рынком и понятный next step.
          </p>
          <div className="landing-cta-row">
            <Link className="button primary landing-button" href="/pricing?source=realtor-beta">
              <Handshake size={18} /> Запустить beta workflow
            </Link>
            <Link className="button landing-button" href="/reports?source=realtor-beta">
              <FileText size={18} /> Открыть отчеты
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-proof-strip" aria-label="Realtor beta metrics">
        <div>
          <strong>5 отчетов</strong>
          <span>пакет для первой клиентской проверки</span>
        </div>
        <div>
          <strong>White-label</strong>
          <span>логотип, цвета и агентский disclaimer</span>
        </div>
        <div>
          <strong>Client-ready</strong>
          <span>PDF/HTML вместо ручных таблиц</span>
        </div>
        <div>
          <strong>Wrocław</strong>
          <span>фокус на рынке и районах MVP</span>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-eyebrow">Для чего агенту</span>
          <h2>Меньше ручной аналитики, больше доказательных разговоров</h2>
          <p>
            Domarion закрывает повторяемые вопросы клиента: цена, риски, район,
            похожие объекты, торг и стоит ли продолжать переговоры.
          </p>
        </div>
        <div className="landing-card-grid">
          {realtorUseCases.map((item) => {
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
          <span className="landing-eyebrow">Paid beta offer</span>
          <h2>Что можно продавать или тестировать уже сейчас</h2>
        </div>
        <ul className="landing-offer-list">
          {packages.map((item) => (
            <li key={item}>
              <CheckCircle2 size={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section landing-compliance">
        <div>
          <span className="landing-eyebrow">Trust layer</span>
          <h2>Отчеты не подменяют эксперта, но дают сильную базу для клиента</h2>
        </div>
        <ul className="section-list">
          <li>
            <ShieldCheck size={16} />
            В отчетах есть disclaimers и source-grounded объяснения.
          </li>
          <li>
            <Building2 size={16} />
            Developer reputation block добавляется, если застройщик распознан.
          </li>
          <li>
            <BarChart3 size={16} />
            Экспорт CSV/JSON доступен на realtor/investor планах.
          </li>
        </ul>
        <Link className="button primary landing-button" href="/pricing?source=realtor-beta-bottom">
          <ArrowRight size={18} /> Посмотреть paid reports
        </Link>
      </section>
    </div>
  );
}
