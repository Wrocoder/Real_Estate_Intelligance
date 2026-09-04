"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, LockKeyhole, MapPinned, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";

import { BetaLeadForm } from "@/components/BetaLeadForm";
import { LandingMapScene } from "@/components/LandingMapScene";
import { LANDING_COPY } from "@/lib/landingCopy";
import { useLocalePreference } from "@/lib/useLocalePreference";

const CHECK_ICONS = [TrendingUp, MapPinned, ShieldCheck, WalletCards];

export function BuyerBetaContent() {
  const { locale } = useLocalePreference();
  const copy = LANDING_COPY[locale].buyer;
  return <div className="landing-page">
    <section className="landing-hero"><LandingMapScene variant="buyer" /><div className="landing-hero-shade" /><div className="landing-hero-content">
      <span className="landing-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p>
      <div className="landing-cta-row"><Link className="button primary landing-button" href="/check?source=buyer-beta"><ClipboardCheck size={18} /> {copy.checkAction}</Link><Link className="button landing-button" href="/pricing?source=buyer-beta"><FileText size={18} /> {copy.reportsAction}</Link></div>
    </div></section>
    <section className="landing-proof-strip" aria-label={copy.proofLabel}>{copy.proof.map((item) => <div key={item.value}><strong>{item.value}</strong><span>{item.label}</span></div>)}</section>
    <section className="landing-section"><div className="landing-section-header"><span className="landing-eyebrow">{copy.insideEyebrow}</span><h2>{copy.insideTitle}</h2><p>{copy.insideIntro}</p></div><div className="landing-card-grid">{copy.checks.map((item, index) => { const Icon = CHECK_ICONS[index]; return <article className="landing-card" key={item.title}><Icon size={20} /><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div></section>
    <section className="landing-section landing-section-muted"><div className="landing-section-header"><span className="landing-eyebrow">{copy.processEyebrow}</span><h2>{copy.processTitle}</h2></div><ol className="landing-steps">{copy.process.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></section>
    <BetaLeadForm segment="buyer_beta" entryPoint="/beta" locale={locale} />
    <section className="landing-section landing-compliance"><div><span className="landing-eyebrow">{copy.complianceEyebrow}</span><h2>{copy.complianceTitle}</h2></div><ul className="section-list">{copy.compliance.map((item, index) => { const Icon = [LockKeyhole, CheckCircle2, ShieldCheck][index]; return <li key={item}><Icon size={16} />{item}</li>; })}</ul><Link className="button primary landing-button" href="/check?source=buyer-beta-bottom"><ArrowRight size={18} /> {copy.bottomAction}</Link></section>
  </div>;
}
