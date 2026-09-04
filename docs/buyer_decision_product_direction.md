# Buyer Decision Product Direction

Дата обновления: 2026-08-27

## Current Assessment

Текущая оценка после честного product review:

- Product readiness: 7/10.
- Technical readiness: 9/10.

Вывод: WartoMetr технически уже шире, чем нужно для первой проверки рынка.
Главный риск - не отсутствие endpoints, а то, что продукт останется сильным
engineering demo без реальных пользователей, оплат и доверия.

До следующей крупной разработки действует validation gate:

- продать 20 отчетов незнакомым людям по 49-149 PLN, без friend/colleague bias;
- или закрыть 3 paid realtor bundle pilots с реальными клиентскими разговорами;
- получить минимум 5 случаев, где отчет изменил решение, помог сбить цену,
  показал проблему или ускорил отказ от плохого объекта.

До выполнения gate не начинать новые крупные направления: расширение enterprise,
новые dashboards, country expansion, rental/houses/commercial roadmap, широкий
news product или новый investor tooling.

## Product Question

Старый вопрос:

> Насколько хороша эта квартира?

Новый главный вопрос:

> Стоит ли мне покупать именно эту квартиру за эти деньги?

Scores остаются доказательствами, но не являются продуктом сами по себе.
Первый экран результата должен начинаться с решения:

- `BUY`: можно продолжать, если проверки чистые.
- `NEGOTIATE`: вариант интересный, но только по другой цене.
- `AVOID`: риск/цена/данные не оправдывают продолжение без сильного дисконта.
- `VERIFY FIRST`: данных недостаточно, нужно закрыть ключевые неизвестные.

## Ideal Buyer Flow

1. Пользователь вставляет ссылку или вводит параметры квартиры.
2. WartoMetr показывает один понятный verdict:
   `7.8/10 - хороший вариант, но не по текущей цене`.
3. Пользователь видит:
   - fair price range;
   - seller price;
   - recommended opening offer;
   - realistic deal range;
   - max reasonable offer before extra due diligence.
4. WartoMetr отвечает на семь вопросов:
   - сколько квартира реально стоит;
   - сколько предложить;
   - что с ней не так;
   - что с районом сейчас и через 3-10 лет;
   - что проверить в документах, квартире и доме;
   - сколько она будет стоить с налогами, кредитом, ремонтом и мебелью;
   - есть ли варианты лучше.
5. Actions after result:
   - подготовить вопросы продавцу;
   - подготовить стратегию торга;
   - follow/watch this listing;
   - compare with another listing;
   - full due diligence before zadatek.

## Priority Backlog

### P0 - Real Money And Trust

- [x] Создать paid beta tracking sheet/schema: lead source, segment, price paid,
  paid/unpaid, report type, decision impact, objections, refund risk, next follow-up.
- [x] Обновить `/beta` and `/pricing` copy around outcome: "не переплатить",
  "не купить проблему", "подготовиться к торгу", not generic analytics.
- [ ] Провести 20 paid buyer report sales before any new large product module.
- [ ] Провести 20 interviews, but prioritize paid attempts over free feedback.
- [ ] Записать manual QA checklist for every paid report before delivery.
- [ ] Legal/source review for sources that materially affect paid reports.

### P1 - Decision Verdict

- [x] Add `WartoMetr Verdict` object to analysis/report contract:
  `action`, `score_10`, `headline`, `seller_price`, `fair_price_range`,
  `opening_offer`, `realistic_deal_range`, `max_reasonable_offer`,
  `top_reasons`, `critical_unknowns`.
- [x] Make `/check`, listing detail and buyer report lead with verdict, not score cards.
- [x] Convert current `Investment/Risk/Negotiation` scores into supporting evidence.
- [x] Add tests for `BUY`, `NEGOTIATE`, `AVOID`, `VERIFY FIRST` scenarios.

### P1 - Property Due Diligence

- [x] Add due-diligence checklist model for secondary market:
  księga wieczysta, owner, mortgage, roszczenia, służebność, wspólnota debt,
  land status, użytkowanie wieczyste, czynsz, fundusz remontowy, building repairs,
  roof, facade, lift, pipes, electricity, heating, energy certificate,
  unauthorized works and area mismatch.
- [x] Add due-diligence checklist model for primary market:
  developer, project history, delays, legal/regulatory signals, rachunek
  powierniczy, permits, construction status, finish standard, prospekt
  informacyjny, handover date, delay penalties and warranties.
- [x] Add document upload/metadata plan: extract checklist signals without giving
  legal guarantees and without storing unnecessary personal data
  (`docs/document_upload_due_diligence_plan.md`).
- [x] Add `Full Due Diligence` report section with red flags, unknowns and
  recommended expert/legal checks.

### P1 - Negotiation Assistant

- [x] Replace score-only negotiation UI with:
  opening offer, likely deal range, walk-away price and seller argument script.
- [x] Include evidence: days on market, price reductions, comparables, supply
  growth, relist events, fair-price confidence and competing inventory.
- [x] Add seller-facing argument copy that user can use before/after viewing.

### P1 - Sources, Confidence And Unknowns

- [x] Add prominent `What we know / What we estimate / What we could not verify`
  block to `/check`, reports and compare.
- [x] Show source basis near major claims:
  comparables count, source class, market snapshots, official/open-data source,
  freshness date and confidence.
- [x] Add overall `check completeness` percentage.
- [x] Make "we do not know" visible for legal, technical, noise, debt and inside
  apartment condition gaps.

### P2 - Total Acquisition And Renovation Cost

- [x] Add renovation condition inputs: move-in ready, refresh, light renovation,
  full renovation, shell/developer standard, custom budget.
- [x] Calculate total acquisition cost: price, PCC/VAT context, notary/court,
  bank/credit costs, renovation, furniture and upfront cash.
- [x] Compare total cost against ready-to-move alternatives.
- [x] Add total-cost columns to compare: purchase, fees, renovation, furniture,
  total, fair value, delta and risk.

### P2 - Personalized Fit

- [x] Ask purchase intent at start: self, family with children, rental,
  investment, unsure.
- [x] Weight verdict reasons by intent.
- [x] Show intent-fit scores for self, family, rental, investment and unsure
  as supporting buyer-decision evidence.
- [x] Turn selected intent into `For you: X/10`, not only generic 0-100 scores.

### P2 - Pre/Post Viewing Assistant

- [x] Add pre-viewing mode: should view / skip, 5 positives, 5 risks,
  10 seller questions, what to photograph, what documents to request,
  what to check in building and around house.
- [x] Add post-viewing checklist: repair condition, windows, noise, smell,
  humidity, staircase, building state, orientation, kitchen/bathroom condition
  and renovation need.
- [x] Recompute verdict after post-viewing answers.

### P2 - Future Infrastructure Impact

- [ ] Turn future infrastructure from map points into impact narrative:
  distance, expected year, status, confidence, positive effects, temporary
  disruption and supply-pressure risk.
- [ ] Separate positive catalysts from negative/supply projects such as large
  housing developments nearby.

### P2 - Object Watch

- [ ] Add watch action for a checked object/draft.
- [x] Add object-specific watch trigger recommendations to buyer decision output.
- [ ] Alert when price changes, similar cheaper object appears, days-on-market
  crosses thresholds, planned investment status changes, developer signal changes
  or negotiation opportunity improves.
- [ ] Reuse alerts infrastructure, but make the UX object-specific.

### P3 - Expert Review

- [ ] Add manual product/package: `WartoMetr Expert Review`, 299-499 PLN.
- [ ] Workflow: automatic report plus analyst review of comparables, fair price,
  documents, risks, future infrastructure and negotiation strategy.
- [ ] Output must be marked `Verified by WartoMetr analyst` only after human QA.
- [ ] Track analyst time and refund/quality issues before automating more.

### P3 - Decision-Oriented Compare

- [x] Make compare answer "which one should I choose and why", not only matrix.
- [x] Include total acquisition cost, renovation cost, fair value delta,
  buyer fit, risk, negotiation range and unknowns.
- [x] Explain why the winning option beats alternatives and what would change
  the ranking.

## Pricing Ladder To Test

| Product | Price hypothesis | Purpose |
| --- | ---: | --- |
| Free Check | 0 PLN | teaser verdict, price position, 3 risks, basic infrastructure |
| Buyer Check | 49 PLN | fair price, comparables, history, district, risks, negotiation |
| Full Due Diligence | 149 PLN | Buyer Check plus documents, building risk, future development, total cost |
| Expert Review | 299-499 PLN | automated report plus human analyst review |
| Realtor Pro | 199-399 PLN/month | recurring reports, branding, compare, shortlist, workspace |

## Definition Of Done For Next Product Sprint

- The first visible result answers "buy, negotiate, avoid or verify first".
- User sees recommended opening offer and max reasonable offer before detailed
  score breakdown.
- User sees what WartoMetr does not know.
- Paid report QA catches source URL leaks, unsupported guarantees and missing
  disclaimers.
- Pricing/offers match the ladder above.
- No new large module starts before the validation gate is met.
