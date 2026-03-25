"use client";

import { useMemo, useRef } from "react";

import { parseCurrencyAmountInput } from "@/features/wall/currency";
import type { Note } from "@/features/wall/types";

const panelClass =
  "pointer-events-auto absolute z-[70] w-[min(24rem,calc(100vw-1.5rem))] rounded-[1.6rem] border border-[rgba(186,174,227,0.95)] bg-[linear-gradient(180deg,rgba(253,251,247,0.98)_0%,rgba(244,239,248,0.96)_100%)] p-4 text-[#221f2c] shadow-[0_28px_80px_rgba(37,30,56,0.18)] backdrop-blur-[18px]";
const labelClass = "text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(122,113,145,0.88)]";
const inputClass =
  "w-full rounded-2xl border border-[rgba(184,174,214,0.96)] bg-white px-3 py-2 text-sm font-medium text-[#221f2c] outline-none placeholder:text-[rgba(122,113,145,0.7)] focus:border-[#6f8d76] focus:ring-2 focus:ring-[rgba(111,141,118,0.15)]";
const subtleButtonClass =
  "rounded-full border border-[rgba(184,174,214,0.96)] bg-[rgba(247,244,251,0.98)] px-3 py-1.5 text-[11px] font-medium text-[#2d2939] transition hover:border-[#6f8d76] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50";
const statCardClass = "rounded-[1.25rem] border border-[rgba(186,174,227,0.95)] bg-white/88 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]";
const pillClass = "rounded-full border border-[rgba(186,174,227,0.9)] bg-[rgba(247,244,251,0.95)] px-2.5 py-1 text-[11px] text-[rgba(88,79,112,0.9)]";
const valueChipClass = "min-w-[7.5rem] rounded-2xl border border-[rgba(186,174,227,0.95)] bg-white px-3 py-2 text-right text-sm font-semibold text-[#2d2939]";

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
          <h3 className="mt-1 text-lg font-semibold text-[#221f2c]">{currency?.baseCurrency ?? "USD"} to USD</h3>
          <p className="mt-1 text-xs text-[rgba(109,100,133,0.88)]">
            {currency?.detectedCountryName ?? "Default region"}
            {currency?.detectedCurrency ? ` • detected ${currency.detectedCurrency}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className={subtleButtonClass}>
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className={statCardClass}>
          <p className={labelClass}>1 {currency?.baseCurrency ?? "USD"}</p>
          <p className="mt-2 text-2xl font-semibold text-[#221f2c]">{formatUsd(currency?.usdRate ?? 1)}</p>
          <p className="mt-1 text-xs text-[rgba(109,100,133,0.82)]">
            {trendGlyph} {statusLabel}
          </p>
        </div>
        <div className={statCardClass}>
          <p className={labelClass}>1000 {currency?.baseCurrency ?? "USD"}</p>
          <p className="mt-2 text-2xl font-semibold text-[#221f2c]">{formatUsd(currency?.thousandValueUsd ?? 1000)}</p>
          <p className="mt-1 text-xs text-[rgba(109,100,133,0.82)]">Updated {formatTimestamp(currency?.rateUpdatedAt)}</p>
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
            <div className={valueChipClass}>
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

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[rgba(88,79,112,0.92)]">
        <span className={pillClass}>
          Source: {currency?.rateSource ?? "default"}
        </span>
        <span className={pillClass}>
          Base mode: {currency?.baseCurrencyMode ?? "auto"}
        </span>
        {currency?.error && <span className="rounded-full bg-[rgba(170,53,68,0.10)] px-2.5 py-1 text-[#8f2f3f]">{currency.error}</span>}
      </div>
    </div>
  );
};
