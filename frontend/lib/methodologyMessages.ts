import type { Locale } from "./i18n";

type MethodologyCard = {
  title: string;
  body: string;
};

type MethodologySection = {
  title: string;
  body?: string;
  items: MethodologyCard[];
};

type MethodologyMessages = {
  eyebrow: string;
  title: string;
  intro: string;
  primaryAction: string;
  secondaryAction: string;
  trustFacts: MethodologyCard[];
  sections: MethodologySection[];
  backtesting: {
    title: string;
    body: string;
    metrics: MethodologyCard[];
  };
  limits: {
    title: string;
    items: string[];
  };
  verification: {
    title: string;
    body: string;
  };
};

export const methodologyMessages = {
  pl: {
    eyebrow: "Metodologia i zaufanie",
    title: "Jak WartoMetr wyjaśnia cenę, ryzyko i pewność analizy",
    intro:
      "WartoMetr ma pomóc kupującemu zrozumieć, czy konkretne mieszkanie warto dalej rozważać przy podanej cenie. Nie zastępuje rzeczoznawcy, prawnika ani oględzin technicznych.",
    primaryAction: "Sprawdź mieszkanie",
    secondaryAction: "Zobacz przewodniki",
    trustFacts: [
      {
        title: "Decyzja najpierw",
        body: "Najpierw pokazujemy wniosek dla kupującego, potem wyjaśnienie, dowody i następne kroki.",
      },
      {
        title: "Zakres zamiast fałszywej precyzji",
        body: "Fair price jest prezentowany jako zakres, bo dostępne dane zwykle nie uzasadniają jednej dokładnej kwoty.",
      },
      {
        title: "Nie ukrywamy słabych danych",
        body: "Jeżeli brakuje porównywalnych danych, świeżości albo źródeł, obniżamy pewność i pokazujemy ograniczenia.",
      },
    ],
    sections: [
      {
        title: "Jakie dane wykorzystujemy",
        items: [
          {
            title: "Dane źródłowe",
            body: "Ogłoszenia, dane partnerów, dozwolone rejestry transakcyjne, statystyki obszaru i informacje podane przez użytkownika.",
          },
          {
            title: "Dane pochodne",
            body: "Cena za m², mediany, zakres fair price, odległości, liczba obserwacji i kompletność danych są obliczane deterministycznie.",
          },
          {
            title: "Oceny modelu",
            body: "Werdykt, ryzyko, negocjacje i pewność są sygnałami wspierającymi decyzję, a nie gwarancją ceny transakcyjnej.",
          },
        ],
      },
      {
        title: "Jak powstaje fair price",
        body:
          "Model używa statystyk obszaru i, gdy jest wystarczająca próba, podobnych ofert lub obserwacji. Wynik jest zaokrąglany do praktycznego zakresu PLN.",
        items: [
          {
            title: "Porównywalność",
            body: "Liczą się lokalizacja, metraż, pokoje, rynek, typ budynku, stan, odległość i świeżość obserwacji.",
          },
          {
            title: "Próba i świeżość",
            body: "Mała próba, stare dane lub szeroki obszar doboru obniżają pewność i poszerzają zakres.",
          },
          {
            title: "Brak indywidualnego operatu",
            body: "Nie wykonujemy formalnej wyceny nieruchomości i nie potwierdzamy stanu prawnego ani technicznego mieszkania.",
          },
        ],
      },
      {
        title: "Co oznacza pewność",
        items: [
          {
            title: "High",
            body: "Wystarczająca, świeża i spójna próba podobnych obserwacji przy dobrym pokryciu danych mieszkania.",
          },
          {
            title: "Medium / Low",
            body: "Część danych jest słabsza: mniej podobnych obserwacji, większy rozrzut cen, starsze dane lub brak cech mieszkania.",
          },
          {
            title: "Insufficient",
            body: "Dane nie wystarczają do wiarygodnego zakresu. Wartość należy traktować jako bardzo ostrożny punkt odniesienia.",
          },
        ],
      },
    ],
    backtesting: {
      title: "Backtesting fair price",
      body:
        "Wewnętrzny backtest ukrywa cenę historycznej transakcji, używa tylko danych dostępnych przed tą transakcją i porównuje prognozę z ceną rzeczywistą. Publiczne metryki nie są jeszcze publikowane, dopóki próba produkcyjna nie przejdzie ręcznego przeglądu jakości.",
      metrics: [
        { title: "MAE", body: "Średni bezwzględny błąd w PLN." },
        { title: "MAPE", body: "Mediana bezwzględnego błędu procentowego." },
        { title: "Coverage", body: "Odsetek transakcji mieszczących się w przewidzianym zakresie." },
      ],
    },
    limits: {
      title: "Czego WartoMetr nie wie automatycznie",
      items: [
        "Nie potwierdza księgi wieczystej, roszczeń, zadłużenia ani stanu prawnego.",
        "Nie ocenia ukrytych wad technicznych, wilgoci, hałasu w konkretnych godzinach ani jakości wspólnoty bez danych.",
        "Nie zna ostatecznej ceny, którą zaakceptuje sprzedający.",
        "Nie zastępuje operatu szacunkowego, porady prawnej ani inspekcji technicznej.",
      ],
    },
    verification: {
      title: "Jak używać wyniku",
      body:
        "Traktuj analizę jako niezależne drugie spojrzenie przed decyzją. Najważniejsze punkty do weryfikacji pokazujemy w sekcji ryzyk, niewiadomych i następnych działań.",
    },
  },
  en: {
    eyebrow: "Methodology and trust",
    title: "How WartoMetr explains price, risk and confidence",
    intro:
      "WartoMetr helps a buyer decide whether a specific apartment is still worth considering at the stated price. It does not replace an appraiser, lawyer or technical inspection.",
    primaryAction: "Check an apartment",
    secondaryAction: "Read guides",
    trustFacts: [
      {
        title: "Decision first",
        body: "We show the buyer conclusion first, then explanation, evidence and next actions.",
      },
      {
        title: "Ranges over false precision",
        body: "Fair price is shown as a range because the available evidence usually does not justify one exact number.",
      },
      {
        title: "Weak evidence is visible",
        body: "When comparable data, freshness or source quality is weak, confidence is reduced and limitations are shown.",
      },
    ],
    sections: [
      {
        title: "Data we use",
        items: [
          {
            title: "Source data",
            body: "Listings, partner data, permitted transaction registers, area statistics and details provided by the user.",
          },
          {
            title: "Derived metrics",
            body: "Price per m², medians, fair-price range, distances, observation count and data completeness are deterministic calculations.",
          },
          {
            title: "Model estimates",
            body: "Verdict, risk, negotiation and confidence are decision-support signals, not guarantees of a transaction price.",
          },
        ],
      },
      {
        title: "How fair price is estimated",
        body:
          "The model uses area statistics and, when the sample is sufficient, similar offers or observations. The result is rounded into a practical PLN range.",
        items: [
          {
            title: "Comparability",
            body: "Location, size, rooms, market type, building type, condition, distance and observation freshness matter.",
          },
          {
            title: "Sample and freshness",
            body: "Small samples, stale data or a widened search area lower confidence and widen the range.",
          },
          {
            title: "Not a formal appraisal",
            body: "We do not perform an official valuation and do not confirm legal or technical condition.",
          },
        ],
      },
      {
        title: "What confidence means",
        items: [
          {
            title: "High",
            body: "A sufficient, fresh and consistent comparable sample with good coverage of apartment attributes.",
          },
          {
            title: "Medium / Low",
            body: "Some evidence is weaker: fewer similar observations, wider price dispersion, older data or missing apartment attributes.",
          },
          {
            title: "Insufficient",
            body: "Evidence is not enough for a reliable range. Treat the value as a cautious reference point.",
          },
        ],
      },
    ],
    backtesting: {
      title: "Fair-price backtesting",
      body:
        "The internal backtest hides a historical transaction price, uses only evidence available before that transaction and compares the prediction with the actual price. Public metrics are not published yet until the production sample passes manual quality review.",
      metrics: [
        { title: "MAE", body: "Mean absolute error in PLN." },
        { title: "MAPE", body: "Median absolute percentage error." },
        { title: "Coverage", body: "Share of transactions inside the predicted range." },
      ],
    },
    limits: {
      title: "What WartoMetr does not know automatically",
      items: [
        "It does not verify land and mortgage register entries, claims, debt or legal status.",
        "It does not detect hidden technical defects, moisture, time-specific noise or building community quality without data.",
        "It does not know the final price a seller will accept.",
        "It does not replace a formal appraisal, legal advice or technical inspection.",
      ],
    },
    verification: {
      title: "How to use the result",
      body:
        "Use the analysis as an independent second opinion before deciding. The most important checks are shown in risks, unknowns and next actions.",
    },
  },
  ru: {
    eyebrow: "Методология и доверие",
    title: "Как WartoMetr объясняет цену, риск и уверенность",
    intro:
      "WartoMetr помогает покупателю понять, стоит ли дальше рассматривать конкретную квартиру по указанной цене. Это не замена оценщика, юриста или технического осмотра.",
    primaryAction: "Проверить квартиру",
    secondaryAction: "Открыть гиды",
    trustFacts: [
      {
        title: "Сначала решение",
        body: "Сначала показываем вывод для покупателя, затем объяснение, доказательства и следующие действия.",
      },
      {
        title: "Диапазон вместо ложной точности",
        body: "Fair price показывается как диапазон, потому что данные обычно не оправдывают одну точную сумму.",
      },
      {
        title: "Слабые данные видны",
        body: "Если похожих данных мало, они старые или источник слабый, уверенность снижается и ограничения показываются явно.",
      },
    ],
    sections: [
      {
        title: "Какие данные используются",
        items: [
          {
            title: "Данные источника",
            body: "Объявления, партнёрские данные, разрешённые реестры сделок, статистика территории и параметры от пользователя.",
          },
          {
            title: "Расчётные метрики",
            body: "Цена за м², медианы, диапазон fair price, расстояния, число наблюдений и полнота данных считаются детерминированно.",
          },
          {
            title: "Оценки модели",
            body: "Вердикт, риск, переговорная позиция и уверенность помогают принять решение, но не гарантируют цену сделки.",
          },
        ],
      },
      {
        title: "Как оценивается fair price",
        body:
          "Модель использует статистику территории и, если выборка достаточна, похожие предложения или наблюдения. Результат округляется в практичный диапазон PLN.",
        items: [
          {
            title: "Сопоставимость",
            body: "Учитываются локация, площадь, комнаты, тип рынка, тип здания, состояние, расстояние и свежесть наблюдений.",
          },
          {
            title: "Выборка и свежесть",
            body: "Малая выборка, старые данные или расширенная география снижают уверенность и расширяют диапазон.",
          },
          {
            title: "Не официальный operat",
            body: "Мы не делаем формальную оценку недвижимости и не подтверждаем юридическое или техническое состояние.",
          },
        ],
      },
      {
        title: "Что означает уверенность",
        items: [
          {
            title: "High",
            body: "Достаточная, свежая и согласованная выборка похожих наблюдений при хорошем покрытии параметров квартиры.",
          },
          {
            title: "Medium / Low",
            body: "Часть данных слабее: меньше похожих наблюдений, выше разброс цен, старее данные или не хватает параметров квартиры.",
          },
          {
            title: "Insufficient",
            body: "Данных недостаточно для надёжного диапазона. Значение стоит воспринимать как осторожный ориентир.",
          },
        ],
      },
    ],
    backtesting: {
      title: "Backtesting fair price",
      body:
        "Внутренний backtest скрывает цену исторической сделки, использует только данные, доступные до этой сделки, и сравнивает прогноз с фактической ценой. Публичные метрики пока не публикуются, пока production-выборка не пройдёт ручную проверку качества.",
      metrics: [
        { title: "MAE", body: "Средняя абсолютная ошибка в PLN." },
        { title: "MAPE", body: "Медианная абсолютная процентная ошибка." },
        { title: "Coverage", body: "Доля сделок внутри прогнозного диапазона." },
      ],
    },
    limits: {
      title: "Что WartoMetr не знает автоматически",
      items: [
        "Не проверяет księga wieczysta, требования, долги или юридический статус.",
        "Не выявляет скрытые технические дефекты, влажность, шум в конкретные часы или качество wspólnota без данных.",
        "Не знает финальную цену, которую примет продавец.",
        "Не заменяет официальный operat szacunkowy, юридическую консультацию или технический осмотр.",
      ],
    },
    verification: {
      title: "Как использовать результат",
      body:
        "Используйте анализ как независимое второе мнение перед решением. Главные проверки показаны в рисках, неизвестных и следующих действиях.",
    },
  },
  uk: {
    eyebrow: "Методологія і довіра",
    title: "Як WartoMetr пояснює ціну, ризик і впевненість",
    intro:
      "WartoMetr допомагає покупцю зрозуміти, чи варто далі розглядати конкретну квартиру за вказаною ціною. Це не заміна оцінювача, юриста або технічного огляду.",
    primaryAction: "Перевірити квартиру",
    secondaryAction: "Відкрити гайди",
    trustFacts: [
      {
        title: "Спершу рішення",
        body: "Спочатку показуємо висновок для покупця, потім пояснення, докази і наступні дії.",
      },
      {
        title: "Діапазон замість хибної точності",
        body: "Fair price показується як діапазон, бо дані зазвичай не виправдовують одну точну суму.",
      },
      {
        title: "Слабкі дані видно",
        body: "Якщо схожих даних мало, вони старі або джерело слабке, впевненість знижується, а обмеження показуються явно.",
      },
    ],
    sections: [
      {
        title: "Які дані використовуються",
        items: [
          {
            title: "Дані джерела",
            body: "Оголошення, партнерські дані, дозволені реєстри угод, статистика території та параметри від користувача.",
          },
          {
            title: "Розрахункові метрики",
            body: "Ціна за м², медіани, діапазон fair price, відстані, кількість спостережень і повнота даних рахуються детерміновано.",
          },
          {
            title: "Оцінки моделі",
            body: "Вердикт, ризик, переговорна позиція і впевненість допомагають прийняти рішення, але не гарантують ціну угоди.",
          },
        ],
      },
      {
        title: "Як оцінюється fair price",
        body:
          "Модель використовує статистику території і, якщо вибірка достатня, схожі пропозиції або спостереження. Результат округлюється у практичний діапазон PLN.",
        items: [
          {
            title: "Порівнюваність",
            body: "Враховуються локація, площа, кімнати, тип ринку, тип будівлі, стан, відстань і свіжість спостережень.",
          },
          {
            title: "Вибірка і свіжість",
            body: "Мала вибірка, старі дані або ширша географія знижують впевненість і розширюють діапазон.",
          },
          {
            title: "Не офіційний operat",
            body: "Ми не робимо формальну оцінку нерухомості і не підтверджуємо юридичний або технічний стан.",
          },
        ],
      },
      {
        title: "Що означає впевненість",
        items: [
          {
            title: "High",
            body: "Достатня, свіжа і узгоджена вибірка схожих спостережень при доброму покритті параметрів квартири.",
          },
          {
            title: "Medium / Low",
            body: "Частина даних слабша: менше схожих спостережень, більший розкид цін, старіші дані або бракує параметрів квартири.",
          },
          {
            title: "Insufficient",
            body: "Даних недостатньо для надійного діапазону. Значення варто сприймати як обережний орієнтир.",
          },
        ],
      },
    ],
    backtesting: {
      title: "Backtesting fair price",
      body:
        "Внутрішній backtest приховує ціну історичної угоди, використовує лише дані, доступні до цієї угоди, і порівнює прогноз із фактичною ціною. Публічні метрики поки не публікуються, доки production-вибірка не пройде ручну перевірку якості.",
      metrics: [
        { title: "MAE", body: "Середня абсолютна помилка в PLN." },
        { title: "MAPE", body: "Медіанна абсолютна відсоткова помилка." },
        { title: "Coverage", body: "Частка угод усередині прогнозного діапазону." },
      ],
    },
    limits: {
      title: "Що WartoMetr не знає автоматично",
      items: [
        "Не перевіряє księga wieczysta, вимоги, борги або юридичний статус.",
        "Не виявляє приховані технічні дефекти, вологість, шум у конкретні години або якість wspólnota без даних.",
        "Не знає фінальну ціну, яку прийме продавець.",
        "Не замінює офіційний operat szacunkowy, юридичну консультацію або технічний огляд.",
      ],
    },
    verification: {
      title: "Як використовувати результат",
      body:
        "Використовуйте аналіз як незалежну другу думку перед рішенням. Головні перевірки показані у ризиках, невідомих і наступних діях.",
    },
  },
} satisfies Record<Locale, MethodologyMessages>;
