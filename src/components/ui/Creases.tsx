import React from 'react';
import { cn } from '@/lib/utils';

interface CreasesProps {
  done: number;
  total: number;
  className?: string;
}

/** Crease marks: one tick per unit, filled left to right, capped at 8. */
export const Creases: React.FC<CreasesProps> = ({ done, total, className }) => (
  <span className={cn('flex gap-1', className)} aria-hidden="true">
    {Array.from({ length: Math.min(total, 8) }, (_, i) => (
      <span
        key={i}
        className={cn('h-1.5 w-5 rounded-[1px] transition-colors duration-200', i < done ? 'bg-primary' : 'bg-border')}
      />
    ))}
  </span>
);
