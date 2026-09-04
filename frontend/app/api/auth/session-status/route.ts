import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthSession } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/session`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (response.status === 401) {
      return NextResponse.json({ authenticated: false });
    }
    if (!response.ok) {
      return NextResponse.json({ authenticated: null }, { status: 503 });
    }

    const session = (await response.json()) as AuthSession;
    return NextResponse.json({ authenticated: true, session });
  } catch {
    return NextResponse.json({ authenticated: null }, { status: 503 });
  }
}
