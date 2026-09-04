"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calculator, RefreshCw, Send } from "lucide-react";

import { ErrorBlock } from "@/components/StateBlocks";
import {
  api,
  type MortgageCalculationResult,
  type PartnerReferral,
  type PartnerReferralType,
} from "@/lib/api";
import { money, numberValue } from "@/lib/format";
import { localizedError } from "@/lib/errorMessages";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

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
  message: "",
  consent_to_contact: false,
};

const COPY = {
  en: {
    title: "Mortgage and purchase cost",
    subtitle: "Estimate the down payment, loan, taxes, fees, renovation reserve and monthly burden.",
    calculate: "Calculate",
    refresh: "Update",
    ready: "Ready to calculate",
    calculating: "Calculating...",
    calculated: "Calculation ready",
    calculateError: "Could not calculate the mortgage",
    referralReady: "Request not sent",
    referralSending: "Sending request...",
    referralCreated: (id: string) => `Request created: ${id}`,
    referralError: "Could not send the request",
    metrics: {
      cashNeeded: "Cash needed",
      loan: "Mortgage",
      monthly: "Monthly payment",
      affordability: "Affordability",
    },
    affordability: {
      unknown: "income not provided",
      comfortable: "comfortable",
      stretched: "stretched",
      high_risk: "high risk",
    },
    form: {
      title: "Deal assumptions",
      propertyPrice: "Apartment price",
      downPayment: "Down payment",
      years: "Loan term, years",
      rate: "Interest rate, %",
      rateType: "Rate type",
      market: "Market",
      income: "Net income/month",
      debts: "Other debt/month",
      housingCosts: "Monthly housing costs",
      insurance: "Insurance/month",
      notary: "Notary",
      court: "Court fees",
      bankCommission: "Bank commission, %",
      agentCommission: "Agent commission, %",
      renovation: "Renovation/furniture",
      include: "include",
      exclude: "exclude",
    },
    options: {
      fixed: "Fixed",
      variable: "Variable",
      primary: "Primary",
      secondary: "Secondary",
    },
    result: {
      title: "Result",
      downPayment: "Down payment",
      ltv: "LTV",
      dti: "DTI",
      buffer: "Buffer after payment",
      empty: "Enter assumptions and run the calculation.",
      scenarios: "Rate scenarios",
      scenario: "Scenario",
      rate: "Rate",
      payment: "Payment",
      overpayment: "Interest cost",
      totalRepayment: "Total loan repayment",
      totalOutlay: "Total cash over loan term",
      marketTreatment: "Tax treatment",
      marketPrimary: "Primary market: price is treated as VAT-inclusive; PCC is not added.",
      marketSecondary: "Secondary market: PCC is estimated at 2% when selected; a first-home exemption may apply.",
      legalFreshness: (date: string) => `Legal source checked ${date}`,
      affordabilityWarning: "This is a budgeting estimate, not a bank decision or credit offer.",
      cashBreakdown: "Cash breakdown",
      totalCash: "Total cash",
      loan: "Loan",
    },
    referral: {
      title: "Partner request",
      type: "Service",
      mortgage: "Mortgage",
      legal: "Legal check",
      renovation: "Renovation",
      city: "City",
      district: "District",
      name: "Name",
      phone: "Phone",
      message: "Message",
      consent: "I agree to be contacted",
      send: "Send",
    },
  },
  pl: {
    title: "Kredyt i koszt zakupu",
    subtitle: "Oszacuj wkład, kredyt, podatki, opłaty, rezerwę remontową i miesięczne obciążenie.",
    calculate: "Oblicz",
    refresh: "Aktualizuj",
    ready: "Gotowe do obliczenia",
    calculating: "Liczymy...",
    calculated: "Kalkulacja gotowa",
    calculateError: "Nie udało się obliczyć kredytu",
    referralReady: "Zgłoszenie nie zostało wysłane",
    referralSending: "Wysyłanie zgłoszenia...",
    referralCreated: (id: string) => `Zgłoszenie utworzone: ${id}`,
    referralError: "Nie udało się wysłać zgłoszenia",
    metrics: {
      cashNeeded: "Gotówka na start",
      loan: "Kredyt",
      monthly: "Rata miesięczna",
      affordability: "Obciążenie budżetu",
    },
    affordability: {
      unknown: "brak dochodu",
      comfortable: "komfortowe",
      stretched: "na granicy",
      high_risk: "wysokie ryzyko",
    },
    form: {
      title: "Założenia transakcji",
      propertyPrice: "Cena mieszkania",
      downPayment: "Wkład własny",
      years: "Okres kredytu, lata",
      rate: "Oprocentowanie, %",
      rateType: "Typ oprocentowania",
      market: "Rynek",
      income: "Dochód netto/mies.",
      debts: "Inne zobowiązania/mies.",
      housingCosts: "Miesięczne koszty mieszkania",
      insurance: "Ubezpieczenie/mies.",
      notary: "Notariusz",
      court: "Opłaty sądowe",
      bankCommission: "Prowizja banku, %",
      agentCommission: "Prowizja pośrednika, %",
      renovation: "Remont/meble",
      include: "uwzględnij",
      exclude: "nie uwzględniaj",
    },
    options: {
      fixed: "Stałe",
      variable: "Zmienne",
      primary: "Pierwotny",
      secondary: "Wtórny",
    },
    result: {
      title: "Wynik",
      downPayment: "Wkład własny",
      ltv: "LTV",
      dti: "DTI",
      buffer: "Bufor po racie",
      empty: "Wpisz założenia i uruchom kalkulację.",
      scenarios: "Scenariusze oprocentowania",
      scenario: "Scenariusz",
      rate: "Oprocentowanie",
      payment: "Rata",
      overpayment: "Koszt odsetek",
      totalRepayment: "Łączna spłata kredytu",
      totalOutlay: "Łączny wydatek w okresie kredytu",
      marketTreatment: "Rozliczenie podatku",
      marketPrimary: "Rynek pierwotny: cena jest traktowana jako zawierająca VAT; PCC nie jest doliczany.",
      marketSecondary: "Rynek wtórny: PCC szacujemy na 2% po zaznaczeniu; może obowiązywać zwolnienie dla pierwszego mieszkania.",
      legalFreshness: (date: string) => `Źródło prawne sprawdzone ${date}`,
      affordabilityWarning: "To szacunek budżetowy, a nie decyzja banku ani oferta kredytowa.",
      cashBreakdown: "Struktura gotówki",
      totalCash: "Gotówka razem",
      loan: "Kredyt",
    },
    referral: {
      title: "Zgłoszenie do partnera",
      type: "Usługa",
      mortgage: "Kredyt",
      legal: "Kontrola prawna",
      renovation: "Remont",
      city: "Miasto",
      district: "Dzielnica",
      name: "Imię",
      phone: "Telefon",
      message: "Wiadomość",
      consent: "Zgadzam się na kontakt",
      send: "Wyślij",
    },
  },
  ru: {
    title: "Ипотека и стоимость покупки",
    subtitle: "Оцените взнос, кредит, налоги, сборы, ремонтный резерв и нагрузку на бюджет.",
    calculate: "Рассчитать",
    refresh: "Обновить",
    ready: "Готово к расчету",
    calculating: "Расчет...",
    calculated: "Расчет готов",
    calculateError: "Не удалось рассчитать ипотеку",
    referralReady: "Заявка не отправлена",
    referralSending: "Отправка заявки...",
    referralCreated: (id: string) => `Заявка создана: ${id}`,
    referralError: "Не удалось отправить заявку",
    metrics: {
      cashNeeded: "Нужно на старте",
      loan: "Кредит",
      monthly: "Платеж в месяц",
      affordability: "Нагрузка на бюджет",
    },
    affordability: {
      unknown: "доход не указан",
      comfortable: "комфортно",
      stretched: "на границе",
      high_risk: "высокий риск",
    },
    form: {
      title: "Параметры сделки",
      propertyPrice: "Цена квартиры",
      downPayment: "Собственный взнос",
      years: "Срок кредита, лет",
      rate: "Ставка, %",
      rateType: "Тип ставки",
      market: "Рынок",
      income: "Доход нетто/мес.",
      debts: "Другие долги/мес.",
      housingCosts: "Расходы на жилье/мес.",
      insurance: "Страховка/мес.",
      notary: "Нотариус",
      court: "Судовые сборы",
      bankCommission: "Комиссия банка, %",
      agentCommission: "Комиссия посредника, %",
      renovation: "Ремонт/мебель",
      include: "учитывать",
      exclude: "не учитывать",
    },
    options: {
      fixed: "Фиксированная",
      variable: "Переменная",
      primary: "Первичный",
      secondary: "Вторичный",
    },
    result: {
      title: "Вывод",
      downPayment: "Собственный взнос",
      ltv: "LTV",
      dti: "DTI",
      buffer: "Буфер после платежа",
      empty: "Введите параметры и запустите расчет.",
      scenarios: "Сценарии ставки",
      scenario: "Сценарий",
      rate: "Ставка",
      payment: "Платеж",
      overpayment: "Стоимость процентов",
      totalRepayment: "Всего выплат по кредиту",
      totalOutlay: "Всего денежных расходов за срок кредита",
      marketTreatment: "Налоговый режим",
      marketPrimary: "Первичный рынок: цена считается с VAT; PCC не добавляется.",
      marketSecondary: "Вторичный рынок: PCC оценивается в 2% при выборе; может применяться освобождение для первого жилья.",
      legalFreshness: (date: string) => `Юридический источник проверен ${date}`,
      affordabilityWarning: "Это оценка бюджета, а не решение банка и не кредитное предложение.",
      cashBreakdown: "Структура наличных расходов",
      totalCash: "Всего наличными",
      loan: "Кредит",
    },
    referral: {
      title: "Заявка партнеру",
      type: "Услуга",
      mortgage: "Ипотека",
      legal: "Юридическая проверка",
      renovation: "Ремонт",
      city: "Город",
      district: "Район",
      name: "Имя",
      phone: "Телефон",
      message: "Сообщение",
      consent: "Согласен на контакт",
      send: "Отправить",
    },
  },
  uk: {
    title: "Іпотека і вартість купівлі",
    subtitle: "Оцініть внесок, кредит, податки, збори, ремонтний резерв і навантаження на бюджет.",
    calculate: "Розрахувати",
    refresh: "Оновити",
    ready: "Готово до розрахунку",
    calculating: "Розрахунок...",
    calculated: "Розрахунок готовий",
    calculateError: "Не вдалося розрахувати іпотеку",
    referralReady: "Заявку не надіслано",
    referralSending: "Надсилання заявки...",
    referralCreated: (id: string) => `Заявку створено: ${id}`,
    referralError: "Не вдалося надіслати заявку",
    metrics: {
      cashNeeded: "Потрібно на старті",
      loan: "Кредит",
      monthly: "Платіж на місяць",
      affordability: "Навантаження на бюджет",
    },
    affordability: {
      unknown: "дохід не вказано",
      comfortable: "комфортно",
      stretched: "на межі",
      high_risk: "високий ризик",
    },
    form: {
      title: "Параметри угоди",
      propertyPrice: "Ціна квартири",
      downPayment: "Власний внесок",
      years: "Строк кредиту, років",
      rate: "Ставка, %",
      rateType: "Тип ставки",
      market: "Ринок",
      income: "Дохід нетто/міс.",
      debts: "Інші борги/міс.",
      housingCosts: "Витрати на житло/міс.",
      insurance: "Страхування/міс.",
      notary: "Нотаріус",
      court: "Судові збори",
      bankCommission: "Комісія банку, %",
      agentCommission: "Комісія посередника, %",
      renovation: "Ремонт/меблі",
      include: "враховувати",
      exclude: "не враховувати",
    },
    options: {
      fixed: "Фіксована",
      variable: "Змінна",
      primary: "Первинний",
      secondary: "Вторинний",
    },
    result: {
      title: "Висновок",
      downPayment: "Власний внесок",
      ltv: "LTV",
      dti: "DTI",
      buffer: "Буфер після платежу",
      empty: "Введіть параметри і запустіть розрахунок.",
      scenarios: "Сценарії ставки",
      scenario: "Сценарій",
      rate: "Ставка",
      payment: "Платіж",
      overpayment: "Вартість відсотків",
      totalRepayment: "Загальна виплата за кредитом",
      totalOutlay: "Загальні грошові витрати за строк кредиту",
      marketTreatment: "Податковий режим",
      marketPrimary: "Первинний ринок: ціна вважається з VAT; PCC не додається.",
      marketSecondary: "Вторинний ринок: PCC оцінюється у 2% за вибором; може діяти звільнення для першого житла.",
      legalFreshness: (date: string) => `Юридичне джерело перевірено ${date}`,
      affordabilityWarning: "Це оцінка бюджету, а не рішення банку і не кредитна пропозиція.",
      cashBreakdown: "Структура готівкових витрат",
      totalCash: "Усього готівкою",
      loan: "Кредит",
    },
    referral: {
      title: "Заявка партнеру",
      type: "Послуга",
      mortgage: "Іпотека",
      legal: "Юридична перевірка",
      renovation: "Ремонт",
      city: "Місто",
      district: "Район",
      name: "Ім'я",
      phone: "Телефон",
      message: "Повідомлення",
      consent: "Згоден на контакт",
      send: "Надіслати",
    },
  },
} as const;

export default function MortgagePage() {
  const { locale } = useLocalePreference();
  const searchParams = useSearchParams();
  const copy = COPY[locale];
  const [form, setForm] = useState<MortgageFormState>(DEFAULT_FORM);
  const [contextApplied, setContextApplied] = useState(false);
  const [referralForm, setReferralForm] =
    useState<ReferralFormState>(DEFAULT_REFERRAL_FORM);
  const [result, setResult] = useState<MortgageCalculationResult | null>(null);
  const [referralResult, setReferralResult] = useState<PartnerReferral | null>(null);
  const [status, setStatus] = useState<string>(copy.ready);
  const [referralStatus, setReferralStatus] = useState<string>(copy.referralReady);
  const [error, setError] = useState("");
  const [referralError, setReferralError] = useState("");

  const affordabilityLabel = useMemo(() => {
    if (!result) return "—";
    return copy.affordability[result.affordability.status];
  }, [copy, result]);

  async function calculate() {
    setError("");
    setStatus(copy.calculating);
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
      setStatus(copy.calculated);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.calculateError));
      setStatus(copy.calculateError);
    }
  }

  useEffect(() => {
    const price = Number(searchParams.get("property_price_pln") || 0);
    const market = searchParams.get("market_type");
    if (price > 0 || market === "primary" || market === "secondary") {
      setForm((current) => ({
        ...current,
        ...(price > 0 ? { property_price_pln: String(Math.round(price)) } : {}),
        ...(market === "primary" || market === "secondary" ? { market_type: market } : {}),
      }));
    }
    setContextApplied(true);
  }, [searchParams]);

  useEffect(() => {
    if (contextApplied) void calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextApplied]);

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
    setReferralStatus(copy.referralSending);
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
      setReferralStatus(copy.referralCreated(referral.id));
    } catch (caught) {
      setReferralError(localizedError(caught, locale, copy.referralError));
      setReferralStatus(copy.referralError);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <button className="button primary" type="button" onClick={() => void calculate()}>
          <Calculator size={16} /> {copy.calculate}
        </button>
      </header>

      {error ? <ErrorBlock message={error} /> : null}

      <section className="metric-grid mortgage-summary-grid">
        <div className="metric">
          <span>{copy.metrics.cashNeeded}</span>
          <strong>{result ? money(result.costs.upfront_cash_needed_pln, locale) : "—"}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.loan}</span>
          <strong>{result ? money(result.costs.loan_amount_pln, locale) : "—"}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.monthly}</span>
          <strong>{result ? money(result.base_scenario.monthly_total_payment_pln, locale) : "—"}</strong>
        </div>
        <div className="metric">
          <span>{copy.metrics.affordability}</span>
          <strong>{affordabilityLabel}</strong>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="panel-header">
            <h2>{copy.form.title}</h2>
            <button className="button" type="button" onClick={() => void calculate()}>
              <RefreshCw size={16} /> {copy.refresh}
            </button>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <NumberField
                label={copy.form.propertyPrice}
                value={form.property_price_pln}
                onChange={(value) => updateField("property_price_pln", value)}
              />
              <NumberField
                label={copy.form.downPayment}
                value={form.down_payment_pln}
                onChange={(value) => updateField("down_payment_pln", value)}
              />
              <NumberField
                label={copy.form.years}
                value={form.loan_years}
                onChange={(value) => updateField("loan_years", value)}
              />
              <NumberField
                label={copy.form.rate}
                value={form.annual_interest_rate_pct}
                step="0.1"
                onChange={(value) => updateField("annual_interest_rate_pct", value)}
              />
              <label className="field">
                <span>{copy.form.rateType}</span>
                <select
                  className="select"
                  value={form.rate_type}
                  onChange={(event) =>
                    updateField("rate_type", event.target.value as MortgageFormState["rate_type"])
                  }
                >
                  <option value="fixed">{copy.options.fixed}</option>
                  <option value="variable">{copy.options.variable}</option>
                </select>
              </label>
              <label className="field">
                <span>{copy.form.market}</span>
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
                  <option value="secondary">{copy.options.secondary}</option>
                  <option value="primary">{copy.options.primary}</option>
                </select>
              </label>
            </div>

            <div className="form-grid" style={{ marginTop: 12 }}>
              <NumberField
                label={copy.form.income}
                value={form.monthly_income_pln}
                onChange={(value) => updateField("monthly_income_pln", value)}
              />
              <NumberField
                label={copy.form.debts}
                value={form.monthly_existing_debt_pln}
                onChange={(value) => updateField("monthly_existing_debt_pln", value)}
              />
              <NumberField
                label={copy.form.housingCosts}
                value={form.monthly_housing_costs_pln}
                onChange={(value) => updateField("monthly_housing_costs_pln", value)}
              />
              <NumberField
                label={copy.form.insurance}
                value={form.insurance_monthly_pln}
                onChange={(value) => updateField("insurance_monthly_pln", value)}
              />
              <NumberField
                label={copy.form.notary}
                value={form.notary_fee_pln}
                onChange={(value) => updateField("notary_fee_pln", value)}
              />
              <NumberField
                label={copy.form.court}
                value={form.court_fees_pln}
                onChange={(value) => updateField("court_fees_pln", value)}
              />
              <NumberField
                label={copy.form.bankCommission}
                value={form.bank_commission_pct}
                step="0.1"
                onChange={(value) => updateField("bank_commission_pct", value)}
              />
              <NumberField
                label={copy.form.agentCommission}
                value={form.agent_commission_pct}
                step="0.1"
                onChange={(value) => updateField("agent_commission_pct", value)}
              />
              <NumberField
                label={copy.form.renovation}
                value={form.renovation_budget_pln}
                onChange={(value) => updateField("renovation_budget_pln", value)}
              />
            </div>

            <label className="field" style={{ marginTop: 12 }}>
              <span>PCC 2% (secondary market)</span>
              <select
                className="select"
                value={form.include_pcc ? "yes" : "no"}
                onChange={(event) => updateField("include_pcc", event.target.value === "yes")}
              >
                <option value="yes">{copy.form.include}</option>
                <option value="no">{copy.form.exclude}</option>
              </select>
            </label>
            <p className="status-line">{status}</p>
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h2>{copy.result.title}</h2>
          </div>
          <div className="panel-body">
            {result ? (
              <>
                <ul className="section-list compact financial-summary">
                  <li>
                    <span>{copy.result.downPayment}</span>
                    <strong>{formatPlainPct(result.costs.down_payment_pct, locale)}</strong>
                  </li>
                  <li>
                    <span>LTV</span>
                    <strong>{formatPlainPct(result.costs.loan_to_value_pct, locale)}</strong>
                  </li>
                  <li>
                    <span>DTI</span>
                    <strong>{formatNullablePct(result.affordability.base_debt_to_income_pct, locale)}</strong>
                  </li>
                  <li>
                    <span>{copy.result.buffer}</span>
                    <strong>
                      {formatNullableMoney(result.affordability.monthly_buffer_after_payment_pln, locale)}
                    </strong>
                  </li>
                </ul>
                <div className="decision-callout" style={{ marginTop: 16 }}>
                  <strong>{copy.result.marketTreatment}</strong>
                  <p>
                    {form.market_type === "primary" ? copy.result.marketPrimary : copy.result.marketSecondary}
                  </p>
                  <small>{copy.result.legalFreshness(result.legal_context.checked_at)}</small>{" "}
                  <a href={result.legal_context.source_url} target="_blank" rel="noreferrer">
                    {result.legal_context.source_name}
                  </a>
                </div>
                <ul className="section-list" style={{ marginTop: 12 }}>
                  {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {result.disclaimer}
                </p>
                <p className="muted" style={{ marginBottom: 0, marginTop: 8 }}>
                  {copy.result.affordabilityWarning}
                </p>
              </>
            ) : (
              <div className="empty-state">{copy.result.empty}</div>
            )}
          </div>
        </aside>
      </section>

      {result ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>{copy.result.scenarios}</h2>
          </div>
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr>
                  <th>{copy.result.scenario}</th>
                  <th>{copy.result.rate}</th>
                  <th>{copy.result.payment}</th>
                  <th>DTI</th>
                  <th>{copy.result.overpayment}</th>
                  <th>{copy.result.totalRepayment}</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((scenario) => (
                  <tr key={scenario.scenario_code}>
                    <td>{scenario.label}</td>
                    <td>{formatPlainPct(scenario.annual_interest_rate_pct, locale)}</td>
                    <td>{money(scenario.monthly_total_payment_pln, locale)}</td>
                    <td>{formatNullablePct(scenario.debt_to_income_pct, locale)}</td>
                    <td>{money(scenario.total_interest_pln, locale)}</td>
                    <td>{money(scenario.total_repaid_pln, locale)}</td>
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
            <h2>{copy.result.cashBreakdown}</h2>
          </div>
          <div className="panel-body">
            <div className="metric-grid mortgage-cash-grid">
              <CostMetric label="PCC" locale={locale} value={result.costs.pcc_tax_pln} />
              <CostMetric label={copy.form.notary} locale={locale} value={result.costs.notary_fee_pln} />
              <CostMetric label={copy.form.court} locale={locale} value={result.costs.court_fees_pln} />
              <CostMetric label={copy.form.bankCommission} locale={locale} value={result.costs.bank_commission_pln} />
              <CostMetric label={copy.form.agentCommission} locale={locale} value={result.costs.agent_commission_pln} />
              <CostMetric label={copy.form.renovation} locale={locale} value={result.costs.renovation_budget_pln} />
              <div className="metric financial-metric total">
                <span>{copy.result.totalCash}</span>
                <strong>{money(result.costs.upfront_cash_needed_pln, locale)}</strong>
              </div>
              <div className="metric financial-metric">
                <span>{copy.result.loan}</span>
                <strong>{money(result.costs.loan_amount_pln, locale)}</strong>
              </div>
              <div className="metric financial-metric">
                <span>{copy.result.totalRepayment}</span>
                <strong>{money(result.base_scenario.total_repaid_pln, locale)}</strong>
              </div>
              <div className="metric financial-metric total">
                <span>{copy.result.totalOutlay}</span>
                <strong>
                  {money(
                    result.costs.upfront_cash_needed_pln + result.base_scenario.total_repaid_pln,
                    locale,
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{copy.referral.title}</h2>
          <span className="status-line">{referralStatus}</span>
        </div>
        <div className="panel-body">
          {referralError ? <ErrorBlock message={referralError} /> : null}
          <div className="form-grid">
            <label className="field">
              <span>{copy.referral.type}</span>
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
                <option value="mortgage">{copy.referral.mortgage}</option>
                <option value="legal">{copy.referral.legal}</option>
                <option value="renovation">{copy.referral.renovation}</option>
              </select>
            </label>
            <ReferralField
              label={copy.referral.city}
              value={referralForm.city}
              onChange={(value) => updateReferralField("city", value)}
            />
            <ReferralField
              label={copy.referral.district}
              value={referralForm.district}
              onChange={(value) => updateReferralField("district", value)}
            />
            <ReferralField
              label={copy.referral.name}
              value={referralForm.contact_name}
              onChange={(value) => updateReferralField("contact_name", value)}
            />
            <ReferralField
              label="Email"
              value={referralForm.contact_email}
              onChange={(value) => updateReferralField("contact_email", value)}
            />
            <ReferralField
              label={copy.referral.phone}
              value={referralForm.contact_phone}
              onChange={(value) => updateReferralField("contact_phone", value)}
            />
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>{copy.referral.message}</span>
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
              {copy.referral.consent}
            </label>
            <button
              className="button primary"
              type="button"
              disabled={!referralForm.consent_to_contact}
              onClick={() => void submitPartnerReferral()}
            >
              <Send size={16} /> {copy.referral.send}
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

function CostMetric({ label, locale, value }: { label: string; locale: Locale; value: number }) {
  return (
    <div className="metric financial-metric">
      <span>{label}</span>
      <strong>{money(value, locale)}</strong>
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

function formatPlainPct(value: number, locale: Locale) {
  return `${numberValue(value, locale)}%`;
}

function formatNullablePct(value: number | null, locale: Locale) {
  return value === null ? "—" : formatPlainPct(value, locale);
}

function formatNullableMoney(value: number | null, locale: Locale) {
  return value === null ? "—" : money(value, locale);
}
