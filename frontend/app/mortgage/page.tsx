"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, RefreshCw, Send } from "lucide-react";

import { ErrorBlock } from "@/components/StateBlocks";
import {
  api,
  type MortgageCalculationResult,
  type PartnerReferral,
  type PartnerReferralType,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";

type MortgageFormState = {
  property_price_pln: string;
  down_payment_pln: string;
  loan_years: string;
  annual_interest_rate_pct: string;
  rate_type: "fixed" | "variable";
  market_type: "primary" | "secondary";
  monthly_income_pln: string;
  monthly_existing_debt_pln: string;
  monthly_housing_costs_pln: string;
  insurance_monthly_pln: string;
  notary_fee_pln: string;
  court_fees_pln: string;
  bank_commission_pct: string;
  agent_commission_pct: string;
  renovation_budget_pln: string;
  include_pcc: boolean;
};

type ReferralFormState = {
  referral_type: PartnerReferralType;
  city: string;
  district: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  message: string;
  consent_to_contact: boolean;
};

const DEFAULT_FORM: MortgageFormState = {
  property_price_pln: "800000",
  down_payment_pln: "160000",
  loan_years: "25",
  annual_interest_rate_pct: "7.5",
  rate_type: "variable",
  market_type: "secondary",
  monthly_income_pln: "13000",
  monthly_existing_debt_pln: "0",
  monthly_housing_costs_pln: "700",
  insurance_monthly_pln: "120",
  notary_fee_pln: "5000",
  court_fees_pln: "400",
  bank_commission_pct: "0",
  agent_commission_pct: "0",
  renovation_budget_pln: "30000",
  include_pcc: true,
};

const DEFAULT_REFERRAL_FORM: ReferralFormState = {
  referral_type: "mortgage",
  city: "Wrocław",
  district: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  message: "Chcę porozmawiać o finansowaniu i kosztach tej transakcji.",
  consent_to_contact: false,
};

export default function MortgagePage() {
  const [form, setForm] = useState<MortgageFormState>(DEFAULT_FORM);
  const [referralForm, setReferralForm] =
    useState<ReferralFormState>(DEFAULT_REFERRAL_FORM);
  const [result, setResult] = useState<MortgageCalculationResult | null>(null);
  const [referralResult, setReferralResult] = useState<PartnerReferral | null>(null);
  const [status, setStatus] = useState("Готово к расчету");
  const [referralStatus, setReferralStatus] = useState("Заявка не отправлена");
  const [error, setError] = useState("");
  const [referralError, setReferralError] = useState("");

  const affordabilityLabel = useMemo(() => {
    if (!result) return "—";
    return {
      unknown: "нет дохода",
      comfortable: "комфортно",
      stretched: "на границе",
      high_risk: "высокий риск",
    }[result.affordability.status];
  }, [result]);

  async function calculate() {
    setError("");
    setStatus("Расчет...");
    try {
      const payload = await api.calculateMortgage({
        property_price_pln: toNumber(form.property_price_pln),
        down_payment_pln: toNumber(form.down_payment_pln),
        loan_years: toNumber(form.loan_years),
        annual_interest_rate_pct: toNumber(form.annual_interest_rate_pct),
        rate_type: form.rate_type,
        market_type: form.market_type,
        monthly_income_pln: toOptionalNumber(form.monthly_income_pln),
        monthly_existing_debt_pln: toNumber(form.monthly_existing_debt_pln),
        monthly_housing_costs_pln: toNumber(form.monthly_housing_costs_pln),
        insurance_monthly_pln: toNumber(form.insurance_monthly_pln),
        notary_fee_pln: toNumber(form.notary_fee_pln),
        court_fees_pln: toNumber(form.court_fees_pln),
        bank_commission_pct: toNumber(form.bank_commission_pct),
        agent_commission_pct: toNumber(form.agent_commission_pct),
        renovation_budget_pln: toNumber(form.renovation_budget_pln),
        include_pcc: form.include_pcc,
      });
      setResult(payload);
      setStatus("Расчет готов");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Ошибка расчета");
    }
  }

  useEffect(() => {
    void calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField<K extends keyof MortgageFormState>(key: K, value: MortgageFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateReferralField<K extends keyof ReferralFormState>(
    key: K,
    value: ReferralFormState[K],
  ) {
    setReferralForm((current) => ({ ...current, [key]: value }));
  }

  async function submitPartnerReferral() {
    setReferralError("");
    setReferralStatus("Отправка заявки...");
    try {
      const referral = await api.createPartnerReferral({
        referral_type: referralForm.referral_type,
        source_context: "mortgage_calculator",
        city: referralForm.city.trim() || "Wrocław",
        district: toOptionalText(referralForm.district),
        contact_name: toOptionalText(referralForm.contact_name),
        contact_email: toOptionalText(referralForm.contact_email),
        contact_phone: toOptionalText(referralForm.contact_phone),
        message: toOptionalText(referralForm.message),
        consent_to_contact: referralForm.consent_to_contact,
        metadata: {
          property_price_pln: toNumber(form.property_price_pln),
          down_payment_pln: toNumber(form.down_payment_pln),
          loan_years: toNumber(form.loan_years),
          annual_interest_rate_pct: toNumber(form.annual_interest_rate_pct),
          market_type: form.market_type,
          monthly_total_payment_pln: result?.base_scenario.monthly_total_payment_pln ?? null,
          upfront_cash_needed_pln: result?.costs.upfront_cash_needed_pln ?? null,
          affordability_status: result?.affordability.status ?? null,
        },
      });
      setReferralResult(referral);
      setReferralStatus(`Заявка создана: ${referral.id}`);
    } catch (caught) {
      setReferralError(caught instanceof Error ? caught.message : "unknown error");
      setReferralStatus("Ошибка отправки заявки");
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Ипотечный калькулятор</h1>
          <p>Первичный бюджет покупки: взнос, кредит, PCC, комиссии, ремонт и нагрузка на доход.</p>
        </div>
        <button className="button primary" type="button" onClick={() => void calculate()}>
          <Calculator size={16} /> Рассчитать
        </button>
      </header>

      {error ? <ErrorBlock message={error} /> : null}

      <section className="metric-grid">
        <div className="metric">
          <span>Нужные cash upfront</span>
          <strong>{result ? money(result.costs.upfront_cash_needed_pln) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Сумма кредита</span>
          <strong>{result ? money(result.costs.loan_amount_pln) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Платеж в месяц</span>
          <strong>{result ? money(result.base_scenario.monthly_total_payment_pln) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Доступность</span>
          <strong>{affordabilityLabel}</strong>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="panel-header">
            <h2>Параметры сделки</h2>
            <button className="button" type="button" onClick={() => void calculate()}>
              <RefreshCw size={16} /> Обновить
            </button>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <NumberField
                label="Цена объекта"
                value={form.property_price_pln}
                onChange={(value) => updateField("property_price_pln", value)}
              />
              <NumberField
                label="Собственный взнос"
                value={form.down_payment_pln}
                onChange={(value) => updateField("down_payment_pln", value)}
              />
              <NumberField
                label="Срок, лет"
                value={form.loan_years}
                onChange={(value) => updateField("loan_years", value)}
              />
              <NumberField
                label="Ставка, %"
                value={form.annual_interest_rate_pct}
                step="0.1"
                onChange={(value) => updateField("annual_interest_rate_pct", value)}
              />
              <label className="field">
                <span>Тип ставки</span>
                <select
                  className="select"
                  value={form.rate_type}
                  onChange={(event) =>
                    updateField("rate_type", event.target.value as MortgageFormState["rate_type"])
                  }
                >
                  <option value="fixed">fixed</option>
                  <option value="variable">variable</option>
                </select>
              </label>
              <label className="field">
                <span>Рынок</span>
                <select
                  className="select"
                  value={form.market_type}
                  onChange={(event) =>
                    updateField(
                      "market_type",
                      event.target.value as MortgageFormState["market_type"],
                    )
                  }
                >
                  <option value="secondary">secondary</option>
                  <option value="primary">primary</option>
                </select>
              </label>
            </div>

            <div className="form-grid" style={{ marginTop: 12 }}>
              <NumberField
                label="Доход netto/мес."
                value={form.monthly_income_pln}
                onChange={(value) => updateField("monthly_income_pln", value)}
              />
              <NumberField
                label="Другие долги/мес."
                value={form.monthly_existing_debt_pln}
                onChange={(value) => updateField("monthly_existing_debt_pln", value)}
              />
              <NumberField
                label="Czynsz/расходы"
                value={form.monthly_housing_costs_pln}
                onChange={(value) => updateField("monthly_housing_costs_pln", value)}
              />
              <NumberField
                label="Страховка/мес."
                value={form.insurance_monthly_pln}
                onChange={(value) => updateField("insurance_monthly_pln", value)}
              />
              <NumberField
                label="Нотариус"
                value={form.notary_fee_pln}
                onChange={(value) => updateField("notary_fee_pln", value)}
              />
              <NumberField
                label="Судовые сборы"
                value={form.court_fees_pln}
                onChange={(value) => updateField("court_fees_pln", value)}
              />
              <NumberField
                label="Комиссия банка, %"
                value={form.bank_commission_pct}
                step="0.1"
                onChange={(value) => updateField("bank_commission_pct", value)}
              />
              <NumberField
                label="Комиссия агента, %"
                value={form.agent_commission_pct}
                step="0.1"
                onChange={(value) => updateField("agent_commission_pct", value)}
              />
              <NumberField
                label="Ремонт/мебель"
                value={form.renovation_budget_pln}
                onChange={(value) => updateField("renovation_budget_pln", value)}
              />
            </div>

            <label className="field" style={{ marginTop: 12 }}>
              <span>PCC 2%</span>
              <select
                className="select"
                value={form.include_pcc ? "yes" : "no"}
                onChange={(event) => updateField("include_pcc", event.target.value === "yes")}
              >
                <option value="yes">учитывать</option>
                <option value="no">не учитывать</option>
              </select>
            </label>
            <p className="status-line">{status}</p>
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2>Вывод</h2>
          </div>
          <div className="panel-body">
            {result ? (
              <>
                <ul className="section-list compact">
                  <li>
                    <span>Down payment</span>
                    <strong>{formatPlainPct(result.costs.down_payment_pct)}</strong>
                  </li>
                  <li>
                    <span>LTV</span>
                    <strong>{formatPlainPct(result.costs.loan_to_value_pct)}</strong>
                  </li>
                  <li>
                    <span>DTI</span>
                    <strong>{formatNullablePct(result.affordability.base_debt_to_income_pct)}</strong>
                  </li>
                  <li>
                    <span>Буфер после платежа</span>
                    <strong>
                      {formatNullableMoney(result.affordability.monthly_buffer_after_payment_pln)}
                    </strong>
                  </li>
                </ul>
                <ul className="section-list" style={{ marginTop: 12 }}>
                  {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {result.disclaimer}
                </p>
              </>
            ) : (
              <div className="empty-state">Введите параметры и запустите расчет.</div>
            )}
          </div>
        </aside>
      </section>

      {result ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>Сценарии ставки</h2>
          </div>
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Сценарий</th>
                  <th>Ставка</th>
                  <th>Платеж</th>
                  <th>DTI</th>
                  <th>Переплата</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((scenario) => (
                  <tr key={scenario.scenario_code}>
                    <td>{scenario.label}</td>
                    <td>{formatPlainPct(scenario.annual_interest_rate_pct)}</td>
                    <td>{money(scenario.monthly_total_payment_pln)}</td>
                    <td>{formatNullablePct(scenario.debt_to_income_pct)}</td>
                    <td>{money(scenario.total_interest_pln)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>Cash breakdown</h2>
          </div>
          <div className="panel-body">
            <div className="metric-grid">
              <CostMetric label="PCC" value={result.costs.pcc_tax_pln} />
              <CostMetric label="Нотариус" value={result.costs.notary_fee_pln} />
              <CostMetric label="Сборы суда" value={result.costs.court_fees_pln} />
              <CostMetric label="Комиссия банка" value={result.costs.bank_commission_pln} />
              <CostMetric label="Комиссия агента" value={result.costs.agent_commission_pln} />
              <CostMetric label="Ремонт" value={result.costs.renovation_budget_pln} />
              <div className="metric">
                <span>Всего cash</span>
                <strong>{money(result.costs.upfront_cash_needed_pln)}</strong>
              </div>
              <div className="metric">
                <span>Кредит</span>
                <strong>{money(result.costs.loan_amount_pln)}</strong>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Заявка партнеру</h2>
          <span className="status-line">{referralStatus}</span>
        </div>
        <div className="panel-body">
          {referralError ? <ErrorBlock message={referralError} /> : null}
          <div className="form-grid">
            <label className="field">
              <span>Направление</span>
              <select
                className="select"
                value={referralForm.referral_type}
                onChange={(event) =>
                  updateReferralField(
                    "referral_type",
                    event.target.value as PartnerReferralType,
                  )
                }
              >
                <option value="mortgage">Mortgage</option>
                <option value="legal">Legal</option>
                <option value="renovation">Renovation</option>
              </select>
            </label>
            <ReferralField
              label="City"
              value={referralForm.city}
              onChange={(value) => updateReferralField("city", value)}
            />
            <ReferralField
              label="District"
              value={referralForm.district}
              onChange={(value) => updateReferralField("district", value)}
            />
            <ReferralField
              label="Name"
              value={referralForm.contact_name}
              onChange={(value) => updateReferralField("contact_name", value)}
            />
            <ReferralField
              label="Email"
              value={referralForm.contact_email}
              onChange={(value) => updateReferralField("contact_email", value)}
            />
            <ReferralField
              label="Phone"
              value={referralForm.contact_phone}
              onChange={(value) => updateReferralField("contact_phone", value)}
            />
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>Message</span>
            <textarea
              className="textarea"
              value={referralForm.message}
              onChange={(event) => updateReferralField("message", event.target.value)}
            />
          </label>
          <div className="toolbar" style={{ marginTop: 12 }}>
            <label className="compare-toggle">
              <input
                type="checkbox"
                checked={referralForm.consent_to_contact}
                onChange={(event) =>
                  updateReferralField("consent_to_contact", event.target.checked)
                }
              />
              Zgadzam się na kontakt
            </label>
            <button
              className="button primary"
              type="button"
              disabled={!referralForm.consent_to_contact}
              onClick={() => void submitPartnerReferral()}
            >
              <Send size={16} /> Отправить
            </button>
            {referralResult ? (
              <span className={`status-pill ${referralResult.status}`}>
                {referralResult.status}
              </span>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        inputMode="decimal"
        min="0"
        step={step ?? "1"}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CostMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{money(value)}</strong>
    </div>
  );
}

function ReferralField({
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

function toNumber(value: string) {
  return Number(value || 0);
}

function toOptionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

function toOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatPlainPct(value: number) {
  return `${numberValue(value)}%`;
}

function formatNullablePct(value: number | null) {
  return value === null ? "—" : formatPlainPct(value);
}

function formatNullableMoney(value: number | null) {
  return value === null ? "—" : money(value);
}
