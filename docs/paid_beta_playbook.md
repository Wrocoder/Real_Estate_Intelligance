# Paid Beta Playbook

Цель: проверить, платят ли покупатели, риелторы и малые агентства за отчет по
объекту/району до полноценного production launch.

## Entry points

- `/beta` - buyer landing: проверка квартиры перед покупкой.
- `/realtors` - realtor/agency landing: клиентские отчеты и аналитика цены.
- `/check` - рабочий flow: адрес, ручные параметры или user-submitted URL.
- `/pricing` - разовые paid reports, bundles и checkout.

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
| Object check report | Buyer | 49-79 PLN | HTML/PDF, same day |
| Full object analysis | Buyer/investor | 149-199 PLN | HTML/PDF + follow-up notes |
| Area report | Buyer/investor | 79-129 PLN | Area stats, risks, growth signals |
| Realtor branded report | Realtor | 99-199 PLN/report | White-label PDF/HTML |
| 5-report beta bundle | Realtor/agency | 299-499 PLN | 5 credits, feedback required |
| Hidden gems shortlist | Investor/realtor | 199-399 PLN | 3-10 objects + reasoning |

## Manual / Semi-Automated First Report Workflow

1. Lead arrives from `/beta`, `/realtors`, direct outreach or referral.
2. Qualify the request: city, property type, object URL/address, budget,
   decision deadline, buyer/realtor/investor role.
3. Confirm data consent: the user has the right to use the submitted link/data
   for private analysis; no photo/contact copying; source URL remains private.
4. Open `/check`, import URL or enter parameters, verify price, area, rooms,
   address, floor, building floors, year and market type.
5. Generate buyer/realtor/investor report from the draft or existing listing.
6. Manual QA before sending:
   - no source URL leaks in public report;
   - no photos, contacts or copied full description;
   - fair price confidence is visible;
   - missing data warnings are visible;
   - disclaimers are present;
   - developer block appears only when matched with enough confidence.
7. Send HTML/PDF report and ask for feedback:
   - Was the recommendation clear?
   - Did it change the offer/negotiation?
   - What was missing before viewing or signing zadatek?
   - Would the user pay again?
8. Record outcome: paid/unpaid, price, segment, source channel, objections,
   requested features, next follow-up date.

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
