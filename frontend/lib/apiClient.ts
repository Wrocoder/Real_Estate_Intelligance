export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "request_failed",
    public readonly params: Record<string, unknown> = {},
    public readonly correlationId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function currentApiBaseUrl() {
  return API_BASE_URL;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = currentApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      credentials: "include",
    });
  } catch (caught) {
    throw new ApiError(0, caught instanceof Error ? caught.message : "network error", "network_error");
  }

  if (!response.ok) {
    const body = await response.text();
    let detail = body;
    let errorCode = "request_failed";
    let errorParams: Record<string, unknown> = {};
    let correlationId: string | null = null;
    try {
      const parsed = JSON.parse(body) as {
        detail?: string | object;
        error?: { code?: string; params?: Record<string, unknown>; correlation_id?: string };
      };
      detail = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
      if (parsed.error) {
        const error = parsed.error;
        errorCode = error.code ?? "request_failed";
        errorParams = error.params ?? {};
        correlationId = error.correlation_id ?? null;
      }
    } catch {
      // Keep the plain response body when it is not JSON.
    }
    if (response.status === 400 && typeof detail === "string") {
      if (/area statistics are not available|unsupported.*(?:area|district|city)/i.test(detail)) {
        errorCode = "unsupported_area";
      } else if (/geocod(?:e|ing)|location/i.test(detail)) {
        errorCode = "location_unavailable";
      }
    }
    const isCredentialAttempt = path === "/api/v1/auth/login";
    if (
      typeof window !== "undefined" &&
      !isCredentialAttempt &&
      (response.status === 401 || response.status === 403)
    ) {
      const reason =
        response.status === 401 && detail === "Sign in is required" ? "required" : "expired";
      window.dispatchEvent(
        new CustomEvent("domarion:auth-required", {
          detail: { status: response.status, reason },
        }),
      );
    }
    throw new ApiError(response.status, detail || response.statusText, errorCode, errorParams, correlationId);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function authenticatedFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${currentApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
  });
  if (typeof window !== "undefined" && (response.status === 401 || response.status === 403)) {
    window.dispatchEvent(
      new CustomEvent("domarion:auth-required", {
        detail: {
          status: response.status,
          reason: response.status === 401 ? "expired" : "forbidden",
        },
      }),
    );
  }
  return response;
}
