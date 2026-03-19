"use client";

import { useMemo, useRef } from "react";

import { parseCurrencyAmountInput } from "@/features/wall/currency";
import type { Note } from "@/features/wall/types";

const panelClass =
  "pointer-events-auto absolute z-[70] w-[min(24rem,calc(100vw-1.5rem))] rounded-[1.4rem] border border-[color:rgb(147_132_255_/_0.42)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-elevated)_64%,#4B3F72_36%)_0%,color-mix(in_srgb,var(--color-surface)_74%,#140F24_26%)_100%)] p-4 text-[var(--color-text)] shadow-[0_28px_80px_rgba(20,16,38,0.32)] backdrop-blur-[18px]";
const labelClass = "text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:rgb(220_214_255_/_0.72)]";
const inputClass =
  "w-full rounded-2xl border border-[color:rgb(147_132_255_/_0.28)] bg-[color:rgb(255_255_255_/_0.08)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[color:rgb(220_214_255_/_0.56)] focus:border-[color:rgb(147_132_255_/_0.72)]";
const subtleButtonClass =
  "rounded-full border border-[color:rgb(147_132_255_/_0.24)] bg-[color:rgb(255_255_255_/_0.08)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)] transition hover:bg-[color:rgb(255_255_255_/_0.14)] disabled:cursor-not-allowed disabled:opacity-50";

const formatUsd = (value: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 100 ? 2 : 4,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};

const formatTimestamp = (value?: number) => {
  if (!value) {
    return "Not updated yet";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(value);
  } catch {
    return new Date(value).toLocaleString();
  }
};

export const CurrencyNoteEditor = ({
  note,
  camera,
  toScreenPoint,
  onClose,
  onRefresh,
  onAmountChange,
  onSetManualBaseCurrency,
  onResetToDetectedCurrency,
}: {
  note: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onRefresh: () => void;
  onAmountChange: (value: string) => void;
  onSetManualBaseCurrency: (value: string) => void;
  onResetToDetectedCurrency: () => void;
}) => {
  const currency = note.currency;
  const baseCurrencyInputRef = useRef<HTMLInputElement | null>(null);
  const screen = toScreenPoint(note.x + note.w / 2, note.y + note.h + 18, camera);

  const convertedAmount = useMemo(
    () => parseCurrencyAmountInput(currency?.amountInput) * (currency?.usdRate ?? 1),
    [currency?.amountInput, currency?.usdRate],
  );

  const trendGlyph = currency?.trend === "up" ? "↑" : currency?.trend === "down" ? "↓" : "•";
  const statusLabel =
    currency?.status === "locating"
      ? "Locating"
      : currency?.status === "loading"
        ? "Refreshing"
        : currency?.status === "error"
          ? "Fallback"
          : currency?.rateSource === "cache"
            ? "Cached"
            : "Live";

  const baseCurrencyValue = currency?.manualBaseCurrency ?? currency?.baseCurrency ?? "USD";

  return (
    <div className={panelClass} style={{ left: `${screen.x}px`, top: `${screen.y}px`, transform: "translate(-50%, 0)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={labelClass}>Currency Widget</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{currency?.baseCurrency ?? "USD"} to USD</h3>
          <p className="mt-1 text-xs text-[color:rgb(233_230_255_/_0.72)]">
            {currency?.detectedCountryName ?? "Default region"}
            {currency?.detectedCurrency ? ` • detected ${currency.detectedCurrency}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className={subtleButtonClass}>
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[1.2rem] border border-[color:rgb(147_132_255_/_0.2)] bg-[color:rgb(255_255_255_/_0.08)] p-3">
          <p className={labelClass}>1 {currency?.baseCurrency ?? "USD"}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatUsd(currency?.usdRate ?? 1)}</p>
          <p className="mt-1 text-xs text-[color:rgb(220_214_255_/_0.72)]">
            {trendGlyph} {statusLabel}
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-[color:rgb(147_132_255_/_0.2)] bg-[color:rgb(255_255_255_/_0.08)] p-3">
          <p className={labelClass}>1000 {currency?.baseCurrency ?? "USD"}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatUsd(currency?.thousandValueUsd ?? 1000)}</p>
          <p className="mt-1 text-xs text-[color:rgb(220_214_255_/_0.72)]">Updated {formatTimestamp(currency?.rateUpdatedAt)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.3fr_1fr]">
        <div>
          <label className={labelClass}>Quick Converter</label>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={currency?.amountInput ?? ""}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="Enter amount"
              className={inputClass}
            />
            <div className="min-w-[7.5rem] rounded-2xl border border-[color:rgb(147_132_255_/_0.2)] bg-[color:rgb(255_255_255_/_0.08)] px-3 py-2 text-right text-sm font-semibold text-white">
              {formatUsd(convertedAmount)}
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Base Currency</label>
          <div className="mt-2 flex gap-2">
            <input
              key={baseCurrencyValue}
              ref={baseCurrencyInputRef}
              type="text"
              maxLength={3}
              defaultValue={baseCurrencyValue}
              className={inputClass}
              placeholder="CAD"
            />
            <button
              type="button"
              onClick={() => onSetManualBaseCurrency(baseCurrencyInputRef.current?.value ?? baseCurrencyValue)}
              className={subtleButtonClass}
            >
              Apply
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={onResetToDetectedCurrency} className={subtleButtonClass}>
              Use detected
            </button>
            <button type="button" onClick={onRefresh} className={subtleButtonClass}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[color:rgb(220_214_255_/_0.76)]">
        <span className="rounded-full border border-[color:rgb(147_132_255_/_0.24)] bg-[color:rgb(255_255_255_/_0.08)] px-2.5 py-1">
          Source: {currency?.rateSource ?? "default"}
        </span>
        <span className="rounded-full border border-[color:rgb(147_132_255_/_0.24)] bg-[color:rgb(255_255_255_/_0.08)] px-2.5 py-1">
          Base mode: {currency?.baseCurrencyMode ?? "auto"}
        </span>
        {currency?.error && <span className="text-[rgb(255_206_206)]">{currency.error}</span>}
      </div>
    </div>
  );
};
