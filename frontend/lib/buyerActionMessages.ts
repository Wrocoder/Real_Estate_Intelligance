import type { BuyerActionEvidence, BuyerActionItem, BuyerActionPlan } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

type ActionPlanCatalog = {
  title: string;
  description: string;
  unavailable: string;
  phases: Record<BuyerActionItem["phase"], string>;
  priorities: Record<BuyerActionItem["priority"], string>;
  actions: Record<string, string>;
  evidence: Record<string, string>;
  unknownEvidence: string;
  evidenceLabel: string;
  progress: (completed: number, total: number) => string;
  copy: string;
  copied: string;
  copyFailed: string;
  exportTitle: string;
  exportEvidence: string;
};

const CATALOG: Record<Locale, ActionPlanCatalog> = {
  pl: {
    title: "Plan działania przed zakupem",
    description: "Zaznacz wykonane kroki. Dodatkowe kontrole wynikają z wykrytych ryzyk lub brakujących danych.",
    unavailable: "Ten starszy raport nie zawiera planu działania. Odśwież analizę mieszkania, aby go utworzyć.",
    phases: {
      before_offer: "Przed złożeniem oferty",
      on_viewing: "Podczas oględzin",
      after_viewing: "Po oględzinach",
    },
    priorities: { critical: "Krytyczne", high: "Ważne", medium: "Uzupełniające", low: "Opcjonalne" },
    actions: {
      verify_kw_owner: "Sprawdź właściciela i prawo sprzedającego do zawarcia umowy w Księdze Wieczystej.",
      verify_kw_encumbrances: "Sprawdź hipoteki, roszczenia, służebności i inne obciążenia Księgi Wieczystej.",
      request_debt_certificate: "Poproś o zaświadczenie o braku zaległości wobec wspólnoty lub spółdzielni.",
      review_monthly_costs: "Zweryfikuj czynsz, fundusz remontowy, media i ostatnie rozliczenia.",
      review_planned_repairs: "Sprawdź uchwały, fundusz remontowy i planowane remonty budynku.",
      verify_area_documents: "Porównaj powierzchnię i układ mieszkania z dokumentami.",
      inspect_installations: "Zweryfikuj stan instalacji elektrycznej, wodnej, grzewczej i wentylacji.",
      verify_developer_identity: "Sprawdź dewelopera, spółkę projektową i prawo do gruntu.",
      review_escrow_schedule: "Zweryfikuj rachunek powierniczy i harmonogram płatności.",
      verify_permits_and_title: "Sprawdź pozwolenie na budowę, tytuł do gruntu i status inwestycji.",
      review_prospekt_and_contract: "Przeczytaj prospekt, załączniki oraz projekt umowy deweloperskiej lub rezerwacyjnej.",
      review_delay_rights: "Sprawdź termin odbioru, kary za opóźnienie i prawo odstąpienia.",
      inspect_finish_standard: "Porównaj standard wykończenia z umową i listą płatnych dodatków.",
      ask_sale_context: "Zapytaj, dlaczego mieszkanie jest sprzedawane i jaki jest oczekiwany termin transakcji.",
      ask_included_items: "Ustal, co pozostaje w cenie: wyposażenie, parking i komórka lokatorska.",
      ask_monthly_costs: "Poproś sprzedającego o rzeczywiste miesięczne koszty i ostatnie rozliczenia.",
      ask_known_defects: "Zapytaj o przecieki, wilgoć, hałas, awarie, spory i znane wady.",
      ask_long_exposure: "Zapytaj, dlaczego oferta pozostaje na rynku od dłuższego czasu.",
      ask_price_history: "Zapytaj o wcześniejsze ceny i przyczynę obniżek.",
      inspect_apartment_condition: "Sprawdź stan mieszkania, okien, wentylacji, wilgoć i widoczne usterki.",
      photograph_defects: "Zrób zdjęcia usterek, instalacji i elementów wymagających wyceny naprawy.",
      inspect_common_areas: "Sprawdź klatkę, windę, elewację, piwnicę lub garaż i ogólny stan budynku.",
      record_viewing_findings: "Zapisz wyniki oględzin i przelicz decyzję przed ofertą lub zadatkiem.",
      compare_price_evidence: "Porównaj cenę z zakresem wartości i najbliższymi analogami.",
      compare_market_supply: "Sprawdź aktualne konkurencyjne oferty i czas sprzedaży podobnych mieszkań.",
      test_transport_route: "Przejdź realną trasę do przystanku i sprawdź częstotliwość połączeń.",
      inspect_noise: "Oceń hałas przy zamkniętych i otwartych oknach, także w godzinach szczytu.",
      inspect_industrial_context: "Sprawdź ruch ciężarowy, zapach, hałas i miejscowy plan wokół strefy przemysłowej.",
      inspect_building_systems: "Sprawdź instalacje, dach, elewację i presję na fundusz remontowy starszego budynku.",
      verify_rental_case: "Zweryfikuj czynsze najmu, pustostany, wyposażenie, podatki i opłaty przed decyzją inwestycyjną.",
      confirm_listing_parameters: "Potwierdź cenę, powierzchnię, piętro, rok budowy, adres i aktualność ogłoszenia.",
      verify_developer_record: "Sprawdź historię realizacji, opóźnienia, spory i podmiot podpisujący umowę.",
      verify_planning_projects: "Zweryfikuj źródło, przebieg, harmonogram i uciążliwość planowanych inwestycji.",
    },
    evidence: {
      listing_context: "Parametry i historia widoczne w źródle ogłoszenia.",
      documents_not_verified: "Ogłoszenie nie potwierdza stanu prawnego ani dokumentów transakcji.",
      condition_not_verified: "Stan techniczny nie został jeszcze potwierdzony podczas oględzin.",
      risk_price_position: "Klasyfikacja pozycji ceny względem szacowanego rynku.",
      risk_market_liquidity: "Klasyfikacja płynności i lokalnej podaży.",
      risk_weak_transport: "Dostępność transportu wymaga sprawdzenia.",
      risk_major_road_noise: "Bliskość głównej drogi wymaga oceny hałasu.",
      risk_industrial_zone: "Otoczenie przemysłowe wymaga kontroli na miejscu.",
      risk_building_age: "Wiek budynku wpływa na zakres kontroli technicznej.",
      risk_weak_rental_yield: "Scenariusz najmu wymaga potwierdzenia danymi rynkowymi.",
      risk_data_quality: "Część parametrów ogłoszenia ma ograniczoną jakość.",
      risk_developer_reputation: "Profil dewelopera zawiera sygnał wymagający weryfikacji.",
      risk_future_area_uncertainty: "Planowane inwestycje wymagają potwierdzenia źródła i harmonogramu.",
    },
    unknownEvidence: "Podstawa tego kroku wymaga dodatkowego potwierdzenia.",
    evidenceLabel: "Dlaczego ten krok",
    progress: (completed, total) => `Wykonano ${completed} z ${total}`,
    copy: "Kopiuj plan",
    copied: "Plan skopiowany",
    copyFailed: "Nie udało się skopiować planu",
    exportTitle: "WartoMetr - plan działania przed zakupem",
    exportEvidence: "Podstawa",
  },
  en: {
    title: "Action plan before purchase",
    description: "Mark completed steps. Additional checks come from detected risks or missing data.",
    unavailable: "This older report has no action plan. Refresh the apartment analysis to create it.",
    phases: { before_offer: "Before making an offer", on_viewing: "During the viewing", after_viewing: "After the viewing" },
    priorities: { critical: "Critical", high: "Important", medium: "Supporting", low: "Optional" },
    actions: {
      verify_kw_owner: "Verify the owner and seller's authority in the land and mortgage register.",
      verify_kw_encumbrances: "Check mortgages, claims, easements and other register encumbrances.",
      request_debt_certificate: "Request a certificate confirming no community or cooperative arrears.",
      review_monthly_costs: "Verify service charges, renovation fund, utilities and recent settlements.",
      review_planned_repairs: "Review resolutions, renovation fund and planned building works.",
      verify_area_documents: "Compare the apartment area and layout with official documents.",
      inspect_installations: "Verify electrical, plumbing, heating and ventilation systems.",
      verify_developer_identity: "Verify the developer, project company and land title.",
      review_escrow_schedule: "Verify the escrow account and payment schedule.",
      verify_permits_and_title: "Check the building permit, land title and project status.",
      review_prospekt_and_contract: "Review the prospectus, annexes and draft development or reservation agreement.",
      review_delay_rights: "Check handover dates, delay penalties and withdrawal rights.",
      inspect_finish_standard: "Compare the finish standard with the contract and paid extras.",
      ask_sale_context: "Ask why the property is being sold and what transaction timing is expected.",
      ask_included_items: "Confirm what stays in the price: furnishings, parking and storage.",
      ask_monthly_costs: "Ask for actual monthly costs and recent settlements.",
      ask_known_defects: "Ask about leaks, moisture, noise, failures, disputes and known defects.",
      ask_long_exposure: "Ask why the listing has remained on the market for a long time.",
      ask_price_history: "Ask about previous prices and reasons for reductions.",
      inspect_apartment_condition: "Inspect the apartment, windows, ventilation, moisture and visible defects.",
      photograph_defects: "Photograph defects, installations and items that need a repair estimate.",
      inspect_common_areas: "Inspect the staircase, lift, facade, basement or garage and building condition.",
      record_viewing_findings: "Record viewing findings and recalculate the decision before an offer or deposit.",
      compare_price_evidence: "Compare the price with the value range and closest comparables.",
      compare_market_supply: "Check competing listings and selling time for similar apartments.",
      test_transport_route: "Walk the real route to public transport and check service frequency.",
      inspect_noise: "Check noise with windows open and closed, including rush hour.",
      inspect_industrial_context: "Check truck traffic, smell, noise and the local plan around the industrial area.",
      inspect_building_systems: "Check systems, roof, facade and renovation-fund pressure in the older building.",
      verify_rental_case: "Verify rents, vacancy, furnishing, taxes and fees before an investment decision.",
      confirm_listing_parameters: "Confirm price, area, floor, building year, address and listing freshness.",
      verify_developer_record: "Check delivery history, delays, disputes and the entity signing the contract.",
      verify_planning_projects: "Verify the source, route, timing and disruption of planned projects.",
    },
    evidence: {
      listing_context: "Parameters and history visible in the listing source.",
      documents_not_verified: "The listing does not confirm legal status or transaction documents.",
      condition_not_verified: "Technical condition has not yet been confirmed during a viewing.",
      risk_price_position: "Price-position classification against the estimated market.",
      risk_market_liquidity: "Liquidity and local-supply classification.",
      risk_weak_transport: "Public transport access requires verification.",
      risk_major_road_noise: "Major-road proximity requires a noise check.",
      risk_industrial_zone: "Industrial surroundings require an on-site check.",
      risk_building_age: "Building age affects the technical inspection scope.",
      risk_weak_rental_yield: "The rental case requires market verification.",
      risk_data_quality: "Some listing parameters have limited quality.",
      risk_developer_reputation: "The developer profile contains a signal that needs verification.",
      risk_future_area_uncertainty: "Planned projects require source and schedule verification.",
    },
    unknownEvidence: "The basis for this step needs further confirmation.",
    evidenceLabel: "Why this step",
    progress: (completed, total) => `${completed} of ${total} completed`,
    copy: "Copy plan",
    copied: "Plan copied",
    copyFailed: "Could not copy the plan",
    exportTitle: "WartoMetr - action plan before purchase",
    exportEvidence: "Basis",
  },
  ru: {
    title: "План действий перед покупкой",
    description: "Отмечайте выполненные шаги. Дополнительные проверки связаны с выявленными рисками или нехваткой данных.",
    unavailable: "В этом старом отчёте нет плана действий. Обновите анализ квартиры, чтобы создать его.",
    phases: { before_offer: "До предложения", on_viewing: "На просмотре", after_viewing: "После просмотра" },
    priorities: { critical: "Критично", high: "Важно", medium: "Дополнительно", low: "Необязательно" },
    actions: {
      verify_kw_owner: "Проверьте собственника и полномочия продавца в земельно-ипотечном реестре.",
      verify_kw_encumbrances: "Проверьте ипотеку, требования, сервитуты и другие обременения реестра.",
      request_debt_certificate: "Запросите справку об отсутствии долгов перед товариществом или кооперативом.",
      review_monthly_costs: "Проверьте содержание, ремонтный фонд, коммунальные расходы и последние расчёты.",
      review_planned_repairs: "Проверьте решения, ремонтный фонд и плановые работы по дому.",
      verify_area_documents: "Сверьте площадь и планировку квартиры с документами.",
      inspect_installations: "Проверьте электрику, воду, отопление и вентиляцию.",
      verify_developer_identity: "Проверьте застройщика, проектную компанию и права на землю.",
      review_escrow_schedule: "Проверьте эскроу-счёт и график платежей.",
      verify_permits_and_title: "Проверьте разрешение на строительство, права на землю и статус проекта.",
      review_prospekt_and_contract: "Изучите проспект, приложения и проект договора с застройщиком или бронирования.",
      review_delay_rights: "Проверьте срок передачи, штрафы за задержку и право отказа.",
      inspect_finish_standard: "Сверьте стандарт отделки с договором и платными дополнениями.",
      ask_sale_context: "Спросите причину продажи и ожидаемый срок сделки.",
      ask_included_items: "Уточните, что входит в цену: мебель, парковка и кладовая.",
      ask_monthly_costs: "Запросите фактические ежемесячные расходы и последние расчёты.",
      ask_known_defects: "Спросите о протечках, сырости, шуме, авариях, спорах и известных дефектах.",
      ask_long_exposure: "Спросите, почему объявление долго остаётся на рынке.",
      ask_price_history: "Спросите о предыдущих ценах и причинах снижений.",
      inspect_apartment_condition: "Проверьте квартиру, окна, вентиляцию, сырость и видимые дефекты.",
      photograph_defects: "Сфотографируйте дефекты, коммуникации и всё, что требует оценки ремонта.",
      inspect_common_areas: "Проверьте подъезд, лифт, фасад, подвал или гараж и состояние дома.",
      record_viewing_findings: "Запишите результаты просмотра и пересчитайте решение до предложения или задатка.",
      compare_price_evidence: "Сравните цену с диапазоном стоимости и ближайшими аналогами.",
      compare_market_supply: "Проверьте конкурирующие объявления и срок продажи похожих квартир.",
      test_transport_route: "Пройдите реальный путь до остановки и проверьте частоту транспорта.",
      inspect_noise: "Проверьте шум с открытыми и закрытыми окнами, включая часы пик.",
      inspect_industrial_context: "Проверьте грузовой трафик, запах, шум и местный план рядом с промзоной.",
      inspect_building_systems: "Проверьте коммуникации, крышу, фасад и нагрузку на ремонтный фонд старого дома.",
      verify_rental_case: "Проверьте аренду, простой, меблировку, налоги и расходы до инвестиционного решения.",
      confirm_listing_parameters: "Подтвердите цену, площадь, этаж, год дома, адрес и актуальность объявления.",
      verify_developer_record: "Проверьте проекты, задержки, споры и компанию, подписывающую договор.",
      verify_planning_projects: "Проверьте источник, трассу, сроки и неудобства планируемых проектов.",
    },
    evidence: {
      listing_context: "Параметры и история из источника объявления.",
      documents_not_verified: "Объявление не подтверждает юридический статус и документы сделки.",
      condition_not_verified: "Техническое состояние ещё не подтверждено на просмотре.",
      risk_price_position: "Классификация цены относительно оценочного рынка.",
      risk_market_liquidity: "Классификация ликвидности и локального предложения.",
      risk_weak_transport: "Доступность транспорта требует проверки.",
      risk_major_road_noise: "Близость крупной дороги требует проверки шума.",
      risk_industrial_zone: "Промышленное окружение требует проверки на месте.",
      risk_building_age: "Возраст дома влияет на объём технической проверки.",
      risk_weak_rental_yield: "Арендный сценарий требует рыночной проверки.",
      risk_data_quality: "Качество части параметров объявления ограничено.",
      risk_developer_reputation: "В профиле застройщика есть сигнал для проверки.",
      risk_future_area_uncertainty: "Планируемые проекты требуют проверки источника и сроков.",
    },
    unknownEvidence: "Основание этого шага требует дополнительного подтверждения.",
    evidenceLabel: "Почему нужен шаг",
    progress: (completed, total) => `Выполнено ${completed} из ${total}`,
    copy: "Копировать план",
    copied: "План скопирован",
    copyFailed: "Не удалось скопировать план",
    exportTitle: "WartoMetr - план действий перед покупкой",
    exportEvidence: "Основание",
  },
  uk: {
    title: "План дій перед купівлею",
    description: "Позначайте виконані кроки. Додаткові перевірки пов'язані з виявленими ризиками або браком даних.",
    unavailable: "У цьому старому звіті немає плану дій. Оновіть аналіз квартири, щоб створити його.",
    phases: { before_offer: "До пропозиції", on_viewing: "Під час огляду", after_viewing: "Після огляду" },
    priorities: { critical: "Критично", high: "Важливо", medium: "Додатково", low: "Необов'язково" },
    actions: {
      verify_kw_owner: "Перевірте власника та повноваження продавця в земельно-іпотечному реєстрі.",
      verify_kw_encumbrances: "Перевірте іпотеки, вимоги, сервітути та інші обтяження реєстру.",
      request_debt_certificate: "Запросіть довідку про відсутність боргів перед спільнотою або кооперативом.",
      review_monthly_costs: "Перевірте утримання, ремонтний фонд, комунальні витрати та останні розрахунки.",
      review_planned_repairs: "Перевірте рішення, ремонтний фонд і заплановані роботи в будинку.",
      verify_area_documents: "Зіставте площу та планування квартири з документами.",
      inspect_installations: "Перевірте електрику, воду, опалення та вентиляцію.",
      verify_developer_identity: "Перевірте забудовника, проєктну компанію та право на землю.",
      review_escrow_schedule: "Перевірте ескроу-рахунок і графік платежів.",
      verify_permits_and_title: "Перевірте дозвіл на будівництво, право на землю та статус проєкту.",
      review_prospekt_and_contract: "Вивчіть проспект, додатки та проєкт договору із забудовником або бронювання.",
      review_delay_rights: "Перевірте строк передачі, штрафи за затримку та право відмови.",
      inspect_finish_standard: "Зіставте стандарт оздоблення з договором і платними доповненнями.",
      ask_sale_context: "Запитайте причину продажу та очікуваний строк угоди.",
      ask_included_items: "Уточніть, що входить у ціну: меблі, паркування та комора.",
      ask_monthly_costs: "Запросіть фактичні щомісячні витрати та останні розрахунки.",
      ask_known_defects: "Запитайте про протікання, вологу, шум, аварії, спори та відомі дефекти.",
      ask_long_exposure: "Запитайте, чому оголошення довго залишається на ринку.",
      ask_price_history: "Запитайте про попередні ціни та причини знижень.",
      inspect_apartment_condition: "Перевірте квартиру, вікна, вентиляцію, вологу та видимі дефекти.",
      photograph_defects: "Сфотографуйте дефекти, комунікації та все, що потребує оцінки ремонту.",
      inspect_common_areas: "Перевірте під'їзд, ліфт, фасад, підвал або гараж і стан будинку.",
      record_viewing_findings: "Запишіть результати огляду та перерахуйте рішення до пропозиції або завдатку.",
      compare_price_evidence: "Порівняйте ціну з діапазоном вартості та найближчими аналогами.",
      compare_market_supply: "Перевірте конкурентні оголошення та строк продажу схожих квартир.",
      test_transport_route: "Пройдіть реальний шлях до зупинки та перевірте частоту транспорту.",
      inspect_noise: "Перевірте шум із відкритими й закритими вікнами, зокрема в години пік.",
      inspect_industrial_context: "Перевірте вантажний рух, запах, шум і місцевий план біля промзони.",
      inspect_building_systems: "Перевірте комунікації, дах, фасад і навантаження на ремонтний фонд старого будинку.",
      verify_rental_case: "Перевірте оренду, простій, меблювання, податки та витрати до інвестиційного рішення.",
      confirm_listing_parameters: "Підтвердьте ціну, площу, поверх, рік будинку, адресу й актуальність оголошення.",
      verify_developer_record: "Перевірте проєкти, затримки, спори та компанію, що підписує договір.",
      verify_planning_projects: "Перевірте джерело, трасу, строки та незручності запланованих проєктів.",
    },
    evidence: {
      listing_context: "Параметри й історія з джерела оголошення.",
      documents_not_verified: "Оголошення не підтверджує юридичний статус і документи угоди.",
      condition_not_verified: "Технічний стан ще не підтверджено під час огляду.",
      risk_price_position: "Класифікація ціни відносно оцінкового ринку.",
      risk_market_liquidity: "Класифікація ліквідності та локальної пропозиції.",
      risk_weak_transport: "Доступність транспорту потребує перевірки.",
      risk_major_road_noise: "Близькість великої дороги потребує перевірки шуму.",
      risk_industrial_zone: "Промислове оточення потребує перевірки на місці.",
      risk_building_age: "Вік будинку впливає на обсяг технічної перевірки.",
      risk_weak_rental_yield: "Орендний сценарій потребує ринкової перевірки.",
      risk_data_quality: "Якість частини параметрів оголошення обмежена.",
      risk_developer_reputation: "У профілі забудовника є сигнал для перевірки.",
      risk_future_area_uncertainty: "Заплановані проєкти потребують перевірки джерела та строків.",
    },
    unknownEvidence: "Підстава цього кроку потребує додаткового підтвердження.",
    evidenceLabel: "Чому потрібен крок",
    progress: (completed, total) => `Виконано ${completed} з ${total}`,
    copy: "Копіювати план",
    copied: "План скопійовано",
    copyFailed: "Не вдалося скопіювати план",
    exportTitle: "WartoMetr - план дій перед купівлею",
    exportEvidence: "Підстава",
  },
};

export function actionPlanCopy(locale: Locale) {
  return CATALOG[locale];
}

export function actionLabel(item: BuyerActionItem, locale: Locale) {
  return CATALOG[locale].actions[item.code] ?? CATALOG[locale].unknownEvidence;
}

export function actionEvidenceLabel(evidence: BuyerActionEvidence, locale: Locale) {
  return CATALOG[locale].evidence[evidence.code] ?? CATALOG[locale].unknownEvidence;
}

export function actionPlanBrief(plan: BuyerActionPlan, locale: Locale) {
  const copy = CATALOG[locale];
  const evidenceById = new Map(plan.evidence.map((item) => [item.id, item]));
  const lines = [copy.exportTitle];
  for (const phase of ["before_offer", "on_viewing", "after_viewing"] as const) {
    const items = plan.items.filter((item) => item.phase === phase);
    if (!items.length) continue;
    lines.push("", `${copy.phases[phase]}:`);
    for (const item of items) {
      const sources = item.evidence_refs
        .flatMap((reference) => {
          const evidence = evidenceById.get(reference);
          return evidence ? [evidence.source_name] : [];
        })
        .filter((source, index, all) => all.indexOf(source) === index)
        .join(", ");
      const suffix = sources ? ` (${copy.exportEvidence}: ${sources})` : "";
      lines.push(`- ${actionLabel(item, locale)}${suffix}`);
    }
  }
  return lines.join("\n");
}
