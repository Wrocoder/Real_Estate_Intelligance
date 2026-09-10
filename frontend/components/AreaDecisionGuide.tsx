"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, SearchCheck, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import type { AreaStatistics, PlannedInvestment } from "@/lib/api";
import { money, numberValue, percent } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

export type AreaInfrastructureCounts = {
  transport: number | null;
  schools: number | null;
  kindergartens: number | null;
  amenities: number | null;
  industrialZones: number | null;
};

type Copy = {
  title: string;
  conditional: string;
  priceEvidence: string;
  strength: Record<"high" | "medium" | "low", string>;
  transactionSummary: (name: string, median: string, sample: string) => string;
  listingSummary: (name: string, median: string) => string;
  priceUnavailableSummary: (name: string) => string;
  evidenceReason: (sample: string, period: string) => string;
  forWhom: string;
  avoidIf: string;
  checks: string;
  alternatives: string;
  alternativesNote: string;
  noAlternatives: string;
  priceDifference: (value: string) => string;
  considerPrice: string;
  considerTransport: (count: string) => string;
  considerFamily: (schools: string, kindergartens: string) => string;
  considerInvestment: string;
  avoidInfrastructureUnknown: string;
  avoidInfrastructureEmpty: string;
  avoidInfrastructurePartial: string;
  avoidIndustrial: (count: string) => string;
  avoidInvestmentUnknown: string;
  checkAddress: string;
  checkDocuments: string;
  checkRental: string;
  checkProjects: string;
  searchArea: string;
  compareAreas: string;
  unknownPeriod: string;
};

const COPY: Record<Locale, Copy> = {
  pl: {
    title: "Czy to osiedle pasuje do Twojego zakupu?",
    conditional: "Wniosek warunkowy",
    priceEvidence: "Siła danych cenowych",
    strength: { high: "wysoka", medium: "średnia", low: "niska" },
    transactionSummary: (name, median, sample) =>
      `${name}: mediana ${median}/m² wynika z ${sample} zarejestrowanych transakcji. To punkt odniesienia dla ceny, nie ocena konkretnego adresu.`,
    listingSummary: (name, median) =>
      `${name}: dostępne ogłoszenia wskazują medianę ${median}/m². To poziom cen ofertowych, a nie potwierdzona cena transakcyjna.`,
    priceUnavailableSummary: (name) => `${name}: brakuje wiarygodnej mediany ceny, więc nie można jeszcze zbudować porównania cenowego.`,
    evidenceReason: (sample, period) => `${sample} obserwacji · okres ${period}`,
    forWhom: "Może pasować, jeśli",
    avoidIf: "Może nie pasować, jeśli",
    checks: "Co sprawdzić przed decyzją",
    alternatives: "Alternatywy do porównania",
    alternativesNote: "Osiedla o najbardziej zbliżonej medianie w tym samym miejskim zbiorze.",
    noAlternatives: "Brak wystarczających danych do wskazania porównywalnych osiedli.",
    priceDifference: (value) => `${value} względem tego osiedla`,
    considerPrice: "chcesz najpierw porównać cenę konkretnego mieszkania z lokalnym poziomem rynku",
    considerTransport: (count) => `ważny jest transport i chcesz zweryfikować ${count} rekordów przystanków w bazie`,
    considerFamily: (schools, kindergartens) => `szukasz infrastruktury rodzinnej: baza zawiera ${schools} szkół i ${kindergartens} przedszkoli`,
    considerInvestment: "akceptujesz osobne sprawdzenie czynszu, pustostanów i płynności konkretnego mieszkania",
    avoidInfrastructureUnknown: "potrzebujesz potwierdzonego obrazu codziennej infrastruktury, a część źródeł jest teraz niedostępna",
    avoidInfrastructureEmpty: "oczekujesz kompletnego katalogu infrastruktury - brak rekordów nie potwierdza braku obiektów w terenie",
    avoidInfrastructurePartial: "potrzebujesz pełnego porównania infrastruktury - obecny zbiór ma luki dla części kategorii",
    avoidIndustrial: (count) => `jesteś wrażliwy na hałas lub ruch: baza wskazuje ${count} rekordów stref przemysłowych do sprawdzenia`,
    avoidInvestmentUnknown: "chcesz podjąć decyzję inwestycyjną wyłącznie na podstawie tej strony - brak tu danych o czynszu, pustostanach i rentowności",
    checkAddress: "Sprawdź dojazd, hałas, usługi i otoczenie pod dokładnym adresem.",
    checkDocuments: "Porównaj cenę mieszkania z transakcjami o podobnym metrażu, wieku i stanie.",
    checkRental: "Dla inwestycji policz czynsz, koszty, pustostan i realną płynność odsprzedaży.",
    checkProjects: "Zweryfikuj harmonogram, dokładny przebieg i etap każdej planowanej inwestycji.",
    searchArea: "Znajdź mieszkania w tym osiedlu",
    compareAreas: "Porównaj osiedla",
    unknownPeriod: "niepodany",
  },
  en: {
    title: "Does this neighborhood fit your purchase?",
    conditional: "Conditional conclusion",
    priceEvidence: "Strength of price evidence",
    strength: { high: "high", medium: "medium", low: "low" },
    transactionSummary: (name, median, sample) =>
      `${name}: the ${median}/m² median is based on ${sample} registered transactions. It is a price benchmark, not an assessment of a specific address.`,
    listingSummary: (name, median) =>
      `${name}: available listings indicate a ${median}/m² median. This is asking-price context, not a confirmed transaction price.`,
    priceUnavailableSummary: (name) => `${name}: a reliable median price is unavailable, so a price comparison cannot yet be made.`,
    evidenceReason: (sample, period) => `${sample} observations · period ${period}`,
    forWhom: "It may fit if",
    avoidIf: "It may not fit if",
    checks: "What to verify before deciding",
    alternatives: "Alternatives to compare",
    alternativesNote: "Neighborhoods with the closest median in the same city dataset.",
    noAlternatives: "There is not enough data to identify comparable neighborhoods.",
    priceDifference: (value) => `${value} versus this neighborhood`,
    considerPrice: "you want to compare a specific apartment price with the local market level first",
    considerTransport: (count) => `transport matters and you want to inspect ${count} stop records in the dataset`,
    considerFamily: (schools, kindergartens) => `you need family infrastructure: the dataset contains ${schools} schools and ${kindergartens} kindergartens`,
    considerInvestment: "you will separately verify rent, vacancy and the liquidity of the specific apartment",
    avoidInfrastructureUnknown: "you need a verified view of daily infrastructure while some sources are currently unavailable",
    avoidInfrastructureEmpty: "you expect a complete infrastructure directory - no records do not prove that facilities are absent",
    avoidInfrastructurePartial: "you need a complete infrastructure comparison - the current dataset has gaps in some categories",
    avoidIndustrial: (count) => `you are sensitive to noise or traffic: the dataset has ${count} industrial-zone records to check`,
    avoidInvestmentUnknown: "you want to make an investment decision from this page alone - rent, vacancy and yield data are unavailable",
    checkAddress: "Check commute, noise, services and surroundings for the exact address.",
    checkDocuments: "Compare the apartment with transactions of similar size, age and condition.",
    checkRental: "For investment, calculate rent, costs, vacancy and realistic resale liquidity.",
    checkProjects: "Verify the schedule, exact route and stage of each planned project.",
    searchArea: "Find apartments in this neighborhood",
    compareAreas: "Compare neighborhoods",
    unknownPeriod: "not supplied",
  },
  ru: {
    title: "Подходит ли район для вашей покупки?",
    conditional: "Условный вывод",
    priceEvidence: "Надёжность данных о цене",
    strength: { high: "высокая", medium: "средняя", low: "низкая" },
    transactionSummary: (name, median, sample) =>
      `${name}: медиана ${median}/м² рассчитана по ${sample} зарегистрированным сделкам. Это ориентир цены, а не оценка конкретного адреса.`,
    listingSummary: (name, median) =>
      `${name}: доступные объявления дают медиану ${median}/м². Это уровень цен предложения, а не подтверждённая цена сделки.`,
    priceUnavailableSummary: (name) => `${name}: надёжная медиана цены отсутствует, поэтому сравнение цен пока невозможно.`,
    evidenceReason: (sample, period) => `${sample} наблюдений · период ${period}`,
    forWhom: "Может подойти, если",
    avoidIf: "Может не подойти, если",
    checks: "Что проверить до решения",
    alternatives: "Альтернативы для сравнения",
    alternativesNote: "Районы с наиболее близкой медианой в том же городском наборе.",
    noAlternatives: "Недостаточно данных, чтобы показать сопоставимые районы.",
    priceDifference: (value) => `${value} относительно этого района`,
    considerPrice: "вы хотите сначала сравнить цену квартиры с местным уровнем рынка",
    considerTransport: (count) => `важен транспорт и вы готовы проверить ${count} записей об остановках в наборе`,
    considerFamily: (schools, kindergartens) => `нужна семейная инфраструктура: в наборе есть ${schools} школ и ${kindergartens} детских садов`,
    considerInvestment: "вы отдельно проверите аренду, простой и ликвидность конкретной квартиры",
    avoidInfrastructureUnknown: "вам нужен подтверждённый обзор повседневной инфраструктуры, а часть источников сейчас недоступна",
    avoidInfrastructureEmpty: "вы ожидаете полный каталог инфраструктуры - отсутствие записей не доказывает отсутствие объектов",
    avoidInfrastructurePartial: "вам нужно полное сравнение инфраструктуры - в текущем наборе есть пробелы по отдельным категориям",
    avoidIndustrial: (count) => `вы чувствительны к шуму или движению: в наборе есть ${count} записей промышленных зон для проверки`,
    avoidInvestmentUnknown: "вы хотите принять инвестиционное решение только по этой странице - данных об аренде, простое и доходности нет",
    checkAddress: "Проверьте транспорт, шум, услуги и окружение по точному адресу.",
    checkDocuments: "Сравните квартиру со сделками похожей площади, возраста и состояния.",
    checkRental: "Для инвестиции рассчитайте аренду, расходы, простой и реальную ликвидность перепродажи.",
    checkProjects: "Проверьте сроки, точный маршрут и этап каждого планируемого проекта.",
    searchArea: "Найти квартиры в этом районе",
    compareAreas: "Сравнить районы",
    unknownPeriod: "не указан",
  },
  uk: {
    title: "Чи підходить район для вашої купівлі?",
    conditional: "Умовний висновок",
    priceEvidence: "Надійність даних про ціну",
    strength: { high: "висока", medium: "середня", low: "низька" },
    transactionSummary: (name, median, sample) =>
      `${name}: медіана ${median}/м² розрахована за ${sample} зареєстрованими угодами. Це орієнтир ціни, а не оцінка конкретної адреси.`,
    listingSummary: (name, median) =>
      `${name}: доступні оголошення дають медіану ${median}/м². Це рівень цін пропозиції, а не підтверджена ціна угоди.`,
    priceUnavailableSummary: (name) => `${name}: надійної медіани ціни немає, тому порівняння цін поки неможливе.`,
    evidenceReason: (sample, period) => `${sample} спостережень · період ${period}`,
    forWhom: "Може підійти, якщо",
    avoidIf: "Може не підійти, якщо",
    checks: "Що перевірити до рішення",
    alternatives: "Альтернативи для порівняння",
    alternativesNote: "Райони з найближчою медіаною в тому самому міському наборі.",
    noAlternatives: "Недостатньо даних, щоб показати зіставні райони.",
    priceDifference: (value) => `${value} відносно цього району`,
    considerPrice: "ви хочете спочатку порівняти ціну квартири з місцевим рівнем ринку",
    considerTransport: (count) => `важливий транспорт і ви готові перевірити ${count} записів про зупинки в наборі`,
    considerFamily: (schools, kindergartens) => `потрібна сімейна інфраструктура: у наборі є ${schools} шкіл і ${kindergartens} дитсадків`,
    considerInvestment: "ви окремо перевірите оренду, простій і ліквідність конкретної квартири",
    avoidInfrastructureUnknown: "вам потрібен підтверджений огляд щоденної інфраструктури, а частина джерел зараз недоступна",
    avoidInfrastructureEmpty: "ви очікуєте повний каталог інфраструктури - відсутність записів не доводить відсутність об'єктів",
    avoidInfrastructurePartial: "вам потрібне повне порівняння інфраструктури - у поточному наборі є прогалини за окремими категоріями",
    avoidIndustrial: (count) => `ви чутливі до шуму або руху: у наборі є ${count} записів промислових зон для перевірки`,
    avoidInvestmentUnknown: "ви хочете прийняти інвестиційне рішення лише за цією сторінкою - даних про оренду, простій і дохідність немає",
    checkAddress: "Перевірте транспорт, шум, послуги й оточення за точною адресою.",
    checkDocuments: "Порівняйте квартиру з угодами схожої площі, віку та стану.",
    checkRental: "Для інвестиції розрахуйте оренду, витрати, простій і реальну ліквідність перепродажу.",
    checkProjects: "Перевірте строки, точний маршрут і етап кожного запланованого проєкту.",
    searchArea: "Знайти квартири в цьому районі",
    compareAreas: "Порівняти райони",
    unknownPeriod: "не вказано",
  },
};

export function AreaDecisionGuide({
  area,
  infrastructure,
  investments,
  alternatives,
  locale,
}: {
  area: AreaStatistics;
  infrastructure: AreaInfrastructureCounts;
  investments: PlannedInvestment[] | null;
  alternatives: AreaStatistics[] | null;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const transactionBased = area.price_basis === "transaction_observed";
  const sampleSize = area.data_provenance.sample_size
    ?? (transactionBased ? area.transaction_observation_count : area.active_listings);
  const hasPriceEvidence = area.median_price_per_m2 > 0;
  const completeProvenance = Boolean(
    area.data_provenance.source_name
      && area.data_provenance.updated_at
      && area.data_provenance.time_range,
  );
  const evidenceStrength = !hasPriceEvidence || area.data_provenance.mode === "demo"
    ? "low"
    : sampleSize >= 50 && completeProvenance
      ? "high"
      : sampleSize >= 20
        ? "medium"
        : "low";
  const period = area.data_provenance.time_range ?? copy.unknownPeriod;
  const infrastructureValues = [
    infrastructure.transport,
    infrastructure.schools,
    infrastructure.kindergartens,
    infrastructure.amenities,
    infrastructure.industrialZones,
  ];
  const allInfrastructureUnavailable = infrastructureValues.every((value) => value === null);
  const allInfrastructureEmpty = infrastructureValues.every((value) => value === 0);
  const partialInfrastructure = infrastructureValues.some(
    (value) => value === null || value === 0,
  );
  const comparableAreas = (alternatives ?? [])
    .filter((candidate) => candidate.city === area.city && candidate.area_id !== area.area_id)
    .filter((candidate) => candidate.median_price_per_m2 > 0)
    .filter(() => hasPriceEvidence)
    .sort(
      (left, right) =>
        Math.abs(left.median_price_per_m2 - area.median_price_per_m2) -
        Math.abs(right.median_price_per_m2 - area.median_price_per_m2),
    )
    .slice(0, 3);

  const suitableFor = hasPriceEvidence ? [copy.considerPrice] : [];
  if (infrastructure.transport && infrastructure.transport > 0) {
    suitableFor.push(copy.considerTransport(numberValue(infrastructure.transport, locale)));
  }
  const schoolCount = infrastructure.schools ?? 0;
  const kindergartenCount = infrastructure.kindergartens ?? 0;
  if (schoolCount + kindergartenCount > 0) {
    suitableFor.push(
      copy.considerFamily(
        numberValue(schoolCount, locale),
        numberValue(kindergartenCount, locale),
      ),
    );
  }
  suitableFor.push(copy.considerInvestment);

  const avoidIf = [copy.avoidInvestmentUnknown];
  if (allInfrastructureUnavailable) avoidIf.unshift(copy.avoidInfrastructureUnknown);
  else if (allInfrastructureEmpty) avoidIf.unshift(copy.avoidInfrastructureEmpty);
  else if (partialInfrastructure) avoidIf.unshift(copy.avoidInfrastructurePartial);
  if (infrastructure.industrialZones && infrastructure.industrialZones > 0) {
    avoidIf.unshift(
      copy.avoidIndustrial(numberValue(infrastructure.industrialZones, locale)),
    );
  }

  return (
    <section className="area-decision-guide" aria-labelledby="area-decision-title">
      <div className="area-decision-heading">
        <div>
          <span className="status-pill warning">{copy.conditional}</span>
          <h2 id="area-decision-title">{copy.title}</h2>
        </div>
        <div className="area-evidence-strength">
          <span>{copy.priceEvidence}</span>
          <strong>{copy.strength[evidenceStrength]}</strong>
          <small>{copy.evidenceReason(numberValue(sampleSize, locale), period)}</small>
        </div>
      </div>

      <p className="area-decision-summary">
        {!hasPriceEvidence
          ? copy.priceUnavailableSummary(area.name)
          : transactionBased
          ? copy.transactionSummary(
              area.name,
              money(area.median_price_per_m2, locale),
              numberValue(sampleSize, locale),
            )
          : copy.listingSummary(area.name, money(area.median_price_per_m2, locale))}
      </p>

      <div className="area-decision-columns">
        <DecisionList icon={<SearchCheck aria-hidden="true" size={18} />} items={suitableFor} title={copy.forWhom} />
        <DecisionList icon={<CircleAlert aria-hidden="true" size={18} />} items={avoidIf} title={copy.avoidIf} />
      </div>

      <div className="area-next-checks">
        <h3><ShieldCheck aria-hidden="true" size={18} /> {copy.checks}</h3>
        <ol>
          <li>{copy.checkAddress}</li>
          <li>{copy.checkDocuments}</li>
          <li>{copy.checkRental}</li>
          {investments?.length ? <li>{copy.checkProjects}</li> : null}
        </ol>
      </div>

      <div className="area-alternatives">
        <div>
          <h3>{copy.alternatives}</h3>
          <p>{copy.alternativesNote}</p>
        </div>
        {comparableAreas.length ? (
          <div className="area-alternative-list">
            {comparableAreas.map((candidate) => {
              const difference =
                ((candidate.median_price_per_m2 - area.median_price_per_m2) /
                  area.median_price_per_m2) *
                100;
              return (
                <Link href={`/areas/${encodeURIComponent(candidate.area_id)}`} key={candidate.area_id}>
                  <span>{candidate.name}</span>
                  <strong>{money(candidate.median_price_per_m2, locale)}/m²</strong>
                  <small>{copy.priceDifference(percent(difference, locale))}</small>
                </Link>
              );
            })}
          </div>
        ) : <p className="muted">{copy.noAlternatives}</p>}
      </div>

      <div className="toolbar area-decision-actions">
        <Link className="button primary" href={`/?district=${encodeURIComponent(area.name)}`}>
          {copy.searchArea} <ArrowRight size={16} />
        </Link>
        <Link className="button" href={`/areas/compare?area=${encodeURIComponent(area.area_id)}`}>
          {copy.compareAreas}
        </Link>
      </div>
    </section>
  );
}

function DecisionList({ icon, items, title }: { icon: ReactNode; items: string[]; title: string }) {
  return (
    <div>
      <h3>{icon} {title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
