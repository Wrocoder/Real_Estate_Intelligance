"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { api, type PartnerReferral, type PartnerReferralType } from "@/lib/api";
import { localizedError } from "@/lib/errorMessages";
import type { Locale } from "@/lib/i18n";

type LeadSegment = Extract<PartnerReferralType, "buyer_beta" | "realtor_beta">;
type Props = {
  segment: LeadSegment;
  entryPoint: "/beta" | "/realtors";
  locale?: Locale;
};
type LeadFormState = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  district: string;
  objectReference: string;
  companyName: string;
  message: string;
  consentToContact: boolean;
};

const FORM_COPY = {
  en: { eyebrow: "Request", name: "Name", email: "Email", phone: "Phone", city: "City", district: "Area", message: "Message", consent: "I agree to be contacted about the report.", submit: "Send request", saving: "Saving your request...", contactRequired: "Add an email or phone number so we can reach you.", requestError: "The request could not be sent.", buyer: { title: "Request a buyer report", subtitle: "For buyers with a specific apartment, listing link, or address.", referenceLabel: "Listing link or address", messagePlaceholder: "What decision do you need to make, what is your budget, and what concerns you most?", success: "Request saved. We will contact you using the details provided." }, realtor: { title: "Request for a realtor or agency", subtitle: "For a pilot with 1-5 real client properties.", referenceLabel: "Agency or company", messagePlaceholder: "How many agents, which properties, and what report format do you need?", success: "Request saved. We will contact you using the details provided." } },
  pl: { eyebrow: "Zgłoszenie", name: "Imię", email: "E-mail", phone: "Telefon", city: "Miasto", district: "Dzielnica", message: "Wiadomość", consent: "Zgadzam się na kontakt w sprawie raportu.", submit: "Wyślij zgłoszenie", saving: "Zapisujemy zgłoszenie...", contactRequired: "Podaj e-mail lub telefon, abyśmy mogli się skontaktować.", requestError: "Nie udało się wysłać zgłoszenia.", buyer: { title: "Zamów raport kupującego", subtitle: "Dla osób, które mają konkretne mieszkanie, link do ogłoszenia lub adres.", referenceLabel: "Link do ogłoszenia lub adres", messagePlaceholder: "Jaką decyzję chcesz podjąć, jaki masz budżet i co najbardziej Cię niepokoi?", success: "Zgłoszenie zapisane. Skontaktujemy się na podany kontakt." }, realtor: { title: "Zgłoszenie dla pośrednika lub biura", subtitle: "Do pilotażu z 1-5 prawdziwymi obiektami klientów.", referenceLabel: "Biuro lub firma", messagePlaceholder: "Ilu agentów, jakie obiekty i jaki format raportu jest potrzebny?", success: "Zgłoszenie zapisane. Skontaktujemy się na podany kontakt." } },
  ru: { eyebrow: "Заявка", name: "Имя", email: "Email", phone: "Телефон", city: "Город", district: "Район", message: "Сообщение", consent: "Согласен на контакт по поводу отчёта.", submit: "Отправить заявку", saving: "Сохраняем заявку...", contactRequired: "Укажите email или телефон для связи.", requestError: "Не удалось отправить заявку.", buyer: { title: "Заказать отчёт покупателя", subtitle: "Для тех, у кого уже есть конкретная квартира, ссылка или адрес.", referenceLabel: "Ссылка на объявление или адрес", messagePlaceholder: "Какое решение нужно принять, какой бюджет и что беспокоит больше всего?", success: "Заявка сохранена. Мы свяжемся по указанному контакту." }, realtor: { title: "Заявка для риелтора или агентства", subtitle: "Для пилота с 1-5 реальными объектами клиентов.", referenceLabel: "Агентство или компания", messagePlaceholder: "Сколько агентов, какие объекты и какой формат отчёта нужен?", success: "Заявка сохранена. Мы свяжемся по указанному контакту." } },
  uk: { eyebrow: "Заявка", name: "Ім'я", email: "Email", phone: "Телефон", city: "Місто", district: "Район", message: "Повідомлення", consent: "Погоджуюся на контакт щодо звіту.", submit: "Надіслати заявку", saving: "Зберігаємо заявку...", contactRequired: "Вкажіть email або телефон для зв'язку.", requestError: "Не вдалося надіслати заявку.", buyer: { title: "Замовити звіт покупця", subtitle: "Для тих, хто вже має конкретну квартиру, посилання або адресу.", referenceLabel: "Посилання на оголошення або адреса", messagePlaceholder: "Яке рішення потрібно прийняти, який бюджет і що найбільше турбує?", success: "Заявку збережено. Ми зв'яжемося за вказаним контактом." }, realtor: { title: "Заявка для рієлтора або агентства", subtitle: "Для пілота з 1-5 реальними об'єктами клієнтів.", referenceLabel: "Агентство або компанія", messagePlaceholder: "Скільки агентів, які об'єкти та який формат звіту потрібен?", success: "Заявку збережено. Ми зв'яжемося за вказаним контактом." } },
} as const;

const DEFAULT_FORM: LeadFormState = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  city: "Wrocław",
  district: "",
  objectReference: "",
  companyName: "",
  message: "",
  consentToContact: false,
};

export function BetaLeadForm({ segment, entryPoint, locale = "pl" }: Props) {
  const copy = FORM_COPY[locale];
  const config = copy[segment === "buyer_beta" ? "buyer" : "realtor"];
  const [form, setForm] = useState<LeadFormState>(DEFAULT_FORM);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [createdLead, setCreatedLead] = useState<PartnerReferral | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus(copy.saving);
    setCreatedLead(null);

    if (!blankToNull(form.contactEmail) && !blankToNull(form.contactPhone)) {
      setError(copy.contactRequired);
      setStatus("");
      return;
    }

    try {
      const lead = await api.createPartnerReferral({
        referral_type: segment,
        source_context: `${segment}_landing`,
        city: blankToNull(form.city) ?? "Wrocław",
        district: blankToNull(form.district),
        contact_name: blankToNull(form.contactName),
        contact_email: blankToNull(form.contactEmail),
        contact_phone: blankToNull(form.contactPhone),
        message: blankToNull(form.message),
        consent_to_contact: form.consentToContact,
        metadata: {
          entry_point: entryPoint,
          beta_segment: segment,
          object_reference_private:
            segment === "buyer_beta" ? blankToNull(form.objectReference) : null,
          agency_name: segment === "realtor_beta" ? blankToNull(form.companyName) : null,
        },
      });
      setCreatedLead(lead);
      setStatus(config.success);
      setForm(DEFAULT_FORM);
    } catch (caught) {
      setError(localizedError(caught, locale, copy.requestError));
      setStatus(copy.requestError);
    }
  }

  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="landing-section landing-lead-panel" id="beta-lead">
      <div className="landing-section-header">
        <span className="landing-eyebrow">{copy.eyebrow}</span>
        <h2>{config.title}</h2>
        <p>{config.subtitle}</p>
      </div>

      <form className="landing-lead-form" onSubmit={(event) => void submit(event)}>
        <div className="form-grid compact">
          <LeadField
            label={copy.name}
            value={form.contactName}
            onChange={(value) => update("contactName", value)}
          />
          <LeadField
            label={copy.email}
            type="email"
            value={form.contactEmail}
            onChange={(value) => update("contactEmail", value)}
          />
          <LeadField
            label={copy.phone}
            value={form.contactPhone}
            onChange={(value) => update("contactPhone", value)}
          />
          <LeadField
            label={copy.city}
            value={form.city}
            onChange={(value) => update("city", value)}
          />
          <LeadField
            label={copy.district}
            value={form.district}
            onChange={(value) => update("district", value)}
          />
          {segment === "buyer_beta" ? (
            <LeadField
              label={config.referenceLabel}
              value={form.objectReference}
              onChange={(value) => update("objectReference", value)}
            />
          ) : (
            <LeadField
              label={config.referenceLabel}
              value={form.companyName}
              onChange={(value) => update("companyName", value)}
            />
          )}
        </div>
        <label className="field">
          <span>{copy.message}</span>
          <textarea
            className="textarea"
          placeholder={config.messagePlaceholder}
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
          />
        </label>
        <div className="landing-lead-actions">
          <label className="compare-toggle">
            <input
              type="checkbox"
              checked={form.consentToContact}
              onChange={(event) => update("consentToContact", event.target.checked)}
            />
            <span>{copy.consent}</span>
          </label>
          <button
            className="button primary landing-button"
            type="submit"
            disabled={!form.consentToContact}
          >
            <Send size={16} /> {copy.submit}
          </button>
        </div>
        {status ? (
          <p className={error ? "landing-form-status error" : "landing-form-status"}>
            {createdLead ? <CheckCircle2 size={16} /> : null}
            {status}
          </p>
        ) : null}
        {error ? <p className="landing-form-status error">{error}</p> : null}
      </form>
    </section>
  );
}

function LeadField({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}
