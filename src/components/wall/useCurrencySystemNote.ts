"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  buildCurrencySystemNote,
  CURRENCY_NOTE_AUTO_REFRESH_TTL_MS,
  CURRENCY_NOTE_ID,
  CURRENCY_NOTE_LOCATION_CACHE_KEY,
  CURRENCY_NOTE_MAX_STALE_MS,
  CURRENCY_NOTE_RATES_CACHE_KEY,
  CURRENCY_NOTE_REFRESH_DEBOUNCE_MS,
  defaultCurrencyNoteState,
  inferCurrencyFromCountry,
  inferCurrencyTrend,
  isCurrencyNote,
  normalizeCurrencyCode,
  parseCurrencyAmountInput,
  type CurrencyLocationCache,
  type CurrencyRatesCache,
} from "@/features/wall/currency";
import { useWallStore } from "@/features/wall/store";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const now = () => Date.now();

const readLocationCache = () => parseJson<CurrencyLocationCache>(readStorageValue(CURRENCY_NOTE_LOCATION_CACHE_KEY));

const writeLocationCache = (value: CurrencyLocationCache) => {
  writeStorageValue(CURRENCY_NOTE_LOCATION_CACHE_KEY, JSON.stringify(value));
};

const readRatesCache = () => parseJson<CurrencyRatesCache>(readStorageValue(CURRENCY_NOTE_RATES_CACHE_KEY)) ?? {};

const writeRatesCache = (value: CurrencyRatesCache) => {
  writeStorageValue(CURRENCY_NOTE_RATES_CACHE_KEY, JSON.stringify(value));
};

const getCurrentCurrencyNote = () => {
  const note = useWallStore.getState().notes[CURRENCY_NOTE_ID];
  return note && isCurrencyNote(note) ? note : undefined;
};

const ensureCurrencyNote = () => {
  const state = useWallStore.getState();
  const existing = state.notes[CURRENCY_NOTE_ID];
  const normalized = buildCurrencySystemNote(existing);
  state.upsertNote(normalized);
  return normalized;
};

const fetchIpLocation = async (): Promise<CurrencyLocationCache> => {
  const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`IP lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    country_code?: string;
    country_name?: string;
    currency?: string;
  };

  return {
    countryCode: payload.country_code?.trim().toUpperCase() || undefined,
    countryName: payload.country_name?.trim() || undefined,
    currency: normalizeCurrencyCode(payload.currency) ?? inferCurrencyFromCountry(payload.country_code) ?? "USD",
    source: "ip",
    cachedAt: now(),
  };
};

const getBrowserPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 7000,
      maximumAge: 10 * 60 * 1000,
    });
  });

const fetchGeoLocation = async (): Promise<CurrencyLocationCache> => {
  const position = await getBrowserPosition();
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(position.coords.latitude));
  url.searchParams.set("longitude", String(position.coords.longitude));
  url.searchParams.set("localityLanguage", "en");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Reverse geocode failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    countryCode?: string;
    countryName?: string;
  };
  const countryCode = payload.countryCode?.trim().toUpperCase();

  return {
    countryCode,
    countryName: payload.countryName?.trim() || undefined,
    currency: inferCurrencyFromCountry(countryCode) ?? "USD",
    source: "geolocation",
    cachedAt: now(),
  };
};

const resolveLocation = async (force: boolean) => {
  const cached = readLocationCache();
  if (!force && cached && now() - cached.cachedAt < CURRENCY_NOTE_AUTO_REFRESH_TTL_MS) {
    return cached;
  }

  try {
    const geolocation = await fetchGeoLocation();
    writeLocationCache(geolocation);
    return geolocation;
  } catch {
    try {
      const ip = await fetchIpLocation();
      writeLocationCache(ip);
      return ip;
    } catch {
      const fallback: CurrencyLocationCache = {
        currency: "USD",
        source: "default",
        cachedAt: now(),
      };
      writeLocationCache(fallback);
      return fallback;
    }
  }
};


export const useCurrencySystemNote = ({ hydrated, publishedReadOnly }: { hydrated: boolean; publishedReadOnly: boolean }) => {
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastManualRefreshRef = useRef(0);

  const refreshCurrencyNote = useCallback(
    async ({ force = false, ignoreDebounce = false }: { force?: boolean; ignoreDebounce?: boolean } = {}) => {
      if (publishedReadOnly) {
        return;
      }

      const currentTs = now();
      if (force && !ignoreDebounce && currentTs - lastManualRefreshRef.current < CURRENCY_NOTE_REFRESH_DEBOUNCE_MS) {
        return;
      }
      if (force) {
        lastManualRefreshRef.current = currentTs;
      }
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      inFlightRef.current = (async () => {
        const state = useWallStore.getState();
        const note = getCurrentCurrencyNote() ?? ensureCurrencyNote();
        const currentCurrency = defaultCurrencyNoteState(note.currency);
        const isManual = currentCurrency.baseCurrencyMode === "manual" && Boolean(normalizeCurrencyCode(currentCurrency.manualBaseCurrency));

        state.patchNote(note.id, {
          currency: {
            ...currentCurrency,
            status: isManual ? "loading" : "locating",
            error: undefined,
          },
        });

        const location = await resolveLocation(force);
        const detectedCurrency = normalizeCurrencyCode(location.currency) ?? "USD";
        const manualBaseCurrency = normalizeCurrencyCode(currentCurrency.manualBaseCurrency);
        const baseCurrency = isManual ? manualBaseCurrency ?? "USD" : detectedCurrency;
        const ratesCache = readRatesCache();
        const cachedRate = ratesCache[baseCurrency];
        const cacheAge = cachedRate ? currentTs - cachedRate.updatedAt : Number.POSITIVE_INFINITY;

        const applyResult = (options: {
          usdRate: number;
          previousUsdRate?: number;
          updatedAt?: number;
          rateSource: "live" | "cache" | "default";
          error?: string;
        }) => {
          const nextCurrency = defaultCurrencyNoteState({
            ...currentCurrency,
            status: options.error && options.rateSource === "default" ? "error" : "ready",
            detectedCountryCode: location.countryCode,
            detectedCountryName: location.countryName,
            detectedCurrency,
            baseCurrency,
            manualBaseCurrency,
            baseCurrencyMode: isManual ? "manual" : "auto",
            amountInput: currentCurrency.amountInput || "1000",
            usdRate: options.usdRate,
            previousUsdRate: options.previousUsdRate,
            thousandValueUsd: options.usdRate * 1000,
            rateUpdatedAt: options.updatedAt,
            rateSource: options.rateSource,
            detectionSource: isManual ? "manual" : location.source,
            trend: inferCurrencyTrend(options.usdRate, options.previousUsdRate),
            error: options.error,
          });

          useWallStore.getState().patchNote(note.id, {
            currency: nextCurrency,
            color: note.color,
            textColor: note.textColor,
            textFont: note.textFont,
            w: note.w,
            h: note.h,
          });
        };

        if (!force && cachedRate && cacheAge < CURRENCY_NOTE_AUTO_REFRESH_TTL_MS) {
          applyResult({
            usdRate: cachedRate.usdRate,
            previousUsdRate: cachedRate.previousUsdRate,
            updatedAt: cachedRate.updatedAt,
            rateSource: "cache",
          });
          return;
        }

        if (baseCurrency === "USD") {
          const previousUsdRate = cachedRate?.usdRate ?? currentCurrency.usdRate;
          ratesCache.USD = {
            baseCurrency: "USD",
            usdRate: 1,
            previousUsdRate,
            updatedAt: currentTs,
          };
          writeRatesCache(ratesCache);
          applyResult({
            usdRate: 1,
            previousUsdRate,
            updatedAt: currentTs,
            rateSource: force ? "live" : "default",
          });
          return;
        }

        try {
          const response = await fetch(`/api/currency?base=${encodeURIComponent(baseCurrency)}`, {
            cache: "no-store",
          });
          const payload = (await response.json()) as {
            usdRate?: number;
            lastUpdatedAt?: string;
            error?: string;
          };

          if (!response.ok || typeof payload.usdRate !== "number") {
            throw new Error(payload.error ?? `Currency route failed with ${response.status}`);
          }

          const updatedAt = payload.lastUpdatedAt ? Date.parse(payload.lastUpdatedAt) : currentTs;
          const previousUsdRate = cachedRate?.usdRate ?? currentCurrency.usdRate;
          ratesCache[baseCurrency] = {
            baseCurrency,
            usdRate: payload.usdRate,
            previousUsdRate,
            updatedAt,
          };
          writeRatesCache(ratesCache);
          applyResult({
            usdRate: payload.usdRate,
            previousUsdRate,
            updatedAt,
            rateSource: "live",
          });
        } catch (error) {
          if (cachedRate && currentTs - cachedRate.updatedAt < CURRENCY_NOTE_MAX_STALE_MS) {
            applyResult({
              usdRate: cachedRate.usdRate,
              previousUsdRate: cachedRate.previousUsdRate,
              updatedAt: cachedRate.updatedAt,
              rateSource: "cache",
              error: error instanceof Error ? error.message : "Using cached currency rate",
            });
            return;
          }

          applyResult({
            usdRate: baseCurrency === "USD" ? 1 : currentCurrency.usdRate || 1,
            previousUsdRate: currentCurrency.previousUsdRate,
            updatedAt: currentCurrency.rateUpdatedAt,
            rateSource: currentCurrency.rateUpdatedAt ? "cache" : "default",
            error: error instanceof Error ? error.message : "Currency lookup failed",
          });
        }
      })().finally(() => {
        inFlightRef.current = null;
      });

      return inFlightRef.current;
    },
    [publishedReadOnly],
  );

  useEffect(() => {
    if (!hydrated || publishedReadOnly) {
      return;
    }

    ensureCurrencyNote();
  }, [hydrated, publishedReadOnly]);

  useEffect(() => {
    if (!hydrated || publishedReadOnly) {
      return;
    }

    const run = () => {
      void refreshCurrencyNote();
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleHandle = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleHandle);
    }

    const timer = globalThis.setTimeout(run, 450);
    return () => globalThis.clearTimeout(timer);
  }, [hydrated, publishedReadOnly, refreshCurrencyNote]);

  const updateAmountInput = useCallback((value: string) => {
    const note = getCurrentCurrencyNote();
    if (!note) {
      return;
    }
    useWallStore.getState().patchNote(note.id, {
      currency: {
        ...defaultCurrencyNoteState(note.currency),
        amountInput: value,
      },
    });
  }, []);

  const setManualBaseCurrency = useCallback(
    async (value: string) => {
      const normalized = normalizeCurrencyCode(value) ?? "USD";
      const note = getCurrentCurrencyNote() ?? ensureCurrencyNote();
      useWallStore.getState().patchNote(note.id, {
        currency: {
          ...defaultCurrencyNoteState(note.currency),
          baseCurrencyMode: "manual",
          manualBaseCurrency: normalized,
          baseCurrency: normalized,
          error: undefined,
        },
      });
      await refreshCurrencyNote({ force: true, ignoreDebounce: true });
    },
    [refreshCurrencyNote],
  );

  const resetToDetectedCurrency = useCallback(async () => {
    const note = getCurrentCurrencyNote() ?? ensureCurrencyNote();
    const currentCurrency = defaultCurrencyNoteState(note.currency);
    useWallStore.getState().patchNote(note.id, {
      currency: {
        ...currentCurrency,
        baseCurrencyMode: "auto",
        manualBaseCurrency: undefined,
        error: undefined,
      },
    });
    await refreshCurrencyNote({ force: true, ignoreDebounce: true });
  }, [refreshCurrencyNote]);

  const getConvertedUsdAmount = useCallback(() => {
    const note = getCurrentCurrencyNote();
    const currency = defaultCurrencyNoteState(note?.currency);
    return parseCurrencyAmountInput(currency.amountInput) * currency.usdRate;
  }, []);

  return {
    refreshCurrencyNote,
    updateAmountInput,
    setManualBaseCurrency,
    resetToDetectedCurrency,
    getConvertedUsdAmount,
  };
};





