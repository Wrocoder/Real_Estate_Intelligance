"use client";

import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { ApiError, api } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { useLocalePreference } from "@/lib/useLocalePreference";

const COPY: Record<Locale, {
  title: string;
  registerTitle: string;
  subtitle: string;
  login: string;
  register: string;
  name: string;
  email: string;
  password: string;
  showPassword: string;
  hidePassword: string;
  submitLogin: string;
  submitRegister: string;
  busy: string;
  invalid: string;
  exists: string;
  generic: string;
}> = {
  pl: {
    title: "Zaloguj się do WartoMetr",
    registerTitle: "Utwórz konto w WartoMetr",
    subtitle: "Twoje zapisane mieszkania, alerty i raporty są dostępne tylko na Twoim koncie.",
    login: "Logowanie",
    register: "Nowe konto",
    name: "Imię",
    email: "Adres e-mail",
    password: "Hasło (minimum 10 znaków)",
    showPassword: "Pokaż hasło",
    hidePassword: "Ukryj hasło",
    submitLogin: "Zaloguj się",
    submitRegister: "Utwórz konto",
    busy: "Sprawdzamy dane…",
    invalid: "Adres e-mail lub hasło są nieprawidłowe.",
    exists: "Konto z tym adresem e-mail już istnieje.",
    generic: "Nie udało się zalogować. Spróbuj ponownie.",
  },
  en: {
    title: "Sign in to WartoMetr",
    registerTitle: "Create your WartoMetr account",
    subtitle: "Your saved apartments, alerts and reports are available only in your account.",
    login: "Sign in",
    register: "New account",
    name: "Name",
    email: "Email address",
    password: "Password (at least 10 characters)",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submitLogin: "Sign in",
    submitRegister: "Create account",
    busy: "Checking your details…",
    invalid: "The email address or password is incorrect.",
    exists: "An account with this email address already exists.",
    generic: "We could not sign you in. Try again.",
  },
  ru: {
    title: "Вход в WartoMetr",
    registerTitle: "Создание аккаунта WartoMetr",
    subtitle: "Сохранённые квартиры, уведомления и отчёты доступны только в вашем аккаунте.",
    login: "Вход",
    register: "Новый аккаунт",
    name: "Имя",
    email: "Электронная почта",
    password: "Пароль (не менее 10 символов)",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
    submitLogin: "Войти",
    submitRegister: "Создать аккаунт",
    busy: "Проверяем данные…",
    invalid: "Неверная электронная почта или пароль.",
    exists: "Аккаунт с такой электронной почтой уже существует.",
    generic: "Не удалось войти. Попробуйте ещё раз.",
  },
  uk: {
    title: "Вхід у WartoMetr",
    registerTitle: "Створення акаунта WartoMetr",
    subtitle: "Збережені квартири, сповіщення та звіти доступні лише у вашому акаунті.",
    login: "Вхід",
    register: "Новий акаунт",
    name: "Ім'я",
    email: "Електронна пошта",
    password: "Пароль (щонайменше 10 символів)",
    showPassword: "Показати пароль",
    hidePassword: "Сховати пароль",
    submitLogin: "Увійти",
    submitRegister: "Створити акаунт",
    busy: "Перевіряємо дані…",
    invalid: "Неправильна електронна пошта або пароль.",
    exists: "Акаунт із такою електронною поштою вже існує.",
    generic: "Не вдалося увійти. Спробуйте ще раз.",
  },
};

export function AuthForm({ onAuthenticated }: { onAuthenticated?: () => void | Promise<void> }) {
  const { locale } = useLocalePreference();
  const copy = COPY[locale];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = mode === "register" ? copy.registerTitle : copy.title;

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "register") setMode("register");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await api.register({
          email,
          password,
          ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
        });
      } else {
        await api.login({ email, password });
      }
      window.dispatchEvent(new Event("domarion:auth-changed"));
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      if (returnTo?.startsWith("/") && !returnTo.startsWith("//") && returnTo !== "/account") {
        window.location.assign(returnTo);
        return;
      }
      await onAuthenticated?.();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) setError(copy.invalid);
      else if (caught instanceof ApiError && caught.status === 409) setError(copy.exists);
      else setError(copy.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-shell" aria-labelledby="auth-title">
      <div className="auth-copy">
        <h1 id="auth-title">{title}</h1>
        <p>{copy.subtitle}</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-mode" role="group" aria-label={title}>
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            aria-pressed={mode === "login"}
            onClick={() => { setMode("login"); setError(""); }}
          >
            <LogIn size={16} /> {copy.login}
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            aria-pressed={mode === "register"}
            onClick={() => { setMode("register"); setError(""); }}
          >
            <UserPlus size={16} /> {copy.register}
          </button>
        </div>
        {mode === "register" ? (
          <label>
            <span>{copy.name}</span>
            <input
              autoComplete="name"
              maxLength={160}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        ) : null}
        <label>
          <span>{copy.email}</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>{copy.password}</span>
          <span className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={10}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              title={showPassword ? copy.hidePassword : copy.showPassword}
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button className="button primary auth-submit" type="submit" disabled={busy}>
          {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
          {busy ? copy.busy : mode === "login" ? copy.submitLogin : copy.submitRegister}
        </button>
      </form>
    </section>
  );
}
