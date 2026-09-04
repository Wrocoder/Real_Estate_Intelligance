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

import { BetaLeadForm } from "@/components/BetaLeadForm";
import { LandingMapScene } from "@/components/LandingMapScene";

export const metadata: Metadata = {
  title: "Аналитика и отчеты для риелторов | WartoMetr",
  description:
    "WartoMetr для риелторов: клиентские отчеты, сравнение объектов, аргументы по цене и районная аналитика для агентств.",
};

const realtorUseCases = [
  {
    icon: Presentation,
    title: "Отчет для клиента",
    text: "Готовьте клиентский PDF с ценой, похожими объектами, картой района, рисками и вопросами продавцу.",
  },
  {
    icon: BarChart3,
    title: "Аргументы по цене",
    text: "Показывайте рыночный диапазон, историю цены, дни на рынке и аргумент для торга без ручной сборки таблиц.",
  },
  {
    icon: Layers3,
    title: "Районная аналитика",
    text: "Сравнивайте районы, инфраструктуру, планируемые инвестиции и состояние рынка для презентации клиенту.",
  },
  {
    icon: UsersRound,
    title: "Команда агентства",
    text: "Рабочее пространство агентства, роли команды, брендирование и история отчетов для повторяемого процесса.",
  },
];

const packages = [
  "Отчет по квартире для клиента перед просмотром или предложением.",
  "Отчет по району для выбора локации и объяснения бюджета.",
  "Брендированный отчет риелтора с логотипом, цветами и оговорками.",
  "Подборка сильных вариантов для инвестора или активного покупателя.",
];

export default function RealtorsPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero realtor">
        <LandingMapScene variant="realtor" />
        <div className="landing-hero-shade" />
        <div className="landing-hero-content">
          <span className="landing-eyebrow">Agencies and solo agents</span>
          <h1>Аналитика и отчеты для риелторов</h1>
          <p>
            Быстро превращайте объект, район и историю цены в клиентский отчет:
            аргументы для торга, сравнение с рынком и понятный следующий шаг.
          </p>
          <div className="landing-cta-row">
            <Link className="button primary landing-button" href="/pricing?source=realtor-beta">
              <Handshake size={18} /> Подключить отчеты
            </Link>
            <Link className="button landing-button" href="/reports?source=realtor-beta">
              <FileText size={18} /> Открыть отчеты
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-proof-strip" aria-label="Realtor report details">
        <div>
          <strong>5 отчетов</strong>
          <span>пакет для первой клиентской проверки</span>
        </div>
        <div>
          <strong>White-label</strong>
          <span>логотип, цвета и оговорки агентства</span>
        </div>
        <div>
          <strong>Client-ready</strong>
          <span>PDF/HTML вместо ручных таблиц</span>
        </div>
        <div>
          <strong>Wrocław</strong>
          <span>фокус на рынке и районах города</span>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-eyebrow">Для чего агенту</span>
          <h2>Меньше ручной аналитики, больше доказательных разговоров</h2>
          <p>
            WartoMetr закрывает повторяемые вопросы клиента: цена, риски, район,
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
          <span className="landing-eyebrow">Пакеты отчетов</span>
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

      <BetaLeadForm segment="realtor_beta" entryPoint="/realtors" />

      <section className="landing-section landing-compliance">
        <div>
          <span className="landing-eyebrow">Доверие</span>
          <h2>Отчеты не подменяют эксперта, но дают сильную базу для клиента</h2>
        </div>
        <ul className="section-list">
          <li>
            <ShieldCheck size={16} />
            В отчетах есть оговорки и объяснения с привязкой к источникам.
          </li>
          <li>
            <Building2 size={16} />
            Блок репутации застройщика добавляется, если застройщик распознан.
          </li>
          <li>
            <BarChart3 size={16} />
            Экспорт CSV/JSON доступен на профессиональных планах.
          </li>
        </ul>
        <Link className="button primary landing-button" href="/pricing?source=realtor-beta-bottom">
          <ArrowRight size={18} /> Посмотреть отчеты
        </Link>
      </section>
    </div>
  );
}
