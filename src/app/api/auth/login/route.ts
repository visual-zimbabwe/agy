import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const getAuthErrorDetails = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) {
    const status =
      "status" in error && typeof error.status === "number" ? error.status : undefined;
    const isRetryable = error.name === "AuthRetryableFetchError" || (status !== undefined && status >= 500);

    return {
      message: isRetryable
        ? "Authentication service is temporarily unavailable. Please try again."
        : error.message,
      status: isRetryable ? 503 : status === 401 || status === 400 ? 401 : 401,
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const status = typeof record.status === "number" ? record.status : undefined;
    const isRetryable =
      record.name === "AuthRetryableFetchError" || (status !== undefined && status >= 500);
    const candidates = [
      record.message,
      record.error_description,
      record.error,
      record.msg,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return {
          message: isRetryable
            ? "Authentication service is temporarily unavailable. Please try again."
            : candidate,
          status: isRetryable ? 503 : status === 401 || status === 400 ? 401 : 401,
        };
      }
    }

    if (isRetryable) {
      return {
        message: "Authentication service is temporarily unavailable. Please try again.",
        status: 503,
      };
    }
  }

  return {
    message: "Invalid email or password.",
    status: 401,
  };
};

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email or password payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      const authError = getAuthErrorDetails(error);
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? `Unable to reach sign-in service. ${error.message}`
        : "Unable to reach sign-in service. Check your connection and try again.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
