"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

export const FieldLabel = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("block text-sm font-medium text-[var(--color-text)]", className)} {...props} />
);

const baseFieldClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(baseFieldClass, className)} {...props} />
));

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(baseFieldClass, className)} {...props} />
));

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseFieldClass, className)} {...props} />
));

TextField.displayName = "TextField";
SelectField.displayName = "SelectField";
TextAreaField.displayName = "TextAreaField";
