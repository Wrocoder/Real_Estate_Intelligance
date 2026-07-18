"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { api, type PartnerReferral, type PartnerReferralType } from "@/lib/api";

type LeadSegment = Extract<PartnerReferralType, "buyer_beta" | "realtor_beta">;
type Props = {
  segment: LeadSegment;
  entryPoint: "/beta" | "/realtors";
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

const CONFIG = {
  buyer_beta: {
    title: "Оставить заявку на beta-отчет",
    subtitle: "Подойдет, если у вас уже есть конкретный объект, ссылка или адрес.",
    referenceLabel: "Ссылка или адрес объекта",
    messagePlaceholder: "Когда нужно принять решение, какой бюджет, что больше всего беспокоит?",
    success: "Заявка сохранена. Мы видим ее в admin queue.",
  },
  realtor_beta: {
    title: "Заявка для риелтора или агентства",
    subtitle: "Подойдет для пилота на 1-5 отчетов с реальными клиентскими объектами.",
    referenceLabel: "Agency / company",
    messagePlaceholder: "Сколько агентов, какие объекты сейчас в работе, какой формат отчета нужен?",
    success: "Заявка сохранена. Она попала в beta/admin queue.",
  },
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

export function BetaLeadForm({ segment, entryPoint }: Props) {
  const config = CONFIG[segment];
  const [form, setForm] = useState<LeadFormState>(DEFAULT_FORM);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [createdLead, setCreatedLead] = useState<PartnerReferral | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("Сохраняем заявку...");
    setCreatedLead(null);

    if (!blankToNull(form.contactEmail) && !blankToNull(form.contactPhone)) {
      setError("Укажи email или телефон для связи.");
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
      setError(caught instanceof Error ? caught.message : "unknown error");
      setStatus("Ошибка заявки");
    }
  }

  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="landing-section landing-lead-panel" id="beta-lead">
      <div className="landing-section-header">
        <span className="landing-eyebrow">Beta lead</span>
        <h2>{config.title}</h2>
        <p>{config.subtitle}</p>
      </div>

      <form className="landing-lead-form" onSubmit={(event) => void submit(event)}>
        <div className="form-grid compact">
          <LeadField
            label="Name"
            value={form.contactName}
            onChange={(value) => update("contactName", value)}
          />
          <LeadField
            label="Email"
            type="email"
            value={form.contactEmail}
            onChange={(value) => update("contactEmail", value)}
          />
          <LeadField
            label="Phone"
            value={form.contactPhone}
            onChange={(value) => update("contactPhone", value)}
          />
          <LeadField
            label="City"
            value={form.city}
            onChange={(value) => update("city", value)}
          />
          <LeadField
            label="District"
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
          <span>Message</span>
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
            <span>Zgadzam się na kontakt w sprawie beta raportu.</span>
          </label>
          <button
            className="button primary landing-button"
            type="submit"
            disabled={!form.consentToContact}
          >
            <Send size={16} /> Отправить заявку
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
