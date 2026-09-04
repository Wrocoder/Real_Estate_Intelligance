"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import { AuthForm } from "@/components/AuthForm";
import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import { localizedError } from "@/lib/errorMessages";
import {
  ApiError,
  api,
  reportContentUrl,
  type AccountSummary,
  type PlanLimits,
  type ReportOrder,
  type ReportOrderBillingDetails,
  type ReportProduct,
  type SubscriptionPlan,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import { PRICING_PAGE_COPY, type Locale, type PricingPageCopy } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

type ReportContext = {
  listingReference: string;
  areaReference: string;
};

const BUYER_PLAN_CODES: SubscriptionPlan[] = ["free", "buyer_pro"];

const PRICING_PRODUCT_COPY: Record<
  Locale,
  Record<string, { title: string; description: string; features: string[]; cta: string }>
> = {
  en: {
    object_report: {
      title: "Full Property Report",
      description: "A decision report for one apartment: fair price, risks, negotiation and total purchase cost.",
      features: [
        "Buyer verdict and fair-price range",
        "Main risks, unknowns and viewing questions",
        "Negotiation range and evidence",
        "Printable report for your purchase file",
      ],
      cta: "Buy property report",
    },
    full_object_analysis: {
      title: "Complete Due Diligence",
      description: "A deeper apartment check before reservation or deposit.",
      features: [
        "Everything from Full Property Report",
        "Detailed due-diligence checklist",
        "Comparable alternatives and negotiation script",
        "Total cost with renovation context",
      ],
      cta: "Buy complete check",
    },
  },
  pl: {
    object_report: {
      title: "Pełny raport mieszkania",
      description: "Raport decyzyjny dla jednego mieszkania: uczciwa cena, ryzyka, negocjacje i całkowity koszt zakupu.",
      features: [
        "Werdykt kupującego i zakres uczciwej ceny",
        "Główne ryzyka, niewiadome i pytania na oglądanie",
        "Zakres negocjacji i uzasadnienie",
        "Raport do zapisania przed decyzją zakupową",
      ],
      cta: "Kup raport mieszkania",
    },
    full_object_analysis: {
      title: "Pełna analiza przed zakupem",
      description: "Głębsze sprawdzenie mieszkania przed rezerwacją albo zadatkiem.",
      features: [
        "Wszystko z pełnego raportu mieszkania",
        "Szczegółowa lista due diligence",
        "Podobne oferty i scenariusz negocjacji",
        "Całkowity koszt z kontekstem remontu",
      ],
      cta: "Kup pełną analizę",
    },
  },
  ru: {
    object_report: {
      title: "Полный отчет по квартире",
      description: "Отчет для решения по одной квартире: справедливая цена, риски, торг и полная стоимость покупки.",
      features: [
        "Вывод для покупателя и диапазон справедливой цены",
        "Главные риски, неизвестные факты и вопросы для просмотра",
        "Диапазон торга и обоснование",
        "Отчет, который можно сохранить перед решением о покупке",
      ],
      cta: "Купить отчет по квартире",
    },
    full_object_analysis: {
      title: "Полная проверка перед покупкой",
      description: "Более глубокая проверка квартиры перед резервированием или задатком.",
      features: [
        "Все из полного отчета по квартире",
        "Подробный список проверки документов и объекта",
        "Похожие варианты и сценарий переговоров",
        "Полная стоимость с учетом ремонта",
      ],
      cta: "Купить полную проверку",
    },
  },
  uk: {
    object_report: {
      title: "Повний звіт по квартирі",
      description: "Звіт для рішення по одній квартирі: справедлива ціна, ризики, торг і повна вартість купівлі.",
      features: [
        "Висновок для покупця і діапазон справедливої ціни",
        "Головні ризики, невідомі факти і питання для перегляду",
        "Діапазон торгу й обґрунтування",
        "Звіт, який можна зберегти перед рішенням про купівлю",
      ],
      cta: "Купити звіт по квартирі",
    },
    full_object_analysis: {
      title: "Повна перевірка перед купівлею",
      description: "Глибша перевірка квартири перед резервуванням або завдатком.",
      features: [
        "Усе з повного звіту по квартирі",
        "Детальний список перевірки документів і об'єкта",
        "Схожі варіанти і сценарій переговорів",
        "Повна вартість з урахуванням ремонту",
      ],
      cta: "Купити повну перевірку",
    },
  },
};

const PRICING_BUYER_COPY: Record<
  Locale,
  {
    buyerPro: string;
    buyerProDescription: string;
    included: string;
    currentPlan: string;
    upgrade: string;
    startWithCheck: string;
    contextReady: string;
    receiptDetails: string;
    boundaryTitle: string;
    boundaryDescription: string;
    matrix: {
      feature: string;
      monthlyReports: string;
      alerts: string;
      compare: string;
      exports: string;
    };
    noOrders: string;
    monthlyReports: (count: string) => string;
    trackedSearches: (count: string) => string;
  }
> = {
  en: {
    buyerPro: "Buyer Pro",
    buyerProDescription: "For an active apartment search: more checks, tracking and comparisons in one month.",
    included: "Included",
    currentPlan: "Current plan",
    upgrade: "Upgrade from account",
    startWithCheck: "Start with an apartment check",
    contextReady: "Report will be attached to the selected apartment.",
    receiptDetails: "Receipt details",
    boundaryTitle: "What is free and what is paid",
    boundaryDescription: "The free plan covers monthly checks. A one-time report is a separate purchase and becomes available only after the payment provider confirms it.",
    matrix: { feature: "Feature", monthlyReports: "Monthly reports", alerts: "Tracked searches", compare: "Apartments in compare", exports: "Report export" },
    noOrders: "Purchased reports will appear here.",
    monthlyReports: (count) => `${count} reports each month`,
    trackedSearches: (count) => `${count} tracked searches`,
  },
  pl: {
    buyerPro: "Buyer Pro",
    buyerProDescription: "Dla aktywnego szukania mieszkania: więcej sprawdzeń, śledzenie i porównania w jednym miesiącu.",
    included: "W cenie",
    currentPlan: "Aktualny plan",
    upgrade: "Zmień w koncie",
    startWithCheck: "Zacznij od sprawdzenia mieszkania",
    contextReady: "Raport będzie przypisany do wybranego mieszkania.",
    receiptDetails: "Dane do rachunku",
    boundaryTitle: "Co jest bezpłatne, a co płatne",
    boundaryDescription: "Plan darmowy obejmuje miesięczne sprawdzenia. Raport jednorazowy jest osobnym zakupem i pojawi się dopiero po potwierdzeniu płatności przez operatora.",
    matrix: { feature: "Funkcja", monthlyReports: "Raporty miesięcznie", alerts: "Śledzone wyszukiwania", compare: "Mieszkania w porównaniu", exports: "Eksport raportu" },
    noOrders: "Kupione raporty pojawią się tutaj.",
    monthlyReports: (count) => `${count} raportów miesięcznie`,
    trackedSearches: (count) => `${count} śledzonych wyszukiwań`,
  },
  ru: {
    buyerPro: "Buyer Pro",
    buyerProDescription: "Для активного поиска квартиры: больше проверок, отслеживание и сравнения в течение месяца.",
    included: "Включено",
    currentPlan: "Текущий тариф",
    upgrade: "Изменить в аккаунте",
    startWithCheck: "Начните с проверки квартиры",
    contextReady: "Отчет будет привязан к выбранной квартире.",
    receiptDetails: "Данные для счета",
    boundaryTitle: "Что бесплатно, а что платно",
    boundaryDescription: "Бесплатный тариф включает проверки в течение месяца. Разовый отчет покупается отдельно и появится только после подтверждения оплаты оператором.",
    matrix: { feature: "Функция", monthlyReports: "Отчеты в месяц", alerts: "Отслеживаемые поиски", compare: "Квартиры в сравнении", exports: "Экспорт отчета" },
    noOrders: "Купленные отчеты появятся здесь.",
    monthlyReports: (count) => `${count} отчетов в месяц`,
    trackedSearches: (count) => `${count} отслеживаемых поисков`,
  },
  uk: {
    buyerPro: "Buyer Pro",
    buyerProDescription: "Для активного пошуку квартири: більше перевірок, стеження і порівняння протягом місяця.",
    included: "Включено",
    currentPlan: "Поточний тариф",
    upgrade: "Змінити в акаунті",
    startWithCheck: "Почніть із перевірки квартири",
    contextReady: "Звіт буде прив'язаний до вибраної квартири.",
    receiptDetails: "Дані для рахунку",
    boundaryTitle: "Що безкоштовно, а що платно",
    boundaryDescription: "Безкоштовний тариф включає перевірки протягом місяця. Разовий звіт купується окремо й стане доступним лише після підтвердження оплати оператором.",
    matrix: { feature: "Функція", monthlyReports: "Звіти на місяць", alerts: "Відстежувані пошуки", compare: "Квартири в порівнянні", exports: "Експорт звіту" },
    noOrders: "Куплені звіти з'являться тут.",
    monthlyReports: (count) => `${count} звітів на місяць`,
    trackedSearches: (count) => `${count} відстежуваних пошуків`,
  },
};

const PRICING_LOADING_STEPS: Record<Locale, string[]> = {
  en: ["Checking your plan", "Loading report options", "Preparing purchase history"],
  pl: ["Sprawdzamy Twój plan", "Ładujemy opcje raportów", "Przygotowujemy historię zakupów"],
  ru: ["Проверяем ваш тариф", "Загружаем варианты отчетов", "Готовим историю покупок"],
  uk: ["Перевіряємо ваш тариф", "Завантажуємо варіанти звітів", "Готуємо історію покупок"],
};

export default function PricingPage() {
  const { locale } = useLocalePreference();
  const copy = PRICING_PAGE_COPY[locale];
  const buyerCopy = PRICING_BUYER_COPY[locale];
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [products, setProducts] = useState<ReportProduct[]>([]);
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [creatingProductCode, setCreatingProductCode] = useState<string | null>(null);
  const [reportContext, setReportContext] = useState<ReportContext>({
    listingReference: "",
    areaReference: "",
  });
  const [billingForm, setBillingForm] = useState<BillingForm>({
    invoiceRequested: false,
    companyName: "",
    vatId: "",
    email: "",
    streetAddress: "",
    postalCode: "",
    city: "Wrocław",
    countryCode: "PL",
  });
  const [status, setStatus] = useState(copy.statuses.loading);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setAuthRequired(false);
    setStatus(copy.statuses.loading);
    try {
      const [accountData, planData, productData, orderData] = await Promise.all([
        api.getMe(),
        api.listPlans(),
        api.listReportProducts(),
        api.listReportOrders(),
      ]);
      setAccount(accountData);
      setPlans(planData);
      setProducts(productData);
      setOrders(orderData);
      setStatus(copy.statuses.ready);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setAuthRequired(true);
        setStatus("");
      } else {
        setError(localizedError(caught, locale, copy.values.unknownError));
        setStatus(copy.statuses.backendUnavailable);
      }
    }
  }, [copy, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReportContext({
      listingReference: params.get("listing") ?? params.get("listing_id") ?? "",
      areaReference: params.get("area") ?? params.get("area_id") ?? "",
    });
  }, []);

  async function createAndPay(product: ReportProduct) {
    if (creatingProductCode !== null) return;
    setError("");
    setCreatingProductCode(product.code);
    try {
      const listingReference = reportOrderReference(product, reportContext);
      if (!listingReference) {
        setStatus(copy.statuses.contextNeeded);
        return;
      }
      setStatus(copy.statuses.creatingOrder(pricingProductCopy(product, locale).title));
      const checkout = await api.createReportOrder({
        listing_id: listingReference,
        product_code: product.code,
        audience: product.audience,
        billing_details: billingPayload(billingForm),
      });
      setOrders((current) => [
        checkout.order,
        ...current.filter((order) => order.id !== checkout.order.id),
      ]);
      setStatus(copy.statuses.checkout(checkout.provider, checkout.external_reference ?? checkout.order.id));
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setAuthRequired(true);
        setStatus("");
      } else {
        setError(localizedError(caught, locale, copy.values.unknownError));
        setStatus(copy.statuses.backendUnavailable);
      }
    } finally {
      setCreatingProductCode(null);
    }
  }

  function updateBilling(field: keyof Omit<BillingForm, "invoiceRequested">, value: string) {
    setBillingForm((current) => ({ ...current, [field]: value }));
  }

  const buyerProducts = products.filter((product) => product.audience === "buyer");
  const buyerPlans = plans.filter((plan) => BUYER_PLAN_CODES.includes(plan.plan));
  const buyerProPlan = plans.find((plan) => plan.plan === "buyer_pro");

  if (authRequired) return <AuthForm onAuthenticated={load} />;
  if (error) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (!account || products.length === 0) {
    return <LoadingBlock label={copy.empty.loading} steps={PRICING_LOADING_STEPS[locale]} />;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <button className="button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} /> {copy.actions.refresh}
        </button>
      </header>

      <section className="metric-grid">
        <div className="metric">
          <span>{copy.metrics.currentPlan}</span>
          <strong>{planLabel(account.subscription.plan, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.subscriptionReports}</span>
          <strong>
            {numberValue(account.usage.reports_this_month, locale)}/
            {numberValue(account.limits.monthly_reports, locale)}
          </strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.oneTimeOrders}</span>
          <strong>{numberValue(orders.length, locale)}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.status}</span>
          <strong>{status}</strong>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.sections.oneTimeReport}</h2>
          <span className="muted">{copy.hints.reportContext}</span>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <strong>{contextHint(reportContext, copy, buyerCopy)}</strong>
            {!reportContext.listingReference && !reportContext.areaReference ? (
              <div className="button-row" style={{ marginTop: 12 }}>
                <Link className="button primary" href="/check">
                  <FileText size={16} /> {buyerCopy.startWithCheck}
                </Link>
                <Link className="button" href="/areas">
                  <Building2 size={16} /> {copy.actions.chooseArea}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="pricing-grid">
            {buyerProducts.map((product) => {
              const productCopy = pricingProductCopy(product, locale);
              return (
              <article className="pricing-card" key={product.code}>
                <div className="pricing-card-header">
                  <div>
                    <strong>{productCopy.title}</strong>
                    <span>{productCopy.description}</span>
                  </div>
                  <b>{formatGrosz(product.amount_grosz, locale)}</b>
                </div>
                <ul className="section-list compact">
                  {productCopy.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={14} /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className="button primary"
                  type="button"
                  disabled={!canBuyProduct(product, reportContext) || creatingProductCode !== null}
                  onClick={() => void createAndPay(product)}
                >
                  <CreditCard size={16} /> {creatingProductCode === product.code ? copy.statuses.creatingOrder(productCopy.title) : productCopy.cta}
                </button>
              </article>
            );
            })}
          </div>

          <details className="pricing-receipt-details">
            <summary>
              <ReceiptText size={16} />
              {buyerCopy.receiptDetails}
            </summary>
            <div className="panel-body">
              <label className="compare-toggle">
                <input
                  type="checkbox"
                  aria-label={copy.fields.b2bInvoice}
                  checked={billingForm.invoiceRequested}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      invoiceRequested: event.target.checked,
                    }))
                  }
                />
                <span>{copy.fields.b2bInvoice}</span>
              </label>
              {billingForm.invoiceRequested ? (
                <div className="form-grid compact" style={{ marginTop: 12 }}>
                  <BillingInput
                    label={copy.fields.company}
                    value={billingForm.companyName}
                    onChange={(value) => updateBilling("companyName", value)}
                  />
                  <BillingInput
                    label={copy.fields.vat}
                    value={billingForm.vatId}
                    onChange={(value) => updateBilling("vatId", value)}
                  />
                  <BillingInput
                    label={copy.fields.email}
                    value={billingForm.email}
                    onChange={(value) => updateBilling("email", value)}
                  />
                  <BillingInput
                    label={copy.fields.address}
                    value={billingForm.streetAddress}
                    onChange={(value) => updateBilling("streetAddress", value)}
                  />
                  <BillingInput
                    label={copy.fields.postalCode}
                    value={billingForm.postalCode}
                    onChange={(value) => updateBilling("postalCode", value)}
                  />
                  <BillingInput
                    label={copy.fields.city}
                    value={billingForm.city}
                    onChange={(value) => updateBilling("city", value)}
                  />
                  <BillingInput
                    label={copy.fields.country}
                    value={billingForm.countryCode}
                    onChange={(value) => updateBilling("countryCode", value)}
                  />
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </section>

      {buyerPlans.length > 0 ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>{buyerCopy.boundaryTitle}</h2>
          </div>
          <div className="panel-body">
            <p className="muted">{buyerCopy.boundaryDescription}</p>
            <div className="table-scroll">
              <table className="table pricing-matrix">
                <thead>
                  <tr>
                    <th>{buyerCopy.matrix.feature}</th>
                    {buyerPlans.map((plan) => <th key={plan.plan}>{planLabel(plan.plan, locale)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <PricingMatrixRow label={buyerCopy.matrix.monthlyReports} plans={buyerPlans} value={(plan) => numberValue(plan.monthly_reports, locale)} />
                  <PricingMatrixRow label={buyerCopy.matrix.alerts} plans={buyerPlans} value={(plan) => numberValue(plan.max_alerts, locale)} />
                  <PricingMatrixRow label={buyerCopy.matrix.compare} plans={buyerPlans} value={(plan) => numberValue(plan.max_compare_items, locale)} />
                  <PricingMatrixRow label={buyerCopy.matrix.exports} plans={buyerPlans} value={(plan) => plan.can_export ? "✓" : "—"} />
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sections.orderHistory}</h2>
            <span className="muted">{copy.values.orders(orders.length)}</span>
          </div>
          <div className="panel-body">
            {orders.length === 0 ? (
              <p className="empty-state">{buyerCopy.noOrders}</p>
            ) : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{copy.table.order}</th>
                      <th>{copy.table.object}</th>
                      <th>{copy.table.status}</th>
                      <th>{copy.table.report}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{productTitle(order.product_code, products, locale)}</td>
                        <td>{orderSubject(order.listing_id, locale)}</td>
                        <td>{orderStatus(order.status, locale)}</td>
                        <td>
                          {order.generated_report_id ? (
                            <a
                              className="button"
                              href={reportContentUrl(order.generated_report_id)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink size={16} /> {copy.actions.open}
                            </a>
                          ) : (
                            <span className="muted">{copy.values.noValue}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.subscriptions}</h2>
            <FileText size={18} />
          </div>
          <div className="panel-body">
            {buyerProPlan ? (
              <article className="buyer-pro-card">
                <div>
                  <span className="score-pill">{buyerCopy.included}</span>
                  <h3>{buyerCopy.buyerPro}</h3>
                  <p className="muted">{buyerCopy.buyerProDescription}</p>
                </div>
                <ul className="section-list compact">
                  <li>
                    <CheckCircle2 size={14} />
                    {buyerCopy.monthlyReports(numberValue(buyerProPlan.monthly_reports, locale))}
                  </li>
                  <li>
                    <CheckCircle2 size={14} />
                    {buyerCopy.trackedSearches(numberValue(buyerProPlan.max_alerts, locale))}
                  </li>
                  <li>
                    <CheckCircle2 size={14} />
                    {copy.values.planSummary(
                      numberValue(buyerProPlan.monthly_reports, locale),
                      numberValue(buyerProPlan.max_alerts, locale),
                      copy.values.standard,
                    )}
                  </li>
                </ul>
                <Link className="button" href="/account">
                  {account.subscription.plan === "buyer_pro"
                    ? buyerCopy.currentPlan
                    : buyerCopy.upgrade}
                </Link>
              </article>
            ) : (
              <ul className="section-list">
                {buyerPlans.map((plan) => (
                  <li key={plan.plan}>
                    <strong>{planLabel(plan.plan, locale)}</strong>: {planSummary(plan, locale, copy)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function PricingMatrixRow({
  label,
  plans,
  value,
}: {
  label: string;
  plans: PlanLimits[];
  value: (plan: PlanLimits) => string;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {plans.map((plan) => <td key={plan.plan}>{value(plan)}</td>)}
    </tr>
  );
}

type BillingForm = {
  invoiceRequested: boolean;
  companyName: string;
  vatId: string;
  email: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  countryCode: string;
};

function billingPayload(form: BillingForm): ReportOrderBillingDetails | null {
  if (!form.invoiceRequested) return null;
  return {
    invoice_requested: true,
    customer_type: "company",
    company_name: form.companyName,
    vat_id: form.vatId,
    email: form.email,
    street_address: form.streetAddress,
    postal_code: form.postalCode,
    city: form.city,
    country_code: form.countryCode,
  };
}

function formatGrosz(value: number, locale: Locale) {
  return money(value / 100, locale);
}

function reportOrderReference(product: ReportProduct, context: ReportContext) {
  if (product.code === "area_report") {
    return context.areaReference ? `area:${context.areaReference}` : null;
  }
  if (product.code === "report_bundle_5") return "bundle:reports-5";
  return context.listingReference || null;
}

function canBuyProduct(product: ReportProduct, context: ReportContext) {
  return reportOrderReference(product, context) !== null;
}

function contextHint(
  context: ReportContext,
  copy: PricingPageCopy,
  buyerCopy: (typeof PRICING_BUYER_COPY)[Locale],
) {
  if (context.listingReference) return buyerCopy.contextReady;
  if (context.areaReference) return copy.hints.areaContext;
  return copy.hints.contextMissing;
}

function orderSubject(reference: string, locale: Locale) {
  if (reference.startsWith("area:")) {
    return {
      en: "Area report",
      pl: "Raport dzielnicy",
      ru: "Отчет по району",
      uk: "Звіт по району",
    }[locale];
  }
  if (reference.startsWith("bundle:")) {
    return {
      en: "Report bundle",
      pl: "Pakiet raportów",
      ru: "Пакет отчетов",
      uk: "Пакет звітів",
    }[locale];
  }
  return {
    en: "Apartment report",
    pl: "Raport mieszkania",
    ru: "Отчет по квартире",
    uk: "Звіт по квартирі",
  }[locale];
}

function pricingProductCopy(product: ReportProduct, locale: Locale) {
  return (
    PRICING_PRODUCT_COPY[locale][product.code] ?? {
      title: product.title,
      description: product.description,
      features: product.features,
      cta: PRICING_PAGE_COPY[locale].actions.buyReport,
    }
  );
}

function productTitle(productCode: string, products: ReportProduct[], locale: Locale) {
  const product = products.find((item) => item.code === productCode);
  return product ? pricingProductCopy(product, locale).title : productCode;
}

function planLabel(plan: SubscriptionPlan, locale: Locale) {
  const labels: Record<Locale, Partial<Record<SubscriptionPlan, string>>> = {
    en: {
      free: "Free",
      buyer_pro: "Buyer Pro",
      investor: "Investor",
      realtor: "Realtor",
      agency: "Agency",
      enterprise: "Enterprise",
    },
    pl: {
      free: "Darmowy",
      buyer_pro: "Buyer Pro",
      investor: "Inwestor",
      realtor: "Pośrednik",
      agency: "Agencja",
      enterprise: "Enterprise",
    },
    ru: {
      free: "Бесплатный",
      buyer_pro: "Buyer Pro",
      investor: "Инвестор",
      realtor: "Риелтор",
      agency: "Агентство",
      enterprise: "Enterprise",
    },
    uk: {
      free: "Безплатний",
      buyer_pro: "Buyer Pro",
      investor: "Інвестор",
      realtor: "Ріелтор",
      agency: "Агентство",
      enterprise: "Enterprise",
    },
  };
  return labels[locale][plan] ?? plan;
}

function orderStatus(status: string, locale: Locale) {
  const labels: Record<Locale, Record<string, string>> = {
    en: {
      pending: "Waiting for payment",
      paid: "Paid",
      fulfilled: "Report ready",
      failed: "Failed",
      cancelled: "Cancelled",
    },
    pl: {
      pending: "Oczekuje na płatność",
      paid: "Opłacone",
      fulfilled: "Raport gotowy",
      failed: "Nieudane",
      cancelled: "Anulowane",
    },
    ru: {
      pending: "Ожидает оплаты",
      paid: "Оплачено",
      fulfilled: "Отчет готов",
      failed: "Ошибка",
      cancelled: "Отменено",
    },
    uk: {
      pending: "Очікує оплати",
      paid: "Оплачено",
      fulfilled: "Звіт готовий",
      failed: "Помилка",
      cancelled: "Скасовано",
    },
  };
  return labels[locale][status] ?? status;
}

function BillingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function planSummary(limits: PlanLimits, locale: Locale, copy: PricingPageCopy) {
  return copy.values.planSummary(
    numberValue(limits.monthly_reports, locale),
    numberValue(limits.max_alerts, locale),
    limits.can_white_label ? copy.values.whiteLabel : copy.values.standard,
  );
}
