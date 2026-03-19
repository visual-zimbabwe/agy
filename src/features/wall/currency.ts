import type { CurrencyNote, Note } from "@/features/wall/types";

export const CURRENCY_NOTE_ID = "system-currency-note";
export const CURRENCY_NOTE_COLOR = "#234990";
export const CURRENCY_NOTE_BORDER = "#9384FF";
export const CURRENCY_NOTE_TITLE = "Forex Exchange";
export const CURRENCY_NOTE_DEFAULTS = {
  color: CURRENCY_NOTE_COLOR,
  width: 332,
  height: 224,
  x: -520,
  y: -320,
  textColor: "#F8F7FF",
  textFont: "work_sans" as const,
  textSizePx: 15,
};

export const CURRENCY_NOTE_LOCATION_CACHE_KEY = "agy-currency-location-v1";
export const CURRENCY_NOTE_RATES_CACHE_KEY = "agy-currency-rates-v1";
export const CURRENCY_NOTE_AUTO_REFRESH_TTL_MS = 30 * 60 * 1000;
export const CURRENCY_NOTE_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;
export const CURRENCY_NOTE_REFRESH_DEBOUNCE_MS = 10_000;

export type CurrencyLocationCache = {
  countryCode?: string;
  countryName?: string;
  currency?: string;
  source: "geolocation" | "ip" | "manual" | "default";
  cachedAt: number;
};

export type CurrencyRateCacheEntry = {
  baseCurrency: string;
  usdRate: number;
  previousUsdRate?: number;
  updatedAt: number;
};

export type CurrencyRatesCache = Record<string, CurrencyRateCacheEntry>;

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AE: "AED",
  AR: "ARS",
  AT: "EUR",
  AU: "AUD",
  BE: "EUR",
  BG: "BGN",
  BH: "BHD",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CL: "CLP",
  CN: "CNY",
  CO: "COP",
  CR: "CRC",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DK: "DKK",
  DO: "DOP",
  DZ: "DZD",
  EE: "EUR",
  EG: "EGP",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GB: "GBP",
  GH: "GHS",
  GR: "EUR",
  HK: "HKD",
  HR: "EUR",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IN: "INR",
  IS: "ISK",
  IT: "EUR",
  JM: "JMD",
  JO: "JOD",
  JP: "JPY",
  KE: "KES",
  KR: "KRW",
  KW: "KWD",
  KZ: "KZT",
  LB: "LBP",
  LK: "LKR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MA: "MAD",
  MT: "EUR",
  MX: "MXN",
  MY: "MYR",
  NG: "NGN",
  NL: "EUR",
  NO: "NOK",
  NZ: "NZD",
  OM: "OMR",
  PE: "PEN",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PT: "EUR",
  QA: "QAR",
  RO: "RON",
  RS: "RSD",
  SA: "SAR",
  SE: "SEK",
  SG: "SGD",
  SI: "EUR",
  SK: "EUR",
  TH: "THB",
  TN: "TND",
  TR: "TRY",
  TW: "TWD",
  TZ: "TZS",
  UA: "UAH",
  US: "USD",
  UY: "UYU",
  VN: "VND",
  ZA: "ZAR",
  ZW: "USD",
};

export const normalizeCurrencyCode = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : undefined;
};

export const inferCurrencyFromCountry = (countryCode?: string | null) => {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }
  return COUNTRY_TO_CURRENCY[normalized];
};

export const inferCurrencyTrend = (currentRate: number, previousRate?: number): CurrencyNote["trend"] => {
  if (typeof previousRate !== "number" || !Number.isFinite(previousRate)) {
    return "flat";
  }
  if (Math.abs(currentRate - previousRate) < 0.000001) {
    return "flat";
  }
  return currentRate > previousRate ? "up" : "down";
};

export const defaultCurrencyNoteState = (overrides?: Partial<CurrencyNote>): CurrencyNote => ({
  status: "idle",
  baseCurrency: "USD",
  baseCurrencyMode: "auto",
  amountInput: "1000",
  usdRate: 1,
  thousandValueUsd: 1000,
  rateSource: "default",
  detectionSource: "default",
  trend: "flat",
  ...overrides,
});

export const buildCurrencySystemNote = (existing?: Note): Note => {
  const now = Date.now();
  return {
    id: existing?.id ?? CURRENCY_NOTE_ID,
    noteKind: "currency",
    text: "",
    quoteAuthor: undefined,
    quoteSource: undefined,
    canon: undefined,
    eisenhower: undefined,
    currency: defaultCurrencyNoteState(existing?.currency),
    imageUrl: undefined,
    textAlign: "left",
    textVAlign: "top",
    textFont: CURRENCY_NOTE_DEFAULTS.textFont,
    textColor: CURRENCY_NOTE_DEFAULTS.textColor,
    textSizePx: CURRENCY_NOTE_DEFAULTS.textSizePx,
    tags: ["system", "currency"],
    textSize: "md",
    pinned: false,
    highlighted: false,
    x: existing?.x ?? CURRENCY_NOTE_DEFAULTS.x,
    y: existing?.y ?? CURRENCY_NOTE_DEFAULTS.y,
    w: existing?.w ?? CURRENCY_NOTE_DEFAULTS.width,
    h: existing?.h ?? CURRENCY_NOTE_DEFAULTS.height,
    color: CURRENCY_NOTE_DEFAULTS.color,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing?.updatedAt ?? now,
    vocabulary: undefined,
  };
};

export const isCurrencyNote = (note?: Pick<Note, "noteKind"> | null): note is Pick<Note, "noteKind"> & { noteKind: "currency" } =>
  Boolean(note && note.noteKind === "currency");

export const isSystemNote = (note?: Pick<Note, "noteKind"> | null) => isCurrencyNote(note);

export const getCurrencyNoteBaseCurrency = (note?: Pick<Note, "currency"> | null) =>
  normalizeCurrencyCode(note?.currency?.baseCurrency) ?? "USD";

export const parseCurrencyAmountInput = (value?: string | null) => {
  const normalized = value?.replace(/,/g, "").trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
