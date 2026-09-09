import { ApiError } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

type ErrorMessageCode =
  | "network_error"
  | "auth_required"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "service_unavailable"
  | "bad_request"
  | "unsupported_area"
  | "location_unavailable"
  | "listing_not_found"
  | "unsupported_listing_source"
  | "confirmation_required"
  | "payload_too_large"
  | "rate_limited"
  | "internal_error"
  | "request_failed";

type ErrorCopy = Record<ErrorMessageCode, string> & {
  supportReference: (id: string) => string;
};

const COPY: Record<Locale, ErrorCopy> = {
  pl: {
    network_error: "Nie można połączyć się z usługą. Sprawdź połączenie i spróbuj ponownie.",
    auth_required: "Zaloguj się ponownie, aby kontynuować.",
    forbidden: "Nie masz uprawnień do tej czynności.",
    not_found: "Nie znaleziono tych danych. Odśwież stronę lub wróć do poprzedniego kroku.",
    conflict: "Nie można zapisać zmian, ponieważ dane są już aktualne.",
    validation_error: "Sprawdź wpisane dane i spróbuj ponownie.",
    service_unavailable: "Usługa jest chwilowo niedostępna. Spróbuj ponownie za chwilę.",
    bad_request: "Nie udało się sprawdzić tych danych. Otwórz formularz i uzupełnij wymagane pola.",
    unsupported_area:
      "Nie mamy jeszcze wystarczających danych dla tego miasta lub dzielnicy. Wybierz obsługiwany obszar albo uzupełnij dane ręcznie.",
    location_unavailable: "Nie udało się potwierdzić lokalizacji. Sprawdź adres i dzielnicę w formularzu.",
    listing_not_found: "Nie znaleziono jednej z wybranych ofert. Usuń ją z porównania i spróbuj ponownie.",
    unsupported_listing_source: "Nie można odczytać tego źródła. Użyj obsługiwanego linku albo wpisz dane ręcznie.",
    confirmation_required: "Potwierdź zgodę na prywatną analizę i spróbuj ponownie.",
    payload_too_large: "Plik lub formularz jest zbyt duży. Zmniejsz jego rozmiar i spróbuj ponownie.",
    rate_limited: "Wysłano zbyt wiele żądań. Odczekaj chwilę i spróbuj ponownie.",
    internal_error: "Nie udało się dokończyć operacji. Spróbuj ponownie; jeśli problem wróci, skontaktuj się z pomocą.",
    request_failed: "Nie udało się wykonać operacji. Spróbuj ponownie.",
    supportReference: (id) => `Identyfikator zgłoszenia: ${id}.`,
  },
  en: {
    network_error: "We could not reach the service. Check your connection and try again.",
    auth_required: "Sign in again to continue.",
    forbidden: "You do not have permission to do that.",
    not_found: "Those details could not be found. Refresh or return to the previous step.",
    conflict: "The change could not be saved because the data is already up to date.",
    validation_error: "Check the entered details and try again.",
    service_unavailable: "The service is temporarily unavailable. Try again shortly.",
    bad_request: "We could not check these details. Open the form and complete the required fields.",
    unsupported_area:
      "We do not have enough data for this city or district yet. Choose a supported area or complete the details manually.",
    location_unavailable: "We could not confirm the location. Check the address and district in the form.",
    listing_not_found: "One of the selected listings was not found. Remove it from the comparison and try again.",
    unsupported_listing_source: "This source could not be read. Use a supported link or enter the details manually.",
    confirmation_required: "Confirm consent for private analysis and try again.",
    payload_too_large: "The file or form is too large. Reduce its size and try again.",
    rate_limited: "Too many requests were sent. Wait a moment and try again.",
    internal_error: "We could not complete the action. Try again; contact support if the problem returns.",
    request_failed: "We could not complete that action. Try again.",
    supportReference: (id) => `Support reference: ${id}.`,
  },
  ru: {
    network_error: "Не удалось подключиться к сервису. Проверьте соединение и повторите попытку.",
    auth_required: "Войдите снова, чтобы продолжить.",
    forbidden: "У вас нет прав для этого действия.",
    not_found: "Эти данные не найдены. Обновите страницу или вернитесь на предыдущий шаг.",
    conflict: "Изменение не сохранено: данные уже обновлены.",
    validation_error: "Проверьте введённые данные и повторите попытку.",
    service_unavailable: "Сервис временно недоступен. Повторите попытку позже.",
    bad_request: "Не удалось проверить эти данные. Откройте форму и заполните обязательные поля.",
    unsupported_area:
      "Пока недостаточно данных для этого города или района. Выберите поддерживаемую область или заполните данные вручную.",
    location_unavailable: "Не удалось подтвердить расположение. Проверьте адрес и район в форме.",
    listing_not_found: "Одно из выбранных объявлений не найдено. Удалите его из сравнения и повторите попытку.",
    unsupported_listing_source:
      "Источник не удалось прочитать. Используйте поддерживаемую ссылку или введите данные вручную.",
    confirmation_required: "Подтвердите согласие на частный анализ и повторите попытку.",
    payload_too_large: "Файл или форма слишком большие. Уменьшите размер и повторите попытку.",
    rate_limited: "Отправлено слишком много запросов. Подождите и повторите попытку.",
    internal_error:
      "Не удалось завершить действие. Повторите попытку; если проблема повторится, обратитесь в поддержку.",
    request_failed: "Не удалось выполнить действие. Повторите попытку.",
    supportReference: (id) => `Код обращения: ${id}.`,
  },
  uk: {
    network_error: "Не вдалося підключитися до сервісу. Перевірте з'єднання та повторіть спробу.",
    auth_required: "Увійдіть знову, щоб продовжити.",
    forbidden: "У вас немає дозволу на цю дію.",
    not_found: "Ці дані не знайдено. Оновіть сторінку або поверніться на попередній крок.",
    conflict: "Зміни не збережено: дані вже оновлено.",
    validation_error: "Перевірте введені дані та повторіть спробу.",
    service_unavailable: "Сервіс тимчасово недоступний. Повторіть спробу пізніше.",
    bad_request: "Не вдалося перевірити ці дані. Відкрийте форму та заповніть обов'язкові поля.",
    unsupported_area:
      "Поки недостатньо даних для цього міста або району. Виберіть підтримувану область або заповніть дані вручну.",
    location_unavailable: "Не вдалося підтвердити розташування. Перевірте адресу та район у формі.",
    listing_not_found: "Одне з вибраних оголошень не знайдено. Видаліть його з порівняння й повторіть спробу.",
    unsupported_listing_source:
      "Джерело не вдалося прочитати. Використайте підтримуване посилання або введіть дані вручну.",
    confirmation_required: "Підтвердьте згоду на приватний аналіз і повторіть спробу.",
    payload_too_large: "Файл або форма завеликі. Зменште розмір і повторіть спробу.",
    rate_limited: "Надіслано забагато запитів. Зачекайте й повторіть спробу.",
    internal_error: "Не вдалося завершити дію. Повторіть спробу; якщо проблема повернеться, зверніться до підтримки.",
    request_failed: "Не вдалося виконати дію. Повторіть спробу.",
    supportReference: (id) => `Код звернення: ${id}.`,
  },
};

export function localizedError(caught: unknown, locale: Locale, fallback?: string): string {
  if (caught instanceof ApiError) {
    const copy = COPY[locale];
    const message = (copy as Record<string, string | ((id: string) => string)>)[caught.code];
    const localized = typeof message === "string" ? message : copy.request_failed;
    const shouldShowReference = caught.status >= 500 && caught.correlationId && caught.correlationId !== "unavailable";
    return shouldShowReference ? `${localized} ${copy.supportReference(caught.correlationId as string)}` : localized;
  }
  return fallback ?? COPY[locale].request_failed;
}
