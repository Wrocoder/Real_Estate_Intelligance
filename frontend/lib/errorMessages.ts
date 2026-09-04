import { ApiError } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

const COPY: Record<Locale, Record<string, string>> = {
  pl: {
    network_error: "Nie można połączyć się z usługą. Sprawdź połączenie i spróbuj ponownie.",
    auth_required: "Zaloguj się ponownie, aby kontynuować.",
    forbidden: "Nie masz uprawnień do tej czynności.",
    not_found: "Nie znaleziono tych danych. Odśwież stronę lub wróć do poprzedniego kroku.",
    conflict: "Nie można zapisać zmian, ponieważ dane są już aktualne.",
    validation_error: "Sprawdź wpisane dane i spróbuj ponownie.",
    service_unavailable: "Usługa jest chwilowo niedostępna. Spróbuj ponownie za chwilę.",
    request_failed: "Nie udało się wykonać operacji. Spróbuj ponownie.",
  },
  en: {
    network_error: "We could not reach the service. Check your connection and try again.",
    auth_required: "Sign in again to continue.",
    forbidden: "You do not have permission to do that.",
    not_found: "Those details could not be found. Refresh or return to the previous step.",
    conflict: "The change could not be saved because the data is already up to date.",
    validation_error: "Check the entered details and try again.",
    service_unavailable: "The service is temporarily unavailable. Try again shortly.",
    request_failed: "We could not complete that action. Try again.",
  },
  ru: {
    network_error: "Не удалось подключиться к сервису. Проверьте соединение и повторите попытку.",
    auth_required: "Войдите снова, чтобы продолжить.",
    forbidden: "У вас нет прав для этого действия.",
    not_found: "Эти данные не найдены. Обновите страницу или вернитесь на предыдущий шаг.",
    conflict: "Изменение не сохранено: данные уже обновлены.",
    validation_error: "Проверьте введённые данные и повторите попытку.",
    service_unavailable: "Сервис временно недоступен. Повторите попытку позже.",
    request_failed: "Не удалось выполнить действие. Повторите попытку.",
  },
  uk: {
    network_error: "Не вдалося підключитися до сервісу. Перевірте з'єднання та повторіть спробу.",
    auth_required: "Увійдіть знову, щоб продовжити.",
    forbidden: "У вас немає дозволу на цю дію.",
    not_found: "Ці дані не знайдено. Оновіть сторінку або поверніться на попередній крок.",
    conflict: "Зміни не збережено: дані вже оновлено.",
    validation_error: "Перевірте введені дані та повторіть спробу.",
    service_unavailable: "Сервіс тимчасово недоступний. Повторіть спробу пізніше.",
    request_failed: "Не вдалося виконати дію. Повторіть спробу.",
  },
};

export function localizedError(caught: unknown, locale: Locale, fallback?: string): string {
  if (caught instanceof ApiError) return COPY[locale][caught.code] ?? COPY[locale].request_failed;
  return fallback ?? COPY[locale].request_failed;
}
