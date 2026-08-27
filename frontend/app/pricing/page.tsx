"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import { ErrorBlock, LoadingBlock } from "@/components/StateBlocks";
import {
  api,
  reportContentUrl,
  type AccountSummary,
  type PlanLimits,
  type ReportOrder,
  type ReportOrderBillingDetails,
  type ReportOrderEvent,
  type ReportProduct,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import { PRICING_PAGE_COPY, type Locale, type PricingPageCopy } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

export default function PricingPage() {
  const { locale } = useLocalePreference();
  const copy = PRICING_PAGE_COPY[locale];
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [products, setProducts] = useState<ReportProduct[]>([]);
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [events, setEvents] = useState<ReportOrderEvent[]>([]);
  const [listingId, setListingId] = useState("wr-001");
  const [areaId, setAreaId] = useState("wroclaw-fabryczna");
  const [billingForm, setBillingForm] = useState<BillingForm>({
    invoiceRequested: false,
    companyName: "Domarion Demo Sp. z o.o.",
    vatId: "PL1234567890",
    email: "billing@example.com",
    streetAddress: "Rynek 1",
    postalCode: "50-101",
    city: "Wrocław",
    countryCode: "PL",
  });
  const [status, setStatus] = useState(copy.statuses.loading);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
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
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }, [copy]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createAndPay(product: ReportProduct) {
    setError("");
    try {
      setStatus(copy.statuses.creatingOrder(product.title));
      const listingReference = reportOrderReference(product, listingId, areaId);
      const checkout = await api.createReportOrder({
        listing_id: listingReference,
        product_code: product.code,
        audience: product.audience,
        billing_details: billingPayload(billingForm),
      });
      setStatus(copy.statuses.checkout(checkout.provider, checkout.external_reference ?? checkout.order.id));

      const paid = await api.mockPayReportOrder(checkout.order.id);
      setStatus(copy.statuses.paid(paid.id));

      const fulfilled = await api.fulfillReportOrder(paid.id);
      setOrders((current) => [fulfilled, ...current.filter((order) => order.id !== fulfilled.id)]);
      setEvents(await api.listReportOrderEvents(fulfilled.id));
      setStatus(copy.statuses.reportReady(fulfilled.generated_report_id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.values.unknownError);
      setStatus(copy.statuses.backendUnavailable);
    }
  }

  async function loadEvents(orderId: string) {
    setEvents(await api.listReportOrderEvents(orderId));
    setStatus(copy.statuses.auditEvents(orderId));
  }

  function updateBilling(field: keyof Omit<BillingForm, "invoiceRequested">, value: string) {
    setBillingForm((current) => ({ ...current, [field]: value }));
  }

  const planByCode = useMemo(() => Object.fromEntries(plans.map((plan) => [plan.plan, plan])), [plans]);

  if (error) return <ErrorBlock message={error} prefix={copy.errorPrefix} />;
  if (!account || products.length === 0) return <LoadingBlock label={copy.empty.loading} />;

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
          <strong>{account.subscription.plan}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.subscriptionReports}</span>
          <strong>
            {account.usage.reports_this_month}/{account.limits.monthly_reports}
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
          <span className="muted">{copy.hints.mockCheckout}</span>
        </div>
        <div className="panel-body">
          <div className="pricing-reference-grid">
            <label className="field">
              <span>{copy.fields.listingId}</span>
              <input
                className="input"
                value={listingId}
                onChange={(event) => setListingId(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{copy.fields.areaId}</span>
              <input
                className="input"
                value={areaId}
                onChange={(event) => setAreaId(event.target.value)}
              />
            </label>
          </div>

          <div className="panel" style={{ marginTop: 14 }}>
            <div className="panel-header inline">
              <h3>{copy.sections.invoice}</h3>
              <ReceiptText size={18} />
            </div>
            <div className="panel-body">
              <label className="compare-toggle">
                <input
                  type="checkbox"
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
          </div>

          <div className="pricing-grid">
            {products.map((product) => (
              <article className="pricing-card" key={product.code}>
                <div className="pricing-card-header">
                  <div>
                    <strong>{product.title}</strong>
                    <span>{product.description}</span>
                  </div>
                  <b>{formatGrosz(product.amount_grosz, locale)}</b>
                </div>
                <ul className="section-list compact">
                  {product.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={14} /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void createAndPay(product)}
                >
                  <CreditCard size={16} /> {copy.actions.mockPayGenerate}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sections.orderHistory}</h2>
            <span className="muted">{copy.values.orders(orders.length)}</span>
          </div>
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  <th>{copy.table.order}</th>
                  <th>{copy.table.object}</th>
                  <th>{copy.table.status}</th>
                  <th>{copy.table.invoice}</th>
                  <th>{copy.table.report}</th>
                  <th>{copy.table.audit}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.product_code}</td>
                    <td>{order.listing_id}</td>
                    <td>{order.status}</td>
                    <td>
                      {order.billing_details?.invoice_requested ? (
                        <span className="status-pill">
                          <Building2 size={13} /> {order.billing_details.company_name}
                        </span>
                      ) : (
                        <span className="muted">{copy.values.noValue}</span>
                      )}
                    </td>
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
                    <td>
                      <button className="button" type="button" onClick={() => void loadEvents(order.id)}>
                        <Activity size={16} /> {copy.actions.events}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.sections.subscriptions}</h2>
            <FileText size={18} />
          </div>
          <div className="panel-body">
            <ul className="section-list">
              {Object.entries(planByCode).map(([plan, limits]) => (
                <li key={plan}>
                  <strong>{plan}</strong>: {planSummary(limits, locale, copy)}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.sections.auditTrail}</h2>
          <span className="muted">{copy.values.events(events.length)}</span>
        </div>
        <div className="panel-body">
          {events.length === 0 ? (
            <p className="muted">{copy.values.auditEmpty}</p>
          ) : (
            <ul className="section-list">
              {events.map((event) => (
                <li key={event.id}>
                  <Activity size={14} />
                  <strong>{event.event_type}</strong>
                  <span>{event.message ?? copy.values.eventFallback}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
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

function reportOrderReference(product: ReportProduct, listingId: string, areaId: string) {
  if (product.code === "area_report") return `area:${areaId}`;
  if (product.code === "report_bundle_5") return "bundle:reports-5";
  return listingId;
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
