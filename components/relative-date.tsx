"use client";

import { useEffect, useState } from "react";
import { differenceInYears, format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  date: string | Date;
  className?: string;
};

export function RelativeDate({ date, className }: Props) {
  const d = typeof date === "string" ? new Date(date) : date;
  const iso = d.toISOString();
  const absolute = format(d, "PPpp");

  const computeLabel = () => {
    if (differenceInYears(new Date(), d) >= 1) {
      return format(d, "MMM d, yyyy");
    }
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const [label, setLabel] = useState(() => computeLabel());

  useEffect(() => {
    setLabel(computeLabel());
    const id = setInterval(() => setLabel(computeLabel()), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  return (
    <time dateTime={iso} title={absolute} className={cn(className)}>
      {label}
    </time>
  );
}
