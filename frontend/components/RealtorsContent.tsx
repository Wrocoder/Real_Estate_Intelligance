"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Building2, CheckCircle2, FileText, Handshake, Layers3, Presentation, ShieldCheck, UsersRound } from "lucide-react";

import { BetaLeadForm } from "@/components/BetaLeadForm";
import { LandingMapScene } from "@/components/LandingMapScene";
import { REALTOR_COPY } from "@/lib/landingCopy";
import { useLocalePreference } from "@/lib/useLocalePreference";

const USE_CASE_ICONS = [Presentation, BarChart3, Layers3, UsersRound];

export function RealtorsContent() {
  const { locale } = useLocalePreference();
  const copy = REALTOR_COPY[locale];
  return <div className="landing-page">
    <section className="landing-hero realtor"><LandingMapScene variant="realtor" /><div className="landing-hero-shade" /><div className="landing-hero-content"><span className="landing-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p><div className="landing-cta-row"><Link className="button primary landing-button" href="/pricing?source=realtor-beta"><Handshake size={18} /> {copy.reportsAction}</Link><Link className="button landing-button" href="/reports?source=realtor-beta"><FileText size={18} /> {copy.openReportsAction}</Link></div></div></section>
    <section className="landing-proof-strip" aria-label={copy.proofLabel}>{copy.proof.map((item) => <div key={item.value}><strong>{item.value}</strong><span>{item.label}</span></div>)}</section>
    <section className="landing-section"><div className="landing-section-header"><span className="landing-eyebrow">{copy.useCasesEyebrow}</span><h2>{copy.useCasesTitle}</h2><p>{copy.useCasesIntro}</p></div><div className="landing-card-grid">{copy.useCases.map((item, index) => { const Icon = USE_CASE_ICONS[index]; return <article className="landing-card" key={item.title}><Icon size={20} /><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div></section>
    <section className="landing-section landing-section-muted"><div className="landing-section-header"><span className="landing-eyebrow">{copy.packagesEyebrow}</span><h2>{copy.packagesTitle}</h2></div><ul className="landing-offer-list">{copy.packages.map((item) => <li key={item}><CheckCircle2 size={18} /><span>{item}</span></li>)}</ul></section>
    <BetaLeadForm segment="realtor_beta" entryPoint="/realtors" locale={locale} />
    <section className="landing-section landing-compliance"><div><span className="landing-eyebrow">{copy.complianceEyebrow}</span><h2>{copy.complianceTitle}</h2></div><ul className="section-list">{copy.compliance.map((item, index) => { const Icon = [ShieldCheck, Building2, BarChart3][index]; return <li key={item}><Icon size={16} />{item}</li>; })}</ul><Link className="button primary landing-button" href="/pricing?source=realtor-beta-bottom"><ArrowRight size={18} /> {copy.bottomAction}</Link></section>
  </div>;
}
