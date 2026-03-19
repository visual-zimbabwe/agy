import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  base: z.string().trim().length(3),
});

type CurrencyApiLatestResponse = {
  meta?: {
    last_updated_at?: string;
  };
  data?: {
    USD?: {
      code?: string;
      value?: number;
    };
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    base: url.searchParams.get("base")?.toUpperCase(),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid base currency" }, { status: 400 });
  }

  const apiKey = process.env.CURRENCY_API_KEY ?? process.env.CURRENCYAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing CURRENCY_API_KEY or CURRENCYAPI_API_KEY" }, { status: 503 });
  }

  const upstreamUrl = new URL("https://api.currencyapi.com/v3/latest");
  upstreamUrl.searchParams.set("base_currency", parsed.data.base);
  upstreamUrl.searchParams.set("currencies", "USD");

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        apikey: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: body || `Currency API request failed with ${response.status}`,
        },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as CurrencyApiLatestResponse;
    const usdRate = payload.data?.USD?.value;
    if (typeof usdRate !== "number" || !Number.isFinite(usdRate)) {
      return NextResponse.json({ error: "USD rate unavailable from Currency API" }, { status: 502 });
    }

    return NextResponse.json({
      baseCurrency: parsed.data.base,
      usdRate,
      lastUpdatedAt: payload.meta?.last_updated_at ?? new Date().toISOString(),
      quotas: {
        remainingMinute: response.headers.get("X-RateLimit-Remaining-Quota-Minute"),
        remainingMonth: response.headers.get("X-RateLimit-Remaining-Quota-Month"),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Currency API request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
