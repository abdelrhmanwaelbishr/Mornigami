import React from 'react';
import { cn } from '@/lib/utils';

interface StatProps {
  value: string;
  label: string;
  note?: string;
  /** Small prefix on the value line, e.g. a currency code. */
  prefix?: string;
  className?: string;
}

/** One measure of the day: big display numeral, small label, smaller note. */
export const Stat: React.FC<StatProps> = ({ value, label, note, prefix, className }) => (
  <div className={cn('bg-surface p-4 sm:p-5', className)}>
    <p className="flex items-baseline gap-1 font-display text-2xl font-black leading-none tracking-tight text-text-primary tabular-nums sm:text-3xl">
      {prefix && <span className="text-xs font-bold text-text-secondary">{prefix}</span>}
      <span className="whitespace-nowrap">{value}</span>
    </p>
    <p className="mt-2 text-xs font-medium text-text-secondary">{label}</p>
    {note && <p className="mt-1 text-xs text-text-secondary">{note}</p>}
  </div>
);
