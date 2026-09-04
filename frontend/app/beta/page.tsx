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
  title: "Проверка квартиры перед покупкой | WartoMetr",
  description:
    "WartoMetr помогает не переплатить за квартиру, увидеть риски и подготовиться к торгу перед задатком.",
};

const reportChecks = [
  {
    icon: TrendingUp,
    title: "Не переплатить",
    text: "Показываем рыночный диапазон, возможную переплату, стартовое предложение и максимальную разумную цену.",
  },
  {
    icon: MapPinned,
    title: "Район и будущие планы",
    text: "Проверяем транспорт, школы, парки, планируемые инвестиции и факторы, которые могут улучшить или ухудшить локацию.",
  },
  {
    icon: ShieldCheck,
    title: "Не купить проблему",
    text: "Показываем юридические и технические неизвестные, шум, промышленные зоны, слабые данные и вопросы до задатка.",
  },
  {
    icon: WalletCards,
    title: "Подготовиться к торгу",
    text: "Собираем вопросы продавцу, аргументы по цене, разумный предел и список проверки на просмотре.",
  },
];

const processSteps = [
  "Вставьте ссылку Otodom/OLX или заполните адрес, цену, площадь и комнаты вручную.",
  "Подтвердите извлеченные параметры: мы не сохраняем фото, контакты и полный текст объявления.",
  "Получите отчет покупателя: рыночный диапазон, риски, район, вопросы продавцу и решение, стоит ли идти дальше.",
];

export default function BuyerBetaPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <LandingMapScene variant="buyer" />
        <div className="landing-hero-shade" />
        <div className="landing-hero-content">
          <span className="landing-eyebrow">Wrocław i okolice</span>
          <h1>Проверка квартиры перед покупкой</h1>
          <p>
            Введите адрес или ссылку на объект, а WartoMetr ответит: покупать,
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

      <section className="landing-proof-strip" aria-label="WartoMetr buyer report details">
        <div>
          <strong>29-49 PLN</strong>
          <span>ориентир для полного отчета по квартире</span>
        </div>
        <div>
          <strong>15 минут</strong>
          <span>быстрая проверка найденной квартиры</span>
        </div>
        <div>
          <strong>0 фото</strong>
          <span>без копирования фото и контактов порталов</span>
        </div>
        <div>
          <strong>Wrocław+</strong>
          <span>Вроцлав и ближайшие окрестности</span>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-eyebrow">Что внутри отчета</span>
          <h2>Не еще одно объявление, а решение по объекту</h2>
          <p>
            Отчет покупателя должен быстро показать, где можно сэкономить, где квартира
            может стать проблемой и какие аргументы использовать до предложения.
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
          <span className="landing-eyebrow">Как это работает</span>
          <h2>От ссылки к отчету с прозрачным использованием данных</h2>
        </div>
        <ol className="landing-steps">
          {processSteps.map((step, index) => (
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
          <span className="landing-eyebrow">Данные и доверие</span>
          <h2>Минимум данных, максимум пользы для решения</h2>
        </div>
        <ul className="section-list">
          <li>
            <LockKeyhole size={16} />
            Ссылка на объявление хранится приватно и не показывается публично.
          </li>
          <li>
            <CheckCircle2 size={16} />
            Сравнение строится на базе WartoMetr, партнерских данных и открытых городских источниках.
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
