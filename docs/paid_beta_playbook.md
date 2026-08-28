# Paid Beta Playbook

Цель: проверить, платят ли покупатели, риелторы и малые агентства за помощь в
решении "покупать / торговаться / отказаться / сначала проверить", а не просто
за аналитический отчет.

До следующих крупных product modules действует gate:

- 20 paid buyer reports sold to strangers at 49-149 PLN; or
- 3 paid realtor bundle pilots with real client conversations; and
- at least 5 recorded decision-impact outcomes.

## Entry points

- `/beta` - buyer landing: проверка квартиры перед покупкой.
- `/realtors` - realtor/agency landing: клиентские отчеты и аналитика цены.
- `/check` - рабочий flow: адрес, ручные параметры или user-submitted URL.
- `/pricing` - разовые paid reports, bundles и checkout.
- `/admin` - очередь `Leads & Partner Referrals` для обработки beta leads.

Все paid beta ссылки должны получать `source` query parameter:

- `buyer-beta`
- `buyer-beta-bottom`
- `realtor-beta`
- `realtor-beta-bottom`
- `cold-email-agency`
- `linkedin-realtor`
- `facebook-buyer-group`

## Offers

| Offer | Audience | Price hypothesis | Delivery |
| --- | --- | --- | --- |
| Free Check | Buyer | 0 PLN | teaser verdict, price position, 3 risks |
| Buyer Check | Buyer | 49 PLN | verdict, fair price, comparables, risks, negotiation |
| Full Due Diligence | Buyer/investor | 149 PLN | Buyer Check + documents/building/future/total cost checklist |
| Expert Review | Buyer/investor | 299-499 PLN | automatic report + analyst QA before zadatek |
| Realtor Pro | Realtor | 199-399 PLN/month | branded reports, compare, shortlist, workspace |
| 5-report beta bundle | Realtor/agency | 299-499 PLN | 5 credits, feedback required |

Do not lead with "analytics". Lead with:

> Проверка квартиры перед покупкой: цена, документы, риски, район, торг.

## Manual / Semi-Automated First Report Workflow

1. Lead arrives from `/beta`, `/realtors`, direct outreach or referral.
   Landing forms save leads through `/api/v1/partner-referrals` with
   `referral_type=buyer_beta` or `referral_type=realtor_beta`.
2. Qualify the request: city, property type, object URL/address, budget,
   decision deadline, buyer/realtor/investor role.
3. Confirm data consent: the user has the right to use the submitted link/data
   for private analysis; no photo/contact copying; source URL remains private.
4. Open `/check`, import URL or enter parameters, verify price, area, rooms,
   address, floor, building floors, year and market type.
5. Produce a decision-first result:
   - verdict: buy / negotiate / avoid / verify first;
   - fair price range and seller price delta;
   - opening offer, realistic deal range and max reasonable offer;
   - top positives, top risks and critical unknowns;
   - due-diligence checklist for secondary/new-build context;
   - total acquisition cost estimate with renovation/furniture placeholders.
6. Generate buyer/realtor/investor report from the draft or existing listing.
7. Manual QA before sending:
   - no source URL leaks in public report;
   - no photos, contacts or copied full description;
   - verdict is understandable without reading every score;
   - negotiation numbers are visible before detailed score cards;
   - "what we do not know" is visible;
   - fair price confidence is visible;
   - missing data warnings are visible;
   - due-diligence checklist does not claim legal certainty;
   - disclaimers are present;
   - developer block appears only when matched with enough confidence.
8. Send HTML/PDF report and ask for feedback:
   - Was the recommendation clear?
   - Did it change the offer/negotiation?
   - What was missing before viewing or signing zadatek?
   - Did it make you skip a viewing or request another document?
   - What uncertainty would you pay an expert to check?
   - Would the user pay again?
9. Record outcome: paid/unpaid, price, segment, source channel, objections,
   requested features, next follow-up date and decision-impact category.

## Decision-Impact Tracking

Every paid beta case must record:

- lead source and segment;
- report tier and price paid;
- object price and city/district;
- verdict category;
- recommended offer and max reasonable offer;
- whether the user viewed, skipped, negotiated, rejected or bought;
- estimated savings or avoided-risk note;
- top objection to paying;
- missing data that reduced trust;
- whether human expert review would have been purchased.

## Realtor Commercial Offer

For solo agents:

- 5-report beta bundle for active client work.
- Branded reports with agency name, agent contact, colors and disclaimer.
- Object comparison and client shortlist support.
- Export for follow-up and internal notes on Realtor/Agency plans.

For small agencies:

- Workspace with owner/admin/agent roles.
- Shared report history and white-label templates.
- Pilot with 1 office, 2-5 agents, Wrocław/Dolnośląskie first.
- Success metric: at least 3 client conversations where report improved trust,
  negotiation or instruction quality.

## Outreach Scripts

### LinkedIn to realtor

Subject: `Szybki raport ceny i ryzyk mieszkania dla klienta`

Message:

> Cześć, budujemy Domarion - narzędzie do szybkich raportów dla mieszkań we
> Wrocławiu: cena vs rynek, historia ceny, ryzyka lokalizacji, argumenty do
> negocjacji i PDF dla klienta. Szukamy 5 agentów do paid beta. Czy mogę
> przygotować przykładowy raport dla jednego z Twoich aktualnych obiektów?

### Cold email to agency owner

Subject: `White-label raporty dla klientów agencji - Wrocław beta`

Body:

> Dzień dobry,
>
> testujemy Domarion Analytics dla małych agencji nieruchomości. Produkt tworzy
> raport HTML/PDF dla klienta: porównanie ceny z rynkiem, argumenty do oferty,
> ryzyka lokalizacji, dane o okolicy i sekcję dewelopera, jeśli jest dostępna.
>
> Proponujemy beta pakiet 5 raportów dla aktywnych klientów. Po każdym raporcie
> zbieramy feedback od agenta i klienta. Czy możemy pokazać przykładowy raport
> na jednym mieszkaniu z Państwa oferty?

### Facebook buyer group

Post:

> Sprawdzamy beta narzędzie do analizy mieszkania przed zakupem we Wrocławiu:
> czy cena jest rozsądna, jakie są ryzyka okolicy, co można negocjować i co
> sprawdzić przed zadatkiem. Szukamy kilku osób, które mają konkretny link lub
> adres mieszkania i chcą dostać raport testowy.

## Partner Model

Partner categories:

- mortgage brokers;
- banks;
- insurers;
- lawyers;
- notaries;
- appraisers;
- renovation/design partners.

Models:

- CPL for qualified lead;
- CPA after signed service;
- revenue share for report bundle sold through partner;
- sponsored report blocks only with explicit labeling.

Rules:

- Every paid placement must be labeled as `sponsored`, `promoted` or
  `partner offer`.
- Sponsored blocks cannot affect Investment Score, Risk Score, Fair Price,
  negotiation advice or AI verdict.
- Reports must separate analytical findings from commercial recommendations.
- Partner leads require consent to contact.

## Admin Lead Handling

Beta leads are stored in the same reviewed queue as partner referrals:

- `buyer_beta` - buyer object-check request from `/beta`;
- `realtor_beta` - realtor/agency pilot request from `/realtors`;
- `mortgage`, `legal`, `renovation` - partner referral categories.

Admin statuses:

- `new` - not contacted yet;
- `contacted` - first contact sent;
- `qualified` - valid paid beta opportunity;
- `closed` - sold or completed;
- `rejected` - not relevant, duplicate or no consent.

Private object references and agency names live in lead metadata and should not
be copied into public reports, SEO pages or exported datasets.

Paid beta tracking is stored on the same lead under
`metadata.paid_beta_tracking` and exposed through admin-only endpoints:

- `GET /api/v1/admin/paid-beta/tracking` - tracking sheet rows for
  `buyer_beta` and `realtor_beta` leads.
- `PATCH /api/v1/admin/paid-beta/tracking/{referral_id}` - update sales,
  payment, decision-impact, refund-risk, follow-up and manual QA fields.

Required tracking fields for every paid beta attempt:

- lead source and beta segment;
- payment status and price paid;
- report type;
- decision impact and notes;
- objections and missing trust data;
- refund risk;
- next follow-up date;
- manual QA status and notes.
