"use client";

import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export const FieldLabel = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("block text-sm font-medium text-[var(--color-text)]", className)} {...props} />
);

const baseFieldClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";

export const TextField = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(baseFieldClass, className)} {...props} />
);

export const SelectField = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(baseFieldClass, className)} {...props} />
);

export const TextAreaField = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(baseFieldClass, className)} {...props} />
);
