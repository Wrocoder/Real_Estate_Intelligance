import type { Locale } from "@/lib/i18n";

export type LandingCopy = {
  buyer: {
    eyebrow: string;
    title: string;
    intro: string;
    checkAction: string;
    reportsAction: string;
    proofLabel: string;
    proof: Array<{ value: string; label: string }>;
    insideEyebrow: string;
    insideTitle: string;
    insideIntro: string;
    checks: Array<{ title: string; text: string }>;
    processEyebrow: string;
    processTitle: string;
    process: string[];
    complianceEyebrow: string;
    complianceTitle: string;
    compliance: string[];
    bottomAction: string;
  };
};

export const LANDING_COPY: Record<Locale, LandingCopy> = {
  en: {
    buyer: {
      eyebrow: "Wrocław and nearby areas",
      title: "Check an apartment before you buy",
      intro: "Enter an address or listing link. WartoMetr tells you whether to buy, negotiate, walk away, or verify critical unknowns first.",
      checkAction: "Check an apartment",
      reportsAction: "View reports",
      proofLabel: "WartoMetr buyer report details",
      proof: [
        { value: "29-49 PLN", label: "guide price for a full apartment report" },
        { value: "15 min", label: "quick check of a found apartment" },
        { value: "0 photos", label: "we do not copy portal photos or contacts" },
        { value: "Wrocław+", label: "Wrocław and nearby areas" },
      ],
      insideEyebrow: "What is in the report",
      insideTitle: "A decision about the apartment, not another listing",
      insideIntro: "The buyer report shows where you may save money, where the apartment may become a problem, and which arguments to use before making an offer.",
      checks: [
        { title: "Avoid overpaying", text: "See the market range, possible overpayment, opening offer, and a sensible maximum price." },
        { title: "Understand the area", text: "Check transport, schools, parks, planned investments, and factors that may improve or weaken the location." },
        { title: "Avoid hidden problems", text: "See legal and technical unknowns, noise, industrial zones, data gaps, and questions to ask before paying a deposit." },
        { title: "Prepare to negotiate", text: "Get seller questions, price arguments, a sensible limit, and a viewing checklist." },
      ],
      processEyebrow: "How it works",
      processTitle: "From a link to a transparent report",
      process: [
        "Paste an Otodom/OLX link or enter the address, price, area, and room count manually.",
        "Confirm the extracted details. We do not save photos, contacts, or the full listing text.",
        "Receive a buyer report with market range, risks, area evidence, seller questions, and a clear next step.",
      ],
      complianceEyebrow: "Data and trust",
      complianceTitle: "Less data, more clarity for your decision",
      compliance: [
        "The listing link is kept private and is not shown publicly.",
        "Comparisons use WartoMetr, partner data, and open city sources.",
        "The report is not a legal, financial, or investment guarantee.",
      ],
      bottomAction: "Start a check",
    },
  },
  pl: {
    buyer: {
      eyebrow: "Wrocław i okolice",
      title: "Sprawdź mieszkanie przed zakupem",
      intro: "Podaj adres lub link do ogłoszenia. WartoMetr pokaże, czy warto kupić, negocjować, zrezygnować albo najpierw wyjaśnić ważne niewiadome.",
      checkAction: "Sprawdź mieszkanie",
      reportsAction: "Zobacz raporty",
      proofLabel: "Szczegóły raportu kupującego WartoMetr",
      proof: [
        { value: "29-49 PLN", label: "orientacyjna cena pełnego raportu mieszkania" },
        { value: "15 min", label: "szybkie sprawdzenie znalezionego mieszkania" },
        { value: "0 zdjęć", label: "bez kopiowania zdjęć i kontaktów z portali" },
        { value: "Wrocław+", label: "Wrocław i najbliższe okolice" },
      ],
      insideEyebrow: "Co zawiera raport",
      insideTitle: "Decyzja dotycząca mieszkania, nie kolejne ogłoszenie",
      insideIntro: "Raport kupującego pokazuje, gdzie możesz oszczędzić, gdzie mieszkanie może stać się problemem i jakich argumentów użyć przed złożeniem oferty.",
      checks: [
        { title: "Nie przepłacaj", text: "Zobacz przedział rynkowy, możliwą nadpłatę, ofertę otwierającą i rozsądną cenę maksymalną." },
        { title: "Poznaj okolicę", text: "Sprawdź transport, szkoły, parki, planowane inwestycje i czynniki wpływające na lokalizację." },
        { title: "Unikaj ukrytych problemów", text: "Zobacz niewiadome prawne i techniczne, hałas, strefy przemysłowe, braki danych i pytania przed zadatkiem." },
        { title: "Przygotuj się do negocjacji", text: "Otrzymaj pytania do sprzedającego, argumenty cenowe, rozsądny limit i listę sprawdzeń na oglądaniu." },
      ],
      processEyebrow: "Jak to działa",
      processTitle: "Od linku do przejrzystego raportu",
      process: [
        "Wklej link z Otodom/OLX albo wpisz ręcznie adres, cenę, metraż i liczbę pokoi.",
        "Potwierdź odczytane dane. Nie zapisujemy zdjęć, kontaktów ani pełnej treści ogłoszenia.",
        "Otrzymaj raport kupującego z przedziałem rynkowym, ryzykami, dowodami z okolicy, pytaniami i następnym krokiem.",
      ],
      complianceEyebrow: "Dane i zaufanie",
      complianceTitle: "Mniej danych, więcej jasności przy decyzji",
      compliance: [
        "Link do ogłoszenia jest przechowywany prywatnie i nie jest publicznie wyświetlany.",
        "Porównania korzystają z WartoMetr, danych partnerów i otwartych źródeł miejskich.",
        "Raport nie jest gwarancją prawną, finansową ani inwestycyjną.",
      ],
      bottomAction: "Rozpocznij sprawdzanie",
    },
  },
  ru: {
    buyer: {
      eyebrow: "Вроцлав и ближайшие районы",
      title: "Проверьте квартиру перед покупкой",
      intro: "Введите адрес или ссылку на объявление. WartoMetr подскажет: покупать, торговаться, отказаться или сначала проверить критичные неизвестные.",
      checkAction: "Проверить квартиру",
      reportsAction: "Посмотреть отчёты",
      proofLabel: "Детали отчёта покупателя WartoMetr",
      proof: [
        { value: "29-49 PLN", label: "ориентир полной проверки квартиры" },
        { value: "15 минут", label: "быстрая проверка найденной квартиры" },
        { value: "0 фото", label: "без копирования фото и контактов порталов" },
        { value: "Wrocław+", label: "Вроцлав и ближайшие окрестности" },
      ],
      insideEyebrow: "Что входит в отчёт",
      insideTitle: "Решение по квартире, а не ещё одно объявление",
      insideIntro: "Отчёт покупателя показывает, где можно сэкономить, где квартира может стать проблемой и какие аргументы использовать до предложения.",
      checks: [
        { title: "Не переплатить", text: "Показываем рыночный диапазон, возможную переплату, стартовое предложение и разумную максимальную цену." },
        { title: "Понять район", text: "Проверяем транспорт, школы, парки, планируемые инвестиции и факторы, влияющие на локацию." },
        { title: "Не купить проблему", text: "Показываем юридические и технические неизвестные, шум, промышленные зоны, пробелы в данных и вопросы до задатка." },
        { title: "Подготовиться к торгу", text: "Собираем вопросы продавцу, аргументы по цене, разумный предел и список проверки на просмотре." },
      ],
      processEyebrow: "Как это работает",
      processTitle: "От ссылки к прозрачному отчёту",
      process: [
        "Вставьте ссылку Otodom/OLX или заполните адрес, цену, площадь и комнаты вручную.",
        "Подтвердите извлечённые данные. Мы не сохраняем фото, контакты и полный текст объявления.",
        "Получите отчёт покупателя с рыночным диапазоном, рисками, данными района, вопросами продавцу и следующим шагом.",
      ],
      complianceEyebrow: "Данные и доверие",
      complianceTitle: "Меньше данных, больше ясности для решения",
      compliance: [
        "Ссылка на объявление хранится приватно и не показывается публично.",
        "Сравнение строится на данных WartoMetr, партнёров и открытых городских источников.",
        "Отчёт не является юридической, финансовой или инвестиционной гарантией.",
      ],
      bottomAction: "Начать проверку",
    },
  },
  uk: {
    buyer: {
      eyebrow: "Вроцлав і найближчі райони",
      title: "Перевірте квартиру перед купівлею",
      intro: "Введіть адресу або посилання на оголошення. WartoMetr підкаже: купувати, торгуватися, відмовитися чи спочатку перевірити критичні невідомі.",
      checkAction: "Перевірити квартиру",
      reportsAction: "Переглянути звіти",
      proofLabel: "Деталі звіту покупця WartoMetr",
      proof: [
        { value: "29-49 PLN", label: "орієнтир повної перевірки квартири" },
        { value: "15 хвилин", label: "швидка перевірка знайденої квартири" },
        { value: "0 фото", label: "без копіювання фото й контактів порталів" },
        { value: "Wrocław+", label: "Вроцлав і найближчі околиці" },
      ],
      insideEyebrow: "Що містить звіт",
      insideTitle: "Рішення щодо квартири, а не ще одне оголошення",
      insideIntro: "Звіт покупця показує, де можна заощадити, де квартира може стати проблемою та які аргументи використати до пропозиції.",
      checks: [
        { title: "Не переплатити", text: "Показуємо ринковий діапазон, можливу переплату, стартову пропозицію та розумну максимальну ціну." },
        { title: "Зрозуміти район", text: "Перевіряємо транспорт, школи, парки, заплановані інвестиції та чинники, що впливають на локацію." },
        { title: "Не купити проблему", text: "Показуємо юридичні й технічні невідомі, шум, промислові зони, прогалини в даних і питання до завдатку." },
        { title: "Підготуватися до торгу", text: "Збираємо питання продавцю, аргументи щодо ціни, розумну межу та список перевірки під час перегляду." },
      ],
      processEyebrow: "Як це працює",
      processTitle: "Від посилання до прозорого звіту",
      process: [
        "Вставте посилання Otodom/OLX або введіть адресу, ціну, площу й кількість кімнат вручну.",
        "Підтвердьте отримані дані. Ми не зберігаємо фото, контакти й повний текст оголошення.",
        "Отримайте звіт покупця з ринковим діапазоном, ризиками, даними району, питаннями продавцю та наступним кроком.",
      ],
      complianceEyebrow: "Дані й довіра",
      complianceTitle: "Менше даних, більше ясності для рішення",
      compliance: [
        "Посилання на оголошення зберігається приватно й не показується публічно.",
        "Порівняння використовує дані WartoMetr, партнерів і відкритих міських джерел.",
        "Звіт не є юридичною, фінансовою чи інвестиційною гарантією.",
      ],
      bottomAction: "Почати перевірку",
    },
  },
};

export type RealtorLandingCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  reportsAction: string;
  openReportsAction: string;
  proofLabel: string;
  proof: Array<{ value: string; label: string }>;
  useCasesEyebrow: string;
  useCasesTitle: string;
  useCasesIntro: string;
  useCases: Array<{ title: string; text: string }>;
  packagesEyebrow: string;
  packagesTitle: string;
  packages: string[];
  complianceEyebrow: string;
  complianceTitle: string;
  compliance: string[];
  bottomAction: string;
};

export const REALTOR_COPY: Record<Locale, RealtorLandingCopy> = {
  en: {
    eyebrow: "Agencies and solo agents", title: "Analytics and reports for realtors", intro: "Turn a property, area, and price history into a client-ready report with negotiation arguments, market context, and a clear next step.", reportsAction: "Set up reports", openReportsAction: "Open reports", proofLabel: "Realtor report details", proof: [{ value: "5 reports", label: "package for the first client review" }, { value: "White-label", label: "your logo, colors, and notes" }, { value: "Client-ready", label: "PDF/HTML instead of manual tables" }, { value: "Wrocław", label: "focus on the city market and areas" }], useCasesEyebrow: "For your agency", useCasesTitle: "Less manual analysis, more evidence-based conversations", useCasesIntro: "WartoMetr answers recurring client questions about price, risk, area, comparable properties, negotiation, and the next step.", useCases: [{ title: "Client report", text: "Prepare a client PDF with price, comparables, area map, risks, and seller questions." }, { title: "Price arguments", text: "Show market range, price history, days on market, and negotiation arguments without manual tables." }, { title: "Area analytics", text: "Compare areas, infrastructure, planned investments, and market conditions for a client presentation." }, { title: "Agency team", text: "Use team roles, branding, and report history for a repeatable client process." }], packagesEyebrow: "Report packages", packagesTitle: "What you can offer or test today", packages: ["Apartment report before a viewing or offer.", "Area report for choosing a location and explaining the budget.", "Branded realtor report with your logo, colors, and notes.", "A shortlist of strong options for an investor or active buyer."], complianceEyebrow: "Trust", complianceTitle: "Reports do not replace an expert, but give clients a strong evidence base", compliance: ["Reports include caveats and source-linked explanations.", "Developer reputation is included when the developer can be identified.", "CSV/JSON export is available on professional plans."], bottomAction: "View reports"
  },
  pl: {
    eyebrow: "Biura i pośrednicy", title: "Analityka i raporty dla pośredników", intro: "Zamieniaj mieszkanie, okolicę i historię ceny w raport dla klienta z argumentami do negocjacji, kontekstem rynku i jasnym następnym krokiem.", reportsAction: "Włącz raporty", openReportsAction: "Otwórz raporty", proofLabel: "Szczegóły raportu dla pośrednika", proof: [{ value: "5 raportów", label: "pakiet na pierwszą analizę klienta" }, { value: "White-label", label: "logo, kolory i uwagi biura" }, { value: "Gotowe dla klienta", label: "PDF/HTML zamiast ręcznych tabel" }, { value: "Wrocław", label: "skupienie na rynku i dzielnicach miasta" }], useCasesEyebrow: "Dla Twojego biura", useCasesTitle: "Mniej ręcznej analityki, więcej rozmów opartych na dowodach", useCasesIntro: "WartoMetr odpowiada na powtarzalne pytania klienta o cenę, ryzyko, okolicę, podobne mieszkania, negocjacje i następny krok.", useCases: [{ title: "Raport dla klienta", text: "Przygotuj PDF z ceną, podobnymi mieszkaniami, mapą okolicy, ryzykami i pytaniami do sprzedającego." }, { title: "Argumenty cenowe", text: "Pokaż przedział rynkowy, historię ceny, czas na rynku i argumenty do negocjacji bez ręcznych tabel." }, { title: "Analityka dzielnic", text: "Porównuj dzielnice, infrastrukturę, planowane inwestycje i stan rynku na prezentacji dla klienta." }, { title: "Zespół biura", text: "Korzystaj z ról zespołu, brandingu i historii raportów w powtarzalnym procesie." }], packagesEyebrow: "Pakiety raportów", packagesTitle: "Co możesz zaoferować lub przetestować już dziś", packages: ["Raport mieszkania przed oglądaniem lub ofertą.", "Raport dzielnicy do wyboru lokalizacji i wyjaśnienia budżetu.", "Raport z logo, kolorami i uwagami Twojego biura.", "Lista mocnych propozycji dla inwestora lub aktywnego kupującego."], complianceEyebrow: "Zaufanie", complianceTitle: "Raporty nie zastępują eksperta, ale dają klientowi mocną bazę dowodów", compliance: ["Raporty zawierają zastrzeżenia i wyjaśnienia powiązane ze źródłami.", "Reputacja dewelopera jest dodawana, jeśli można go rozpoznać.", "Eksport CSV/JSON jest dostępny w planach profesjonalnych."], bottomAction: "Zobacz raporty"
  },
  ru: {
    eyebrow: "Агентства и частные риелторы", title: "Аналитика и отчёты для риелторов", intro: "Превращайте объект, район и историю цены в готовый для клиента отчёт с аргументами для торга, рыночным контекстом и ясным следующим шагом.", reportsAction: "Подключить отчёты", openReportsAction: "Открыть отчёты", proofLabel: "Детали отчёта риелтора", proof: [{ value: "5 отчётов", label: "пакет для первой проверки клиента" }, { value: "White-label", label: "логотип, цвета и оговорки агентства" }, { value: "Готово клиенту", label: "PDF/HTML вместо ручных таблиц" }, { value: "Wrocław", label: "фокус на рынке и районах города" }], useCasesEyebrow: "Для агентства", useCasesTitle: "Меньше ручной аналитики, больше разговоров на основе фактов", useCasesIntro: "WartoMetr отвечает на повторяющиеся вопросы клиента о цене, рисках, районе, похожих объектах, торге и следующем шаге.", useCases: [{ title: "Отчёт для клиента", text: "Подготовьте PDF с ценой, похожими объектами, картой района, рисками и вопросами продавцу." }, { title: "Аргументы по цене", text: "Покажите рыночный диапазон, историю цены, срок на рынке и аргументы для торга без ручных таблиц." }, { title: "Аналитика районов", text: "Сравнивайте районы, инфраструктуру, планируемые инвестиции и состояние рынка для презентации клиенту." }, { title: "Команда агентства", text: "Используйте роли команды, фирменное оформление и историю отчётов в повторяемом процессе." }], packagesEyebrow: "Пакеты отчётов", packagesTitle: "Что можно предложить или протестировать уже сейчас", packages: ["Отчёт по квартире до просмотра или предложения.", "Отчёт по району для выбора локации и объяснения бюджета.", "Брендированный отчёт с логотипом, цветами и оговорками агентства.", "Подборка сильных вариантов для инвестора или активного покупателя."], complianceEyebrow: "Доверие", complianceTitle: "Отчёты не заменяют эксперта, но дают клиенту сильную доказательную базу", compliance: ["В отчётах есть оговорки и объяснения со ссылками на источники.", "Репутация застройщика добавляется, если его удалось определить.", "Экспорт CSV/JSON доступен на профессиональных планах."], bottomAction: "Посмотреть отчёты"
  },
  uk: {
    eyebrow: "Агентства та приватні рієлтори", title: "Аналітика та звіти для рієлторів", intro: "Перетворюйте об'єкт, район та історію ціни на готовий для клієнта звіт з аргументами для торгу, ринковим контекстом і чітким наступним кроком.", reportsAction: "Підключити звіти", openReportsAction: "Відкрити звіти", proofLabel: "Деталі звіту рієлтора", proof: [{ value: "5 звітів", label: "пакет для першої перевірки клієнта" }, { value: "White-label", label: "логотип, кольори й примітки агентства" }, { value: "Готово клієнту", label: "PDF/HTML замість ручних таблиць" }, { value: "Wrocław", label: "фокус на ринку й районах міста" }], useCasesEyebrow: "Для агентства", useCasesTitle: "Менше ручної аналітики, більше розмов на основі фактів", useCasesIntro: "WartoMetr відповідає на повторювані питання клієнта про ціну, ризики, район, схожі об'єкти, торг і наступний крок.", useCases: [{ title: "Звіт для клієнта", text: "Підготуйте PDF із ціною, схожими об'єктами, картою району, ризиками та питаннями продавцю." }, { title: "Аргументи щодо ціни", text: "Покажіть ринковий діапазон, історію ціни, час на ринку й аргументи для торгу без ручних таблиць." }, { title: "Аналітика районів", text: "Порівнюйте райони, інфраструктуру, заплановані інвестиції та стан ринку для презентації клієнту." }, { title: "Команда агентства", text: "Використовуйте ролі команди, фірмове оформлення та історію звітів у повторюваному процесі." }], packagesEyebrow: "Пакети звітів", packagesTitle: "Що можна запропонувати або протестувати вже зараз", packages: ["Звіт про квартиру до перегляду або пропозиції.", "Звіт про район для вибору локації та пояснення бюджету.", "Брендований звіт із логотипом, кольорами й примітками агентства.", "Добірка сильних варіантів для інвестора або активного покупця."], complianceEyebrow: "Довіра", complianceTitle: "Звіти не замінюють експерта, але дають клієнту сильну доказову базу", compliance: ["У звітах є застереження та пояснення з посиланнями на джерела.", "Репутація забудовника додається, якщо його вдалося визначити.", "Експорт CSV/JSON доступний у професійних планах."], bottomAction: "Переглянути звіти"
  },
};
