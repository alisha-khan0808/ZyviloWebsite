"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label} {required ? <span className="text-purple" aria-hidden>*</span> : <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props that wire an input to its Field's error/hint text. */
export function a11y(id: string, error?: string, hint?: string, required?: boolean) {
  return {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    "aria-required": required || undefined,
  } as const;
}

export function ChipGroup({
  name,
  legend,
  options,
  value,
  onChange,
  multiple,
  required,
  error,
  hint,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  value: string[] | string | null | undefined;
  onChange: (v: string[] | string) => void;
  multiple?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} aria-invalid={error ? true : undefined}>
      <legend className="label">
        {legend} {required ? <span className="text-purple" aria-hidden>*</span> : <span className="font-normal text-muted">(optional)</span>}
      </legend>
      {hint && <p className="-mt-1 mb-2 text-xs text-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <label
              key={opt}
              className={clsx(
                "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-purple",
                on ? "border-purple bg-purple text-white" : "border-line bg-white text-navy hover:border-lilac",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={opt}
                checked={on}
                className="sr-only"
                onChange={() => {
                  if (multiple) onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt]);
                  else onChange(on && !required ? "" : opt);
                }}
              />
              {on && <Check className="h-3.5 w-3.5" aria-hidden />}
              {opt}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
