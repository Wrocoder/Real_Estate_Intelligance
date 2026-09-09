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

type RequestOptions = {
  suppressAuthRequired?: boolean;
};

export async function request<T>(path: string, init?: RequestInit, options: RequestOptions = {}): Promise<T> {
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
    let errorCode = errorCodeForStatus(response.status);
    let errorParams: Record<string, unknown> = {};
    let correlationId: string | null = response.headers.get("X-Request-ID");
    try {
      const parsed = JSON.parse(body) as {
        detail?: {
          code?: string;
          params?: Record<string, unknown>;
          correlation_id?: string;
        };
        error?: {
          code?: string;
          params?: Record<string, unknown>;
          correlation_id?: string;
        };
      };
      const error = parsed.error ?? parsed.detail;
      if (error) {
        errorCode = error.code ?? "request_failed";
        errorParams = error.params ?? {};
        correlationId = error.correlation_id ?? correlationId;
      }
    } catch {
      // Non-JSON upstream responses are intentionally not exposed to consumer UI.
    }
    const isCredentialAttempt = path === "/api/v1/auth/login";
    if (
      typeof window !== "undefined" &&
      !isCredentialAttempt &&
      !options.suppressAuthRequired &&
      (response.status === 401 || response.status === 403)
    ) {
      const reason = response.status === 403 ? "forbidden" : errorCode === "auth_required" ? "required" : "expired";
      window.dispatchEvent(
        new CustomEvent("domarion:auth-required", {
          detail: { status: response.status, reason },
        }),
      );
    }
    throw new ApiError(response.status, errorCode, errorCode, errorParams, correlationId);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function errorCodeForStatus(status: number): string {
  return (
    {
      400: "bad_request",
      401: "auth_required",
      403: "forbidden",
      404: "not_found",
      409: "conflict",
      413: "payload_too_large",
      422: "validation_error",
      429: "rate_limited",
      500: "internal_error",
      503: "service_unavailable",
    }[status] ?? "request_failed"
  );
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
