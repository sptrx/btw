"use client";

import { useMemo, useState } from "react";
import { ChevronDown, MapPin, X } from "lucide-react";
import { listCountryOptions } from "@/lib/geo";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (code: string | null) => void;
  name?: string;
  label?: string;
  hint?: string;
  className?: string;
  id?: string;
};

export function CountryPicker({
  value,
  onChange,
  name = "country_code",
  label = "Where are you sharing from?",
  hint = "Share where you're from (optional) — country only, never city or precise location.",
  className,
  id = "country-picker",
}: Props) {
  const options = useMemo(() => listCountryOptions(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.code === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 80);
    return options
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [options, query]);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={`${id}-search`} className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
        {label}
      </label>
      {hint ? (
        <p className="mb-2 text-xs text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}

      <input type="hidden" name={name} value={value ?? ""} />

      <div className="flex gap-2">
        <button
          type="button"
          id={`${id}-search`}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-between gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-left text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selected ? (
              <>
                <span aria-hidden>{selected.flag} </span>
                {selected.name}
              </>
            ) : (
              "Select country (optional)"
            )}
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-input px-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label="Clear country"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg"
          role="listbox"
          aria-label="Countries"
        >
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
            ) : (
              filtered.map((o) => (
                <li key={o.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === o.code}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60",
                      value === o.code && "bg-primary/10 text-primary"
                    )}
                    onClick={() => {
                      onChange(o.code);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span aria-hidden>{o.flag}</span>
                    <span>{o.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
